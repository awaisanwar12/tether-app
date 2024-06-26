# Tether App - P2P Auction System

## Overview

Tether App is a peer-to-peer (P2P) auction system built using Hyperswarm RPC, Hypercore, and Hyperbee. This system allows clients to open auctions, place bids, and close auctions, with all actions being propagated to all peers in the network. The architecture ensures a decentralized approach, avoiding the classic client/server model.

## Features

- **Open Auctions**: Clients can open auctions to sell items.
- **Place Bids**: Clients can place bids on open auctions.
- **Close Auctions**: Clients can close auctions and notify all peers of the auction results.
- **P2P Communication**: Uses Hyperswarm RPC for communication between nodes.
- **Distributed Storage**: Uses Hypercore and Hyperbee for data storage.

## Requirements

- Node.js
- Hyperswarm RPC
- Hypercore
- Hyperbee
- Hyperdht
- Crypto
- Async-retry

## Installation

1. Clone the repository:
    git clone https://github.com/yourusername/tether-app.git
   
2. Install dependencies:
    npm install
   
## Usage

1. Start the application:
    node client.js
   
2. The application will initialize a DHT node, set up an RPC server, and perform example client operations such as opening an auction, placing a bid, and closing an auction.

## Code Structure

- **client.js**: Main file that initializes the DHT node, sets up the RPC server, and handles auction operations.
- **auction.js**: Contains the Auction class (if needed for additional auction logic).

## Example Scenario

1. **Client#1** opens an auction to sell Pic#1 for 75 USDt.
2. **Client#2** opens an auction to sell Pic#2 for 60 USDt.
3. **Client#2** makes a bid for Client#1's Pic#1 with 75 USDt.
4. **Client#3** makes a bid for Client#1's Pic#1 with 75.5 USDt.
5. **Client#2** makes a bid for Client#1's Pic#1 with 80 USDt.
6. **Client#1** closes the auction and notifies all clients about the auction result.

## Troubleshooting

### Invalid Argument Value Error

If you encounter the error `RangeError [ERR_INVALID_ARG_VALUE]: The argument 'size' is invalid. Received NaN`, follow these steps to resolve it:

1. **Validate Inputs**: Ensure all inputs are validated before processing. Check for `NaN` or undefined values.
2. **Debug Logging**: Add debug logs to trace the values being passed around.
3. **Check Buffer Allocations**: Ensure that any buffer allocations are done with valid sizes.

### Example Fix

Ensure that `seedLength` is a valid number and `crypto.randomBytes(seedLength)` returns a valid buffer.

## Future Improvements

Given more time, the following improvements can be made:

1. **Enhanced Error Handling**: Improve error handling to provide more detailed error messages and recovery options.
2. **Peer Discovery**: Implement a more robust peer discovery mechanism to dynamically find and connect to peers.
3. **Data Persistence**: Enhance data persistence to ensure auction data is reliably stored and retrieved.
4. **Security**: Implement security measures to ensure data integrity and prevent unauthorized access.
5. **Scalability**: Optimize the system to handle a larger number of peers and auctions.

** For server.js

. The server will initialize a DHT node, set up an RPC server, and handle auction operations such as opening an auction, placing a bid, and closing an auction.

## Code Structure

### server.js

The `server.js` file is the main entry point for the Tether App. It sets up the DHT node, RPC server, and handles auction operations.

### Key Components

- **Hypercore and Hyperbee Initialization**: Initializes a Hypercore feed and wraps it with Hyperbee for key-value storage.
- **DHT and RPC Setup**: Sets up a DHT node and an RPC server for P2P communication.
- **RPC Handlers**: Defines handlers for `open-auction`, `place-bid`, and `close-auction` requests.
- **Broadcasting**: Broadcasts actions to all known peers.

### Troubleshooting

#### Invalid Argument Value Error

If you encounter the error `RangeError [ERR_INVALID_ARG_VALUE]: The argument 'size' is invalid. Received NaN`, follow these steps to resolve it:

1. **Validate Inputs**: Ensure all inputs are validated before processing. Check for `NaN` or undefined values.
2. **Debug Logging**: Add debug logs to trace the values being passed around.
3. **Check Buffer Allocations**: Ensure that any buffer allocations are done with valid sizes.


Ensure that `seedLength` is a valid number and `crypto.randomBytes(seedLength)` returns a valid buffer.

### Future Improvements

Given more time, the following improvements can be made:

1. **Enhanced Error Handling**: Improve error handling to provide more detailed error messages and recovery options.
2. **Peer Discovery**: Implement a more robust peer discovery mechanism to dynamically find and connect to peers.
3. **Data Persistence**: Enhance data persistence to ensure auction data is reliably stored and retrieved.
4. **Security**: Implement security measures to ensure data integrity and prevent unauthorized access.
5. **Scalability**: Optimize the system to handle a larger number of peers and auctions.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### Example Code

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
