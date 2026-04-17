# Staking Protocol

A decentralized staking protocol built with Solidity, Hardhat, and React. Users can stake tokens, earn rewards, and withdraw their stakes.

![Staking Protocol](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)
![Hardhat](https://img.shields.io/badge/Hardhat-2.19.0-yellow.svg)
![React](https://img.shields.io/badge/React-18.2.0-cyan.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## Features

- **Staking**: Deposit tokens into the protocol to earn rewards
- **Rewards**: Earn continuous rewards based on your staked amount
- **Withdrawals**: Withdraw staked tokens at any time
- **Claim Rewards**: Claim earned rewards separately or together with withdrawals
- **Security**: Built with OpenZeppelin contracts and reentrancy protection
- **User-friendly Frontend**: Modern React interface with real-time updates

## Smart Contracts

### StakingToken.sol
ERC20 token used for staking in the protocol.

### StakingProtocol.sol
Main staking contract that handles:
- Token staking and unstaking
- Reward calculation and distribution
- User balance tracking
- Protocol management

## Key Features

- **Continuous Rewards**: Rewards accrue continuously based on staked amount
- **Flexible Staking**: Stake any amount of tokens
- **Instant Withdrawals**: Withdraw staked tokens anytime
- **Reward Claims**: Claim rewards separately or with withdrawals
- **Gas Efficient**: Optimized contract interactions
- **Secure**: Reentrancy protection and proper access controls

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MetaMask or compatible wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd StackingProtocol
```

2. Install dependencies:
```bash
npm install
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm test
```

5. Deploy contracts (to local network):
```bash
npm run dev
```

In another terminal:
```bash
npm run deploy
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the frontend:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Contract Addresses (Local Development)

- **Staking Token**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **Reward Token**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **Staking Protocol**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## Usage

### Frontend Interface

1. **Connect Wallet**: Click "Connect Wallet" to connect your MetaMask wallet
2. **View Balances**: See your wallet balance, staked amount, and pending rewards
3. **Stake Tokens**: Enter amount and click "Stake" to deposit tokens
4. **Withdraw Tokens**: Enter amount and click "Withdraw" to retrieve staked tokens
5. **Claim Rewards**: Click "Claim Rewards" to get your earned rewards

### Smart Contract Interactions

```javascript
// Stake tokens
await stakingContract.stake(ethers.parseEther("100"));

// Withdraw tokens
await stakingContract.withdraw(ethers.parseEther("50"));

// Claim rewards
await stakingContract.getReward();

// Withdraw and claim rewards together
await stakingProtocol.withdrawAndGetReward(ethers.parseEther("25"));
```

## Testing

Run the test suite:

```bash
npm test
```

Tests cover:
- Contract deployment
- Staking functionality
- Reward calculation
- Withdrawal operations
- Edge cases and error handling

## Architecture

### Smart Contract Architecture
- **StakingProtocol**: Main contract handling staking logic
- **StakingToken**: ERC20 token for staking
- **RewardToken**: ERC20 token for rewards (reuses StakingToken)

### Frontend Architecture
- **React**: UI framework
- **Ethers.js**: Blockchain interaction
- **Tailwind CSS**: Styling
- **Vite**: Build tool

## Security Features

- **Reentrancy Guard**: Prevents reentrancy attacks
- **Access Control**: Owner-only functions for protocol management
- **Safe ERC20**: Safe token transfers
- **Input Validation**: Proper validation of user inputs

## Reward Calculation

Rewards are calculated using the following formula:
```
rewardPerToken = rewardPerTokenStored + ((timeDelta * rewardRate * 1e18) / totalStaked)
userReward = (stakedBalance * (rewardPerToken - userRewardPerTokenPaid)) / 1e18 + rewards
```

### Initial Setup Values
- **Initial Token Supply**: 1,000,000 tokens
- **Initial Reward Rate**: 0.1 tokens per second
- **Initial Rewards Pool**: 10,000 tokens
- **User Initial Balance**: 1,000 tokens per test user

## Project Structure

```
StackingProtocol/
├── contracts/
│   ├── StakingToken.sol          # ERC20 token for staking
│   └── StakingProtocol.sol       # Main staking contract
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/
│   └── StakingProtocol.test.js   # Test suite
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main React component
│   │   └── index.css             # Tailwind styles
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite configuration
├── hardhat.config.js             # Hardhat configuration
└── package.json                  # Project dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and ensure they pass
6. Submit a pull request

## Troubleshooting

### Common Issues

1. **MetaMask Connection Issues**
   - Ensure MetaMask is installed and unlocked
   - Make sure you're connected to the correct network (localhost:8545 for local development)
   - Refresh the page and try reconnecting

2. **Contract Deployment Errors**
   - Ensure Hardhat node is running: `npm run node`
   - Check if contracts are compiled: `npm run compile`
   - Verify network configuration in `hardhat.config.js`

3. **Frontend Not Loading**
   - Install frontend dependencies: `cd frontend && npm install`
   - Check if Vite dev server is running on port 5173
   - Verify contract addresses match deployed contracts

4. **Transaction Failures**
   - Ensure you have enough ETH for gas fees
   - Check token approvals before staking
   - Verify you have sufficient token balance

### Environment Variables

For production deployments, create a `.env` file in the root directory with your configuration. Never commit this file to version control or share it publicly.

## License

MIT License

---

**Built with ❤️ for the DeFi community**
