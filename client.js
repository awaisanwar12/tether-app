'use strict';
const Hypercore = require('hypercore'); 
const RPC = require('@hyperswarm/rpc');
const DHT = require('hyperdht');
const crypto = require('crypto');
const Hyperbee = require('hyperbee');
const auction = require('./auction');

const main = async () => {
  // hyperbee db
  const hcore = new Hypercore('./db/rpc-client');
  const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'json' });
  await hbee.ready();

  // Generate a seed of the required length
  const seed = crypto.randomBytes(32); // Ensure the seed length matches the required length

  // Use the seed to create the key pair
  const keyPair = DHT.keyPair(seed);

  // start distributed hash table, it is used for rpc service discovery
  const dht = new DHT({
    port: 50001,
    keyPair: keyPair,
    bootstrap: [{ host: '127.0.0.1', port: 30001 }] // note bootstrap points to dht that is started via cli
  });
  await dht.ready();

  // public key of rpc server, used instead of address, the address is discovered via dht
  const serverPubKey = Buffer.from('acb5fc951e29f53024a26262ace9563c4c9b099a5686b640149f18defe53bf79', 'hex');

  // rpc lib
  const rpc = new RPC({ dht });

  // Example actions
  await auction.openAuction(rpc, serverPubKey, 'client1', 'auction1', 'Pic#1', 75);
  await auction.placeBid(rpc, serverPubKey, 'auction1', 'client2', 75.5);
  await auction.closeAuction(rpc, serverPubKey, 'auction1');

  // closing connection
  await rpc.destroy();
  await dht.destroy();
};

main().catch(console.error);
