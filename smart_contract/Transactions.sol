//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Transactions {
    uint256 transactionCount;
    address payable owner;

    constructor() payable
    {
        owner = payable(address(msg.sender));
    } 

    modifier onlyOwner {
        require(msg.sender == owner);
        _; // rest of the code
    }

    // function that we will emit/call later on
    /*
        Each transactions has to have:
        1) address of sender
        2) address of receiver
        3) amount for the transaction
        4) message encoded in the transaction
        5) timestamp at which the transaction occured
        6) keyword for GIF
     */
    event Transfer(address from, address receiver, uint amount, string message, uint256 timestamp, string keyword);
    struct TransferStruct {
        address sender;
        address receiver;
        uint amount;
        string message;
        uint256 timestamp;
        string keyword;
    }

    TransferStruct[] transactions;

    function addToBlockchain(address payable receiver, uint amount, string memory message, string memory keyword) public {
        transactions.push(TransferStruct(msg.sender, receiver, amount, message, block.timestamp, keyword));
        emit Transfer(msg.sender, receiver, amount, message, block.timestamp, keyword);
        transactionCount += 1;
    }

    function getAllTransactions() public view returns (TransferStruct[] memory) {
        return transactions;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactionCount;
    }

    function closeContract() onlyOwner public 
    { 
        selfdestruct(owner); 
    }
}