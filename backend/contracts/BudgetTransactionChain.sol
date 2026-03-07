// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BudgetTransactionChain {

    struct TransactionBlock {
        uint256 index;
        string txnId;
        string senderDept;
        string receiverDept;
        uint256 amount;
        uint256 amountDeducted;
        uint256 amountReceived;
        bytes32 senderHash;
        bytes32 receiverHash;
        bytes32 previousHash;
        uint256 timestamp;
    }

    TransactionBlock[] public chain;
    mapping(string => TransactionBlock) public transactionMap;
    mapping(string => bytes32[]) public deptTransactions;

    event TransactionStored(
        uint256 index,
        string txnId,
        string senderDept,
        string receiverDept,
        uint256 amount,
        uint256 amountDeducted,
        uint256 amountReceived,
        bytes32 senderHash,
        bytes32 receiverHash
    );

    event SenderHashGenerated(
        string txnId,
        string senderDept,
        uint256 amountDeducted,
        bytes32 senderHash
    );

    event ReceiverHashGenerated(
        string txnId,
        string receiverDept,
        uint256 amountReceived,
        bytes32 receiverHash
    );

    constructor() {
        createGenesisBlock();
    }

    function createGenesisBlock() internal {
        chain.push(
            TransactionBlock({
                index: 0,
                txnId: "GENESIS",
                senderDept: "NONE",
                receiverDept: "NONE",
                amount: 0,
                amountDeducted: 0,
                amountReceived: 0,
                senderHash: bytes32(0),
                receiverHash: bytes32(0),
                previousHash: bytes32(0),
                timestamp: block.timestamp
            })
        );
    }

    function generateSenderHash(
        string memory _txnId,
        string memory _senderDept,
        uint256 _amountDeducted
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            _txnId,
            _senderDept,
            _amountDeducted,
            "DEBIT",
            block.timestamp
        ));
    }

    function generateReceiverHash(
        string memory _txnId,
        string memory _receiverDept,
        uint256 _amountReceived
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            _txnId,
            _receiverDept,
            _amountReceived,
            "CREDIT",
            block.timestamp
        ));
    }

    function storeTransaction(
        string memory _txnId,
        string memory _senderDept,
        string memory _receiverDept,
        uint256 _amount,
        uint256 _amountDeducted,
        uint256 _amountReceived
    ) public {
        require(_amountDeducted > 0, "Amount deducted must be greater than 0");
        require(_amountReceived > 0, "Amount received must be greater than 0");
        require(_amountDeducted >= _amountReceived, "Amount deducted must be >= received");

        uint256 index = chain.length;
        bytes32 prevHash = getBlockHash(index - 1);

        // Generate hashes for sender and receiver
        bytes32 senderHash = generateSenderHash(_txnId, _senderDept, _amountDeducted);
        bytes32 receiverHash = generateReceiverHash(_txnId, _receiverDept, _amountReceived);

        TransactionBlock memory newBlock = TransactionBlock({
            index: index,
            txnId: _txnId,
            senderDept: _senderDept,
            receiverDept: _receiverDept,
            amount: _amount,
            amountDeducted: _amountDeducted,
            amountReceived: _amountReceived,
            senderHash: senderHash,
            receiverHash: receiverHash,
            previousHash: prevHash,
            timestamp: block.timestamp
        });

        chain.push(newBlock);
        transactionMap[_txnId] = newBlock;
        deptTransactions[_senderDept].push(senderHash);
        deptTransactions[_receiverDept].push(receiverHash);

        emit SenderHashGenerated(_txnId, _senderDept, _amountDeducted, senderHash);
        emit ReceiverHashGenerated(_txnId, _receiverDept, _amountReceived, receiverHash);
        emit TransactionStored(
            index,
            _txnId,
            _senderDept,
            _receiverDept,
            _amount,
            _amountDeducted,
            _amountReceived,
            senderHash,
            receiverHash
        );
    }

    function getBlockHash(uint256 _index)
        public
        view
        returns (bytes32)
    {
        require(_index < chain.length, "Index out of range");
        TransactionBlock memory blockData = chain[_index];

        return keccak256(
            abi.encodePacked(
                blockData.index,
                blockData.txnId,
                blockData.senderDept,
                blockData.receiverDept,
                blockData.amount,
                blockData.amountDeducted,
                blockData.amountReceived,
                blockData.senderHash,
                blockData.receiverHash,
                blockData.previousHash,
                blockData.timestamp
            )
        );
    }

    function getTransaction(string memory _txnId)
        public
        view
        returns (
            uint256 index,
            string memory txnId,
            string memory senderDept,
            string memory receiverDept,
            uint256 amount,
            uint256 amountDeducted,
            uint256 amountReceived,
            bytes32 senderHash,
            bytes32 receiverHash,
            uint256 timestamp
        )
    {
        TransactionBlock memory txn = transactionMap[_txnId];
        return (
            txn.index,
            txn.txnId,
            txn.senderDept,
            txn.receiverDept,
            txn.amount,
            txn.amountDeducted,
            txn.amountReceived,
            txn.senderHash,
            txn.receiverHash,
            txn.timestamp
        );
    }

    function getTransactionByIndex(uint256 _index)
        public
        view
        returns (
            uint256 index,
            string memory txnId,
            string memory senderDept,
            string memory receiverDept,
            uint256 amount,
            uint256 amountDeducted,
            uint256 amountReceived,
            bytes32 senderHash,
            bytes32 receiverHash,
            uint256 timestamp
        )
    {
        require(_index < chain.length, "Index out of range");
        TransactionBlock memory txn = chain[_index];
        return (
            txn.index,
            txn.txnId,
            txn.senderDept,
            txn.receiverDept,
            txn.amount,
            txn.amountDeducted,
            txn.amountReceived,
            txn.senderHash,
            txn.receiverHash,
            txn.timestamp
        );
    }

    function getDeptTransactionHashes(string memory _dept)
        public
        view
        returns (bytes32[] memory)
    {
        return deptTransactions[_dept];
    }

    function getChainLength() public view returns(uint256) {
        return chain.length;
    }

    function validateChain() public view returns (bool) {
        for (uint256 i = 1; i < chain.length; i++) {
            bytes32 currentHash = getBlockHash(i);
            bytes32 currentPrevHash = chain[i].previousHash;
            bytes32 expectedPrevHash = getBlockHash(i - 1);

            if (currentPrevHash != expectedPrevHash) {
                return false;
            }
        }
        return true;
    }
}
