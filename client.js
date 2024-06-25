'use strict';
const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');
const RPC = require('@hyperswarm/rpc');
const DHT = require('hyperdht');
const crypto = require('crypto');
const Auction = require('./auction');
const retry = require('async-retry');

const peers = []; // List of known peers

const main = async () => {
  const auctionFeed = new Hypercore('./db/auction-data');
  await auctionFeed.ready();
  const auctionDB = new Hyperbee(auctionFeed, { keyEncoding: 'utf-8', valueEncoding: 'json' });

  const seedLength = 32;
  const seed = crypto.randomBytes(seedLength);
  const keyPair = DHT.keyPair(seed);

  const dht = new DHT({
    port: 50001,
    keyPair: keyPair,
    bootstrap: [{ host: '127.0.0.1', port: 30001 }]
  });
  await dht.ready();

  const rpc = new RPC({ dht });
  const rpcServer = rpc.createServer();

  rpcServer.respond('open-auction', async (req) => {
    const { auctionId, item, startingBid } = req;
    console.log(`Received open-auction request with auctionId: ${auctionId}, item: ${item}, startingBid: ${startingBid}`);
    if (!auctionId || !item || isNaN(startingBid)) {
      throw new Error('Invalid arguments for open-auction');
    }
    await auctionDB.put(auctionId, { item, startingBid, bids: [] });
    await broadcastAction(rpc, 'open-auction', { auctionId, item, startingBid });
    return { success: true };
  });

  rpcServer.respond('place-bid', async (req) => {
    const { auctionId, bidder, amount } = req;
    console.log(`Received place-bid request with auctionId: ${auctionId}, bidder: ${bidder}, amount: ${amount}`);
    if (!auctionId || !bidder || isNaN(amount)) {
      throw new Error('Invalid arguments for place-bid');
    }
    const auction = await auctionDB.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    auction.value.bids.push({ bidder, amount });
    await auctionDB.put(auctionId, auction.value);
    await broadcastAction(rpc, 'place-bid', { auctionId, bidder, amount });
    return { success: true };
  });

  rpcServer.respond('close-auction', async (req) => {
    const { auctionId } = req;
    console.log(`Received close-auction request with auctionId: ${auctionId}`);
    if (!auctionId) {
      throw new Error('Invalid arguments for close-auction');
    }
    const auction = await auctionDB.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    await broadcastAction(rpc, 'close-auction', { auctionId, winner: auction.value.bids.slice(-1)[0] });
    return { success: true };
  });

  await rpcServer.listen();
  console.log('RPC server listening on public key:', rpcServer.publicKey.toString('hex'));

  // Example client operations
  const serverPubKey = Buffer.from('b21f4e64aa092f0600a1a561022ac91a5492d12a3364538beba664892265bade', 'hex');

  await retry(async () => {
    try {
      const auctionId = 'auction1';
      const item = 'Pic#1';
      const startingBid = 75;
      if (isNaN(startingBid)) {
        throw new Error('Starting bid must be a valid number');
      }
      console.log(`Requesting open-auction with auctionId: ${auctionId}, item: ${item}, startingBid: ${startingBid}`);
      await rpc.request(serverPubKey, 'open-auction', { auctionId, item, startingBid });
    } catch (err) {
      console.error('Error during open-auction request:', err);
      if (err.message.includes('CHANNEL_CLOSED')) {
        await handleChannelClosed(dht, rpc);
      } else if (err.code === 'ELOCKED') {
        console.error('File is locked, retrying...', err);
        throw err;
      }
      throw err;
    }
  }, {
    retries: 5,
    minTimeout: 1000,
    factor: 2,
    onRetry: (err, attempt) => {
      console.log(`Retry attempt ${attempt} due to error: ${err.message}`);
    }
  });

  await rpc.request(serverPubKey, 'place-bid', { auctionId: 'auction1', bidder: 'client2', amount: 75.5 });
  await rpc.request(serverPubKey, 'close-auction', { auctionId: 'auction1' });

  await rpc.destroy();
  await dht.destroy();
};

const broadcastAction = async (rpc, action, data) => {
  for (const peer of peers) {
    try {
      console.log(`Broadcasting action ${action} to peer ${peer.toString('hex')} with data: ${JSON.stringify(data)}`);
      await rpc.request(peer, action, data);
    } catch (err) {
      console.error(`Failed to broadcast action to peer ${peer.toString('hex')}:`, err);
    }
  }
};

const handleChannelClosed = async (dht, rpc) => {
  console.log('Handling CHANNEL_CLOSED error');
  await rpc.destroy();
  await dht.destroy();
  await initializeDHTandRPC();
};

main().catch(console.error);
