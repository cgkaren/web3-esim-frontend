import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const CONTRACT_ADDRESS = "0xYourContractAddress"; // Replace with your contract address
const CONTRACT_ABI = require('./ESIMPaymentABI.json'); // Adjust the path as needed
const SIM_COST_ETH = "0.01"; // Set the cost of one eSIM in Ether

function App() {
    const [userAddress, setUserAddress] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [balance, setBalance] = useState('0');
    const [token, setToken] = useState('ETH');
    const [transactionHistory, setTransactionHistory] = useState([]);

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
            const totalAmount = (quantity * parseFloat(SIM_COST_ETH)).toFixed(3);
            
            const tx = await signer.sendTransaction({
                to: CONTRACT_ADDRESS,
                value: ethers.parseEther(totalAmount)
            });
            
            await tx.wait();
            
            setMessage(`Payment of ${totalAmount} ETH for ${quantity} SIM(s) sent! Verifying...`);
            setTransactionHistory([...transactionHistory, { timestamp: new Date().toISOString(), amount: totalAmount }]);
            
            const response = await axios.post('/buy-esim', { userAddress, amount: totalAmount });
            if (response.data.success) {
                setMessage(`eSIM Activated: ${response.data.esim}`);
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
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            
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
