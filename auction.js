'use strict';

const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');

const hcore = new Hypercore('./db/auction-data');
const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'json' });
const auctions = {};

const openAuction = async (rpc, serverPubKey, clientId, auctionId, item, price) => {
  const auction = { clientId, auctionId, item, price, bids: [] };
  auctions[auctionId] = auction;
  await hbee.put(auctionId, auction);
  const message = { type: 'auction-opened', auction };
  const messageRaw = Buffer.from(JSON.stringify(message), 'utf-8');
  await rpc.request(serverPubKey, 'open-auction', messageRaw);
};

const placeBid = async (rpc, serverPubKey, auctionId, bidderId, amount) => {
  const auction = auctions[auctionId];
  if (!auction) return;
  const bid = { auctionId, bidderId, amount };
  auction.bids.push(bid);
  await hbee.put(auctionId, auction);
  const message = { type: 'bid-placed', bid };
  const messageRaw = Buffer.from(JSON.stringify(message), 'utf-8');
  await rpc.request(serverPubKey, 'place-bid', messageRaw);
};

const closeAuction = async (rpc, serverPubKey, auctionId) => {
  const auction = auctions[auctionId];
  if (!auction) return;
  const highestBid = auction.bids.sort((a, b) => b.amount - a.amount)[0];
  auction.closed = true;
  auction.winner = highestBid;
  await hbee.put(auctionId, auction);
  const message = { type: 'auction-closed', auction };
  const messageRaw = Buffer.from(JSON.stringify(message), 'utf-8');
  await rpc.request(serverPubKey, 'close-auction', messageRaw);
};

module.exports = { openAuction, placeBid, closeAuction };
