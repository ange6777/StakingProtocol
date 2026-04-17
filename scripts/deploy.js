const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Staking Protocol...");

  // Deploy StakingToken
  const StakingToken = await ethers.getContractFactory("StakingToken");
  const initialSupply = 1000000; // 1 million tokens
  const stakingToken = await StakingToken.deploy(initialSupply);
  await stakingToken.waitForDeployment();
  console.log("StakingToken deployed to:", stakingToken.target);

  // Deploy RewardToken (using StakingToken for simplicity)
  const RewardToken = await ethers.getContractFactory("StakingToken");
  const rewardToken = await RewardToken.deploy(initialSupply);
  await rewardToken.waitForDeployment();
  console.log("RewardToken deployed to:", rewardToken.target);

  // Deploy StakingProtocol
  const StakingProtocol = await ethers.getContractFactory("StakingProtocol");
  const stakingProtocol = await StakingProtocol.deploy(
    stakingToken.target,
    rewardToken.target
  );
  await stakingProtocol.waitForDeployment();
  console.log("StakingProtocol deployed to:", stakingProtocol.target);

  // Setup initial rewards
  const rewardRate = ethers.parseEther("0.1"); // 0.1 reward tokens per second
  await stakingProtocol.setRewardRate(rewardRate);
  console.log("Reward rate set to:", ethers.formatEther(rewardRate), "tokens per second");

  // Add initial rewards to the protocol
  const initialRewards = ethers.parseEther("10000"); // 10,000 reward tokens
  await rewardToken.transfer(stakingProtocol.target, initialRewards);
  console.log("Initial rewards added:", ethers.formatEther(initialRewards), "tokens");

  // Get signers
  const [owner, user1, user2] = await ethers.getSigners();
  console.log("Owner address:", owner.address);
  console.log("User1 address:", user1.address);
  console.log("User2 address:", user2.address);

  // Distribute staking tokens to users
  const userStakingAmount = ethers.parseEther("1000"); // 1000 tokens per user
  await stakingToken.transfer(user1.address, userStakingAmount);
  await stakingToken.transfer(user2.address, userStakingAmount);
  console.log("Distributed", ethers.formatEther(userStakingAmount), "staking tokens to each user");

  // Approve staking tokens for the protocol
  await stakingToken.connect(user1).approve(stakingProtocol.target, userStakingAmount);
  await stakingToken.connect(user2).approve(stakingProtocol.target, userStakingAmount);
  console.log("Users approved staking tokens for the protocol");

  console.log("\n=== Deployment Summary ===");
  console.log("StakingToken:", stakingToken.target);
  console.log("RewardToken:", rewardToken.target);
  console.log("StakingProtocol:", stakingProtocol.target);
  console.log("Reward Rate:", ethers.formatEther(rewardRate), "tokens/second");
  console.log("Initial Rewards Pool:", ethers.formatEther(initialRewards), "tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
