'use strict';

const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');
const crypto = require('crypto');

class Auction {
  constructor(dbPath) {
    this.core = new Hypercore(dbPath);
    this.db = new Hyperbee(this.core, { keyEncoding: 'utf-8', valueEncoding: 'json' });
  }

  async init() {
    await this.db.ready();
  }

  async openAuction(auctionId, item, startingBid) {
    const auction = {
      item,
      startingBid,
      bids: [],
      status: 'open'
    };
    await this.db.put(auctionId, auction);
    return auction;
  }

  async placeBid(auctionId, bidder, amount) {
    const auction = await this.db.get(auctionId);
    if (!auction || auction.value.status !== 'open') {
      throw new Error('Auction not found or not open');
    }
    auction.value.bids.push({ bidder, amount });
    await this.db.put(auctionId, auction.value);
    return auction.value;
  }

  async closeAuction(auctionId) {
    const auction = await this.db.get(auctionId);
    if (!auction || auction.value.status !== 'open') {
      throw new Error('Auction not found or not open');
    }
    auction.value.status = 'closed';
    await this.db.put(auctionId, auction.value);
    return auction.value;
  }
}

module.exports = Auction;
