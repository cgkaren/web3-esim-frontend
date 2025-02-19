import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const CONTRACT_ADDRESS = "0xYourContractAddress"; // Replace with your contract address
const CONTRACT_ABI = require('./ESIMPaymentABI.json'); // Adjust the path as needed
const SIM_COST_ETH = "0.01"; // Set the cost of one eSIM in Ether
const ESIM_API_URL = "https://esim-provider.com/api/purchase"; // Replace with your eSIM provider API

function App() {
    const [userAddress, setUserAddress] = useState('');
    const [message, setMessage] = useState('');
    const [balance, setBalance] = useState('0');
    const [token, setToken] = useState('ETH');
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminTransactions, setAdminTransactions] = useState([]);

    useEffect(() => {
        if (window.ethereum) {
            const fetchBalance = async () => {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await provider.getSigner();
                    const balance = await signer.getBalance();
                    setBalance(ethers.formatEther(balance));
                } catch (error) {
                    console.error("Error fetching balance:", error);
                }
            };
            fetchBalance();
        }
    }, []);

    const handlePurchase = async () => {
        if (!window.ethereum) return alert('Install MetaMask!');
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const totalAmount = parseFloat(SIM_COST_ETH).toFixed(3);
            
            const tx = await signer.sendTransaction({
                to: CONTRACT_ADDRESS,
                value: ethers.parseEther(totalAmount)
            });
            
            await tx.wait();
            
            setMessage(`Payment of ${totalAmount} ETH sent! Verifying...`);
            setTransactionHistory([...transactionHistory, { timestamp: new Date().toISOString(), amount: totalAmount }]);
            
            const response = await axios.post('/buy-esim', { userAddress, amount: totalAmount });
            if (response.data.success) {
                setMessage(`Payment confirmed! Now purchasing eSIM...`);
                
                // Call the eSIM provider API
                const esimResponse = await axios.post(ESIM_API_URL, {
                    userAddress: userAddress
                });

                if (esimResponse.data.success) {
                    setMessage(`eSIM Activated: ${esimResponse.data.esimCode}`);
                } else {
                    setMessage('Error: eSIM purchase failed.');
                }
            } else {
                setMessage('Error activating eSIM');
            }
        } catch (error) {
            console.error(error);
            setMessage('Transaction failed. Please try again.');
        }
    };

    return (
        <div>
            <h1>Buy eSIM with Crypto</h1>
            <p>Each eSIM costs {SIM_COST_ETH} {token}</p>
            <p>Your current balance: {balance} {token}</p>
            
            <div>
                <label>Select payment token: </label>
                <select onChange={(e) => setToken(e.target.value)} value={token}>
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                </select>
            </div>
            
            <input
                type="text"
                placeholder="Your Wallet Address"
                onChange={(e) => setUserAddress(e.target.value)}
            />
            
            <button onClick={handlePurchase}>Buy eSIM</button>
            
            <h2>Transaction History</h2>
            <ul>
                {transactionHistory.map((txn, index) => (
                    <li key={index}>{`Date: ${txn.timestamp}, Amount: ${txn.amount} ${token}`}</li>
                ))}
            </ul>
            
            <p>{message}</p>
        </div>
    );
}

export default App;
