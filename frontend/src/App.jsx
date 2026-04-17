import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';

const STAKING_PROTOCOL_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const STAKING_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const REWARD_TOKEN_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const STAKING_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const STAKING_PROTOCOL_ABI = [
  "function stake(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function getReward()",
  "function withdrawAndGetReward(uint256 amount)",
  "function stakedBalance(address) view returns (uint256)",
  "function earned(address) view returns (uint256)",
  "function rewardPerToken() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function getUserInfo(address) view returns (uint256, uint256, uint256)",
  "function getProtocolInfo() view returns (uint256, uint256, uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event RewardPaid(address indexed user, uint256 reward)"
];

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [stakingToken, setStakingToken] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [balances, setBalances] = useState({
    wallet: '0',
    staked: '0',
    rewards: '0'
  });
  
  const [protocolInfo, setProtocolInfo] = useState({
    totalStaked: '0',
    rewardRate: '0',
    rewardPerToken: '0'
  });
  
  const [userInfo, setUserInfo] = useState({
    stakedAmount: '0',
    pendingRewards: '0',
    stakingTime: '0'
  });
  
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const connectWallet = async () => {
    if (!provider) {
      alert('Please install MetaMask!');
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await provider.getSigner();
      setAccount(accounts[0]);
      setSigner(signer);
      
      const stakingContract = new ethers.Contract(STAKING_PROTOCOL_ADDRESS, STAKING_PROTOCOL_ABI, signer);
      const stakingToken = new ethers.Contract(STAKING_TOKEN_ADDRESS, STAKING_TOKEN_ABI, signer);
      
      setStakingContract(stakingContract);
      setStakingToken(stakingToken);
      
      updateBalances();
      updateProtocolInfo();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const updateBalances = async () => {
    if (!stakingContract || !stakingToken || !account) return;
    
    try {
      const walletBalance = await stakingToken.balanceOf(account);
      const stakedBalance = await stakingContract.stakedBalance(account);
      const earnedRewards = await stakingContract.earned(account);
      
      setBalances({
        wallet: ethers.formatEther(walletBalance),
        staked: ethers.formatEther(stakedBalance),
        rewards: ethers.formatEther(earnedRewards)
      });
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  };

  const updateProtocolInfo = async () => {
    if (!stakingContract) return;
    
    try {
      const [totalStaked, rewardRate, rewardPerToken] = await stakingContract.getProtocolInfo();
      
      setProtocolInfo({
        totalStaked: ethers.formatEther(totalStaked),
        rewardRate: ethers.formatEther(rewardRate),
        rewardPerToken: ethers.formatEther(rewardPerToken)
      });
    } catch (error) {
      console.error('Error updating protocol info:', error);
    }
  };

  const updateUserInfo = async () => {
    if (!stakingContract || !account) return;
    
    try {
      const [stakedAmount, pendingRewards, stakingTime] = await stakingContract.getUserInfo(account);
      
      setUserInfo({
        stakedAmount: ethers.formatEther(stakedAmount),
        pendingRewards: ethers.formatEther(pendingRewards),
        stakingTime: stakingTime.toString()
      });
    } catch (error) {
      console.error('Error updating user info:', error);
    }
  };

  useEffect(() => {
    if (account) {
      updateBalances();
      updateProtocolInfo();
      updateUserInfo();
      
      const interval = setInterval(() => {
        updateBalances();
        updateUserInfo();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [account, stakingContract]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('Please enter a valid stake amount');
      return;
    }
    
    setLoading(true);
    try {
      const amount = ethers.parseEther(stakeAmount);
      const allowance = await stakingToken.allowance(account, STAKING_PROTOCOL_ADDRESS);
      
      if (allowance < amount) {
        const approveTx = await stakingToken.approve(STAKING_PROTOCOL_ADDRESS, amount);
        await approveTx.wait();
      }
      
      const stakeTx = await stakingContract.stake(amount);
      await stakeTx.wait();
      
      setStakeAmount('');
      updateBalances();
      updateProtocolInfo();
      updateUserInfo();
      
      alert('Staking successful!');
    } catch (error) {
      console.error('Error staking:', error);
      alert('Staking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid withdraw amount');
      return;
    }
    
    setLoading(true);
    try {
      const amount = ethers.parseEther(withdrawAmount);
      const withdrawTx = await stakingContract.withdraw(amount);
      await withdrawTx.wait();
      
      setWithdrawAmount('');
      updateBalances();
      updateProtocolInfo();
      updateUserInfo();
      
      alert('Withdrawal successful!');
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    try {
      const claimTx = await stakingContract.getReward();
      await claimTx.wait();
      
      updateBalances();
      updateUserInfo();
      
      alert('Rewards claimed successfully!');
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Claiming rewards failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Staking Protocol</h1>
          <p className="text-white opacity-90">Stake your tokens and earn rewards</p>
        </div>

        {!account ? (
          <div className="flex justify-center">
            <button onClick={connectWallet} className="btn btn-primary flex items-center gap-2">
              <Wallet size={20} />
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Account Info */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Wallet size={20} />
                Account Info
              </h2>
              <p className="text-sm text-gray-600 mb-2">Address: {account.slice(0, 6)}...{account.slice(-4)}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Wallet Balance:</span>
                  <span className="font-semibold">{parseFloat(balances.wallet).toFixed(4)} STK</span>
                </div>
                <div className="flex justify-between">
                  <span>Staked Balance:</span>
                  <span className="font-semibold">{parseFloat(balances.staked).toFixed(4)} STK</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Rewards:</span>
                  <span className="font-semibold text-green-600">{parseFloat(balances.rewards).toFixed(4)} RWD</span>
                </div>
              </div>
            </div>

            {/* Protocol Info */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Protocol Stats
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Staked:</span>
                  <span className="font-semibold">{parseFloat(protocolInfo.totalStaked).toFixed(2)} STK</span>
                </div>
                <div className="flex justify-between">
                  <span>Reward Rate:</span>
                  <span className="font-semibold">{parseFloat(protocolInfo.rewardRate).toFixed(4)} RWD/sec</span>
                </div>
                <div className="flex justify-between">
                  <span>Reward per Token:</span>
                  <span className="font-semibold">{parseFloat(protocolInfo.rewardPerToken).toFixed(6)}</span>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock size={20} />
                Your Stats
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Staked Amount:</span>
                  <span className="font-semibold">{parseFloat(userInfo.stakedAmount).toFixed(4)} STK</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Rewards:</span>
                  <span className="font-semibold text-green-600">{parseFloat(userInfo.pendingRewards).toFixed(4)} RWD</span>
                </div>
                <div className="flex justify-between">
                  <span>Staking Time:</span>
                  <span className="font-semibold">{formatTime(userInfo.stakingTime)}</span>
                </div>
              </div>
            </div>

            {/* Stake */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Stake Tokens
              </h2>
              <input
                type="number"
                placeholder="Amount to stake"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="input mb-4"
              />
              <button 
                onClick={handleStake} 
                disabled={loading || parseFloat(balances.wallet) < parseFloat(stakeAmount || 0)}
                className="btn btn-primary w-full"
              >
                {loading ? 'Processing...' : 'Stake'}
              </button>
            </div>

            {/* Withdraw */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Withdraw Tokens
              </h2>
              <input
                type="number"
                placeholder="Amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="input mb-4"
              />
              <button 
                onClick={handleWithdraw} 
                disabled={loading || parseFloat(balances.staked) < parseFloat(withdrawAmount || 0)}
                className="btn btn-secondary w-full"
              >
                {loading ? 'Processing...' : 'Withdraw'}
              </button>
            </div>

            {/* Claim Rewards */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Claim Rewards
              </h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Available Rewards:</p>
                <p className="text-2xl font-bold text-green-600">
                  {parseFloat(balances.rewards).toFixed(4)} RWD
                </p>
              </div>
              <button 
                onClick={handleClaimRewards} 
                disabled={loading || parseFloat(balances.rewards) <= 0}
                className="btn btn-success w-full"
              >
                {loading ? 'Processing...' : 'Claim Rewards'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
