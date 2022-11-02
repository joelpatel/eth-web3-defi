import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  //   console.log({
  //     provider,
  //     signer,
  //     transactionContract,
  //   });
  return transactionContract;
};

export const TransactionProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState("");
  const [formData, setFormData] = useState({
    sendTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [txCount, setTxCount] = useState(localStorage.getItem("txCount"));
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => {
      return {
        ...prevState,
        [name]: e.target.value,
      };
    });
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) {
        return alert("Please install MetaMak from your browser store!");
      }

      const txContract = getEthereumContract();
      const confirmedTransactions = await txContract.getAllTransactions();

      const structuredTransactions = confirmedTransactions.map((tx) => ({
        sendTo: tx.receiver,
        addressFrom: tx.sender,
        timestamp: new Date(tx.timestamp.toNumber() * 1000).toLocaleString(),
        message: tx.message,
        keyword: tx.keyword,
        amount: parseInt(tx.amount._hex) / 10 ** 18,
      }));
      setTransactions(structuredTransactions);
      // console.log(structuredTransactions);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) {
        return alert("Please install MetaMask from your browser store!");
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setConnectedAccount(accounts[0]);

        getAllTransactions();
      } else {
        console.log("No accounts found.");
      }
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const checkIfTransactionsExist = async () => {
    try {
      const txContract = getEthereumContract();
      const transactionCount = await txContract.getTransactionCount();

      window.localStorage.setItem("txCount", transactionCount);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) {
        return alert("Please install MetaMask from your browser store!");
      }

      // get all the accounts then user will choose one
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // in this case, set current account
      setConnectedAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) {
        return alert("Please install MetaMask from your browser store!");
      }

      // get the data from the form...
      const { sendTo, amount, keyword, message } = formData;
      const transactionContract = getEthereumContract();
      const parsedAmount = ethers.utils.parseEther(amount);

      // sending
      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedAccount,
            to: sendTo,
            gas: "0x5208", // 21000 gwei
            value: parsedAmount._hex,
          },
        ],
      });

      const txHash = await transactionContract.addToBlockchain(
        sendTo,
        parsedAmount,
        message,
        keyword
      );
      setIsLoading(true);
      console.log(`Loading - ${txHash.hash}`);

      await txHash.wait();
      setIsLoading(false);
      console.log(`Confirmed - ${txHash.hash}`);

      const transactionCount = await transactionContract.getTransactionCount();
      setTxCount(transactionCount.toNumber());

      getAllTransactions();
      // window.location.reload();
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExist();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        connectedAccount,
        formData,
        handleChange,
        sendTransaction,
        transactions,
        isLoading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
