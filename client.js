'use strict';
const Hypercore = require('hypercore'); 
const RPC = require('@hyperswarm/rpc');
const DHT = require('hyperdht');
const crypto = require('crypto');
const Hyperbee = require('hyperbee');
const auction = require('./auction');
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
  let retryCount = 0;
  const maxRetries = 5;

  while (retryCount < maxRetries) {
    try {
      // Your RPC operation that might fail due to channel issues
      await auction.openAuction(rpc, serverPubKey, 'client1', 'auction1', 'Pic#1', 75);
      break; // Exit the loop if successful
    } catch (err) {
      if (err.message.includes('CHANNEL_CLOSED')) {
        await handleChannelClosed(); // Implement a function to handle channel closed
      } else if (err.code === 'ELOCKED') {
        console.error('File is locked, retrying...', err);
        retryCount++;
      } else {
        throw err; // Rethrow other errors
      }
    }
  }

  if (retryCount === maxRetries) {
    console.error('Max retry attempts reached. Unable to proceed.');
    return;
  }

  await auction.placeBid(rpc, serverPubKey, 'auction1', 'client2', 75.5);
  await auction.closeAuction(rpc, serverPubKey, 'auction1');

  // closing connection
  await rpc.destroy();
  await dht.destroy();
};

main().catch(console.error);
