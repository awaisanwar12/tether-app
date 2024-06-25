'use strict';
const RPC = require('@hyperswarm/rpc');
const DHT = require('hyperdht');
const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');
const crypto = require('crypto');
const Auction = require('./auction');

const peers = []; // List of known peers

const main = async () => {
  const auction = new Auction('./db/rpc-server');
  await auction.init();

  const seedLength = 32;
  const seed = crypto.randomBytes(seedLength);
  const keyPair = DHT.keyPair(seed);

  const dht = new DHT({
    port: 40001,
    keyPair: keyPair,
    bootstrap: [{ host: '127.0.0.1', port: 30001 }]
  });
  await dht.ready();

  const rpc = new RPC({ dht });
  const rpcServer = rpc.createServer();

  rpcServer.respond('open-auction', async (req) => {
    const { auctionId, item, startingBid } = req;
    const result = await auction.openAuction(auctionId, item, startingBid);
    await broadcastAction(rpc,'open-auction', { auctionId, item, startingBid });
    return result;
  });

  rpcServer.respond('place-bid', async (req) => {
    const { auctionId, bidder, amount } = req;
    const result = await auction.placeBid(auctionId, bidder, amount);
    await broadcastAction(rpc,'place-bid', { auctionId, bidder, amount });
    return result;
  });

  rpcServer.respond('close-auction', async (req) => {
    const { auctionId } = req;
    const result = await auction.closeAuction(auctionId);
    await broadcastAction(rpc,'close-auction', { auctionId });
    return result;
  });

  await rpcServer.listen();
  console.log('RPC server listening on public key:', rpcServer.publicKey.toString('hex'));
};

const broadcastAction = async (action, data,rpc) => {
  for (const peer of peers) {
    try {
      console.log(`Broadcasting action ${action} to peer ${peer.toString('hex')} with data: ${JSON.stringify(data)}`);
      await rpc.request(peer, action, data);
    } catch (err) {
      console.error(`Failed to broadcast action to peer ${peer.toString('hex')}:`, err);
    }
  }
};

main().catch(console.error);
