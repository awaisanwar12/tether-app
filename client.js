'use strict';
const Hypercore = require('hypercore'); 
const RPC = require('@hyperswarm/rpc');
const DHT = require('hyperdht');
const crypto = require('crypto');
const Hyperbee = require('hyperbee');
const auction = require('./auction');
const fs = require('fs');
const retry = require('async-retry');

const main = async () => {
  // hyperbee db
  const hcore = new Hypercore('./db/rpc-client');
  const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'json' });
  await hbee.ready();

  const seedLength = 32; // Define the required seed length
  const seed = crypto.randomBytes(seedLength); // Ensure the seed length matches the required length

  // Use the seed to create the key pair
  const keyPair = DHT.keyPair(seed);

  let dht;
  let rpc;

  const initializeDHTandRPC = async () => {
    dht = new DHT({
      port: 50001,
      keyPair: keyPair,
      bootstrap: [{ host: '127.0.0.1', port: 30001 }]
    });
    await dht.ready();

    rpc = new RPC({ dht });
  };

  const handleChannelClosed = async () => {
    await rpc.destroy();
    await dht.destroy();
    await initializeDHTandRPC();
  };

  await initializeDHTandRPC();

  // public key of rpc server, used instead of address, the address is discovered via dht
  const serverPubKey = Buffer.from('a77a555d9e6484ffcdf9ab1a5faf71bf5bbf9109027b106c9678cb8ddaba4597', 'hex');

  // Example retry mechanism for a file operation
  await retry(async () => {
    try {
      // Your RPC operation that might fail due to channel issues
      await auction.openAuction(rpc, serverPubKey, 'client1', 'auction1', 'Pic#1', 75);
    } catch (err) {
      if (err.message.includes('CHANNEL_CLOSED')) {
        await handleChannelClosed(); // Implement a function to handle channel closed
      } else if (err.code === 'ELOCKED') {
        throw err; // Throw to trigger the retry
      }
      throw err; // Rethrow other errors
    }
  }, {
    retries: 5, // Number of retry attempts
    minTimeout: 1000, // Minimum wait time between retries (in milliseconds)
    factor: 2, // Exponential backoff factor
    onRetry: (err, attempt) => {
      console.log(`Retry attempt ${attempt} due to error: ${err.message}`);
    }
  });

  await auction.placeBid(rpc, serverPubKey, 'auction1', 'client2', 75.5);
  await auction.closeAuction(rpc, serverPubKey, 'auction1');

  // closing connection
  await rpc.destroy();
  await dht.destroy();
};

main().catch(console.error);

