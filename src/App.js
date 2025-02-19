import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';

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
    const [userPurchases, setUserPurchases] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

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

    const handleLogin = async () => {
        if (!window.ethereum) return alert('Install MetaMask!');
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setUserAddress(address);
            setIsLoggedIn(true);
        } catch (error) {
            console.error("Login error:", error);
            alert('Login failed. Please try again.');
        }
    };

    const handlePurchase = async () => {
        if (!isLoggedIn) return alert('Please login first!');
        
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
                
                const esimResponse = await axios.post(ESIM_API_URL, {
                    userAddress: userAddress
                });

                if (esimResponse.data.success) {
                    const newEsim = {
                        esimCode: esimResponse.data.esimCode,
                        timestamp: new Date().toISOString()
                    };
                    setUserPurchases([...userPurchases, newEsim]);
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
        <div className="container">
            <header>
                <h1>eSIM Marketplace</h1>
            </header>
            
            {!isLoggedIn ? (
                <section className="login-section">
                    <h2>Login</h2>
                    <button className="login-button" onClick={handleLogin}>Login with MetaMask</button>
                </section>
            ) : (
                <>
                    <section className="buy-section">
                        <h2>Buy eSIM with Crypto</h2>
                        <p>Each eSIM costs {SIM_COST_ETH} {token}</p>
                        <p>Your current balance: {balance} {token}</p>
                        <p>Logged in as: {userAddress}</p>
                        
                        <div className="select-container">
                            <label>Select payment token: </label>
                            <select onChange={(e) => setToken(e.target.value)} value={token}>
                                <option value="ETH">ETH</option>
                                <option value="USDT">USDT</option>
                            </select>
                        </div>
                        
                        <button className="buy-button" onClick={handlePurchase}>Buy eSIM</button>
                    </section>
                    
                    <section className="history-section">
                        <h2>Your Purchased eSIMs</h2>
                        <ul>
                            {userPurchases.map((esim, index) => (
                                <li key={index}>{`eSIM Code: ${esim.esimCode}, Date: ${esim.timestamp}`}</li>
                            ))}
                        </ul>
                    </section>
                </>
            )}
            
            <section className="message-section">
                <p>{message}</p>
            </section>
        </div>
    );
}

export default App;
