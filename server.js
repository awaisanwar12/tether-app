'use strict';
const RPC = require('@hyperswarm/rpc');
const DHT = require('hyperdht');
const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');
const crypto = require('crypto');
const auction = require('./auction');

const main = async () => {
  // hyperbee db
  const hcore = new Hypercore('./db/rpc-server');
  const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'json' });
  await hbee.ready();

  // resolved distributed hash table seed for key pair
  let dhtSeed = (await hbee.get('dht-seed'))?.value;
  if (!dhtSeed || dhtSeed.length !== 32) {
    // not found, generate and store in db
    dhtSeed = crypto.randomBytes(32); // Ensure the seed length matches the required length
    await hbee.put('dht-seed', dhtSeed);
  }

  // Convert the seed to a Uint8Array
  const seedTypedArray = new Uint8Array(dhtSeed);

  // start distributed hash table, it is used for rpc service discovery
  const dht = new DHT({
    port: 40001,
    keyPair: DHT.keyPair(seedTypedArray),
    bootstrap: [{ host: '127.0.0.1', port: 30001 }] // note bootstrap points to dht that is started via cli
  });
  await dht.ready();

  // resolve rpc server seed for key pair
  let rpcSeed = (await hbee.get('rpc-seed'))?.value;
  if (!rpcSeed || rpcSeed.length !== 32) {
    rpcSeed = crypto.randomBytes(32);
    await hbee.put('rpc-seed', rpcSeed);
  }

  // Convert the rpcSeed to a Uint8Array
  const rpcSeedTypedArray = new Uint8Array(rpcSeed);

  // setup rpc server
  const rpc = new RPC({ seed: rpcSeedTypedArray, dht });
  const rpcServer = rpc.createServer();
  await rpcServer.listen();
  console.log('rpc server started listening on public key:', rpcServer.publicKey.toString('hex'));

  // bind handlers to rpc server
  rpcServer.respond('open-auction', auction.openAuction);
  rpcServer.respond('place-bid', auction.placeBid);
  rpcServer.respond('close-auction', auction.closeAuction);
};

main().catch(console.error);
