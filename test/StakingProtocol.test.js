const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingProtocol", function () {
  let stakingToken, rewardToken, stakingProtocol;
  let owner, user1, user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy tokens
    const StakingToken = await ethers.getContractFactory("StakingToken");
    stakingToken = await StakingToken.deploy(1000000);
    await stakingToken.waitForDeployment();
    
    rewardToken = await StakingToken.deploy(1000000);
    await rewardToken.waitForDeployment();
    
    // Deploy staking protocol
    const StakingProtocol = await ethers.getContractFactory("StakingProtocol");
    stakingProtocol = await StakingProtocol.deploy(
      await stakingToken.getAddress(),
      await rewardToken.getAddress()
    );
    await stakingProtocol.waitForDeployment();
    
    // Setup rewards
    const rewardRate = ethers.parseEther("0.1"); // 0.1 tokens per second
    await stakingProtocol.setRewardRate(rewardRate);
    
    // Add rewards to protocol
    const initialRewards = ethers.parseEther("10000");
    await rewardToken.transfer(await stakingProtocol.getAddress(), initialRewards);
    
    // Distribute staking tokens to users
    const userStakingAmount = ethers.parseEther("1000");
    await stakingToken.transfer(user1.address, userStakingAmount);
    await stakingToken.transfer(user2.address, userStakingAmount);
    
    // Approve staking tokens
    await stakingToken.connect(user1).approve(await stakingProtocol.getAddress(), userStakingAmount);
    await stakingToken.connect(user2).approve(await stakingProtocol.getAddress(), userStakingAmount);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await stakingProtocol.owner()).to.equal(owner.address);
    });

    it("Should set correct token addresses", async function () {
      expect(await stakingProtocol.stakingToken()).to.equal(await stakingToken.getAddress());
      expect(await stakingProtocol.rewardToken()).to.equal(await rewardToken.getAddress());
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      
      await expect(stakingProtocol.connect(user1).stake(stakeAmount))
        .to.emit(stakingProtocol, "Staked")
        .withArgs(user1.address, stakeAmount);
      
      expect(await stakingProtocol.stakedBalance(user1.address)).to.equal(stakeAmount);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
    });

    it("Should reject staking 0 tokens", async function () {
      await expect(stakingProtocol.connect(user1).stake(0))
        .to.be.revertedWith("Cannot stake 0 tokens");
    });

    it("Should reject staking without approval", async function () {
      const stakeAmount = ethers.parseEther("200");
      
      // Revoke approval
      await stakingToken.connect(user2).approve(await stakingProtocol.getAddress(), 0);
      
      await expect(stakingProtocol.connect(user2).stake(stakeAmount))
        .to.be.reverted;
    });
  });

  describe("Rewards", function () {
    it("Should calculate rewards correctly over time", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingProtocol.connect(user1).stake(stakeAmount);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");
      
      const expectedReward = ethers.parseEther("0.1") * 3600n; // 0.1 * 3600 seconds
      const actualReward = await stakingProtocol.earned(user1.address);
      
      expect(actualReward).to.be.closeTo(expectedReward, ethers.parseEther("0.001"));
    });

    it("Should allow users to claim rewards", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingProtocol.connect(user1).stake(stakeAmount);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      const balanceBefore = await rewardToken.balanceOf(user1.address);
      
      await expect(stakingProtocol.connect(user1).getReward())
        .to.emit(stakingProtocol, "RewardPaid");
      
      const balanceAfter = await rewardToken.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should reset rewards after claiming", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingProtocol.connect(user1).stake(stakeAmount);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      await stakingProtocol.connect(user1).getReward();
      expect(await stakingProtocol.rewards(user1.address)).to.equal(0);
    });
  });

  describe("Withdrawals", function () {
    it("Should allow users to withdraw staked tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingProtocol.connect(user1).stake(stakeAmount);
      
      const withdrawAmount = ethers.parseEther("50");
      
      await expect(stakingProtocol.connect(user1).withdraw(withdrawAmount))
        .to.emit(stakingProtocol, "Withdrawn")
        .withArgs(user1.address, withdrawAmount);
      
      expect(await stakingProtocol.stakedBalance(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await stakingToken.balanceOf(user1.address)).to.equal(ethers.parseEther("950"));
    });

    it("Should reject withdrawing 0 tokens", async function () {
      await expect(stakingProtocol.connect(user1).withdraw(0))
        .to.be.revertedWith("Cannot withdraw 0 tokens");
    });

    it("Should reject withdrawing more than staked", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingProtocol.connect(user1).stake(stakeAmount);
      
      await expect(stakingProtocol.connect(user1).withdraw(ethers.parseEther("200")))
        .to.be.revertedWith("Insufficient staked balance");
    });

    it("Should allow withdraw and claim rewards in one transaction", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingProtocol.connect(user1).stake(stakeAmount);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      const withdrawAmount = ethers.parseEther("50");
      const stakingBalanceBefore = await stakingToken.balanceOf(user1.address);
      const rewardBalanceBefore = await rewardToken.balanceOf(user1.address);
      
      await stakingProtocol.connect(user1).withdrawAndGetReward(withdrawAmount);
      
      expect(await stakingToken.balanceOf(user1.address)).to.equal(
        stakingBalanceBefore + withdrawAmount
      );
      expect(await rewardToken.balanceOf(user1.address)).to.be.gt(rewardBalanceBefore);
      expect(await stakingProtocol.stakedBalance(user1.address)).to.equal(ethers.parseEther("50"));
    });
  });

  describe("Protocol Management", function () {
    it("Should allow owner to set reward rate", async function () {
      const newRate = ethers.parseEther("0.2");
      
      await expect(stakingProtocol.setRewardRate(newRate))
        .to.emit(stakingProtocol, "RewardRateUpdated")
        .withArgs(newRate);
      
      expect(await stakingProtocol.rewardRate()).to.equal(newRate);
    });

    it("Should reject non-owner setting reward rate", async function () {
      await expect(stakingProtocol.connect(user1).setRewardRate(ethers.parseEther("0.2")))
        .to.be.revertedWithCustomError(stakingProtocol, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to add rewards", async function () {
      const additionalRewards = ethers.parseEther("1000");
      await rewardToken.transfer(owner.address, additionalRewards);
      await rewardToken.approve(await stakingProtocol.getAddress(), additionalRewards);
      
      await expect(stakingProtocol.addRewards(additionalRewards))
        .to.not.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return correct user info", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingProtocol.connect(user1).stake(stakeAmount);
      
      const [stakedAmount, pendingRewards, stakingTime] = await stakingProtocol.getUserInfo(user1.address);
      
      expect(stakedAmount).to.equal(stakeAmount);
      expect(pendingRewards).to.be.gt(0);
      expect(stakingTime).to.be.gt(0);
    });

    it("Should return correct protocol info", async function () {
      const [totalStaked, rewardRate, rewardPerToken] = await stakingProtocol.getProtocolInfo();
      
      expect(totalStaked).to.equal(0);
      expect(rewardRate).to.equal(ethers.parseEther("0.1"));
      expect(rewardPerToken).to.equal(0);
    });
  });
});
