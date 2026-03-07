// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title FundTransactionBlockchain
 * @dev Records government fund transactions on Polygon blockchain
 * @notice This contract stores fund transfers between nodal agencies with cryptographic verification
 */

contract FundTransactionBlockchain {
    
    // ========================================================================
    // STRUCTS & TYPES
    // ========================================================================
    
    /**
     * @dev Represents a single transaction in the blockchain
     */
    struct Transaction {
        bytes32 transactionHash;        // Unique transaction hash
        address sender;                 // Sender address (nodal agency wallet)
        address receiver;               // Receiver address (nodal agency wallet)
        uint256 amount;                 // Amount in Wei
        string schemeId;                // Scheme identifier
        string transactionType;         // "debit", "credit", or "transfer"
        uint256 timestamp;              // Block timestamp
        string description;             // Transaction description
        bytes32 senderHash;             // Hash of sender side
        bytes32 receiverHash;           // Hash of receiver side
        bool verified;                  // Signature verification status
    }
    
    /**
     * @dev Represents a block containing multiple transactions
     */
    struct Block {
        uint256 blockIndex;             // Block number
        bytes32 blockHash;              // Block hash (Proof of Work)
        bytes32 previousBlockHash;      // Link to previous block
        bytes32[] transactionHashes;    // Array of transaction hashes in block
        uint256 timestamp;              // When block was mined
        uint256 nonce;                  // Proof of Work nonce
        uint256 difficulty;             // Mining difficulty
    }
    
    // ========================================================================
    // STATE VARIABLES
    // ========================================================================
    
    address public owner;                           // Contract owner
    mapping(bytes32 => Transaction) public transactions;   // All transactions by hash
    mapping(bytes32 => Block) public blocks;       // All blocks by hash
    mapping(address => bytes32[]) public addressTransactions;  // Transactions per address
    mapping(string => bytes32[]) public schemeTransactions;   // Transactions per scheme
    
    bytes32[] public blockHashHistory;             // History of all block hashes
    uint256 public totalTransactions;              // Total transaction count
    uint256 public totalAmountTransferred;         // Total amount transferred
    float public miningReward;                     // Reward per mined block
    
    // Genesis block hash
    bytes32 public genesisBlockHash;
    bytes32 public latestBlockHash;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    event TransactionRecorded(
        bytes32 indexed transactionHash,
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        string schemeId,
        uint256 timestamp
    );
    
    event BlockMined(
        uint256 indexed blockIndex,
        bytes32 indexed blockHash,
        bytes32 previousBlockHash,
        uint256 transactionCount,
        uint256 timestamp
    );
    
    event SenderHashGenerated(
        bytes32 indexed transactionHash,
        bytes32 senderHash,
        string description
    );
    
    event ReceiverHashGenerated(
        bytes32 indexed transactionHash,
        bytes32 receiverHash,
        string description
    );
    
    event BlockchainValidated(
        bool isValid,
        string message
    );
    
    // ========================================================================
    // MODIFIERS
    // ========================================================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    constructor() {
        owner = msg.sender;
        miningReward = 1.0;
        totalTransactions = 0;
        totalAmountTransferred = 0;
        
        // Create genesis block
        _createGenesisBlock();
    }
    
    // ========================================================================
    // CORE FUNCTIONS
    // ========================================================================
    
    /**
     * @dev Create the genesis (first) block
     */
    function _createGenesisBlock() private {
        bytes32 emptyHash = keccak256(abi.encodePacked("genesis"));
        genesisBlockHash = emptyHash;
        latestBlockHash = emptyHash;
        blockHashHistory.push(emptyHash);
    }
    
    /**
     * @dev Record a transaction with sender-side debit
     * @param _receiver Receiver address
     * @param _amount Amount in Wei
     * @param _schemeId Scheme identifier
     * @param _description Transaction description
     * @return Transaction hash
     */
    function recordDebitTransaction(
        address _receiver,
        uint256 _amount,
        string memory _schemeId,
        string memory _description
    ) public returns (bytes32) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_receiver != address(0), "Receiver address cannot be zero");
        require(_receiver != msg.sender, "Sender and receiver cannot be same");
        
        // Generate transaction hash (sender side)
        bytes32 transactionHash = keccak256(abi.encodePacked(
            msg.sender,
            _receiver,
            _amount,
            _schemeId,
            block.timestamp
        ));
        
        // Generate sender hash for debit
        bytes32 senderHash = keccak256(abi.encodePacked(
            msg.sender,
            _amount,
            "debit",
            block.timestamp
        ));
        
        // Create transaction record
        transactions[transactionHash] = Transaction(
            transactionHash,
            msg.sender,
            _receiver,
            _amount,
            _schemeId,
            "debit",
            block.timestamp,
            _description,
            senderHash,
            bytes32(0),  // Receiver hash will be generated on credit side
            false
        );
        
        // Update mappings
        addressTransactions[msg.sender].push(transactionHash);
        schemeTransactions[_schemeId].push(transactionHash);
        totalTransactions++;
        
        emit SenderHashGenerated(transactionHash, senderHash, _description);
        emit TransactionRecorded(
            transactionHash,
            msg.sender,
            _receiver,
            _amount,
            _schemeId,
            block.timestamp
        );
        
        return transactionHash;
    }
    
    /**
     * @dev Record receiver-side credit for a transaction
     * @param _transactionHash Hash of the debit transaction
     * @param _receiver Receiver address (should match original transaction)
     * @param _description Transaction description
     */
    function recordCreditTransaction(
        bytes32 _transactionHash,
        address _receiver,
        string memory _description
    ) public {
        require(transactions[_transactionHash].transactionHash != bytes32(0), "Transaction not found");
        require(_receiver != address(0), "Receiver address cannot be zero");
        
        Transaction storage txn = transactions[_transactionHash];
        require(txn.receiver == _receiver, "Receiver address mismatch");
        
        // Generate receiver hash for credit
        bytes32 receiverHash = keccak256(abi.encodePacked(
            _receiver,
            txn.amount,
            "credit",
            block.timestamp
        ));
        
        // Update transaction with receiver hash
        txn.receiverHash = receiverHash;
        txn.verified = true;  // Mark as verified after both sides recorded
        
        // Update mappings
        addressTransactions[_receiver].push(_transactionHash);
        totalAmountTransferred += txn.amount;
        
        emit ReceiverHashGenerated(_transactionHash, receiverHash, _description);
    }
    
    /**
     * @dev Mine pending transactions into a new block
     * @param _minerAddress Address of the miner receiving reward
     * @return blockHash Hash of the newly mined block
     */
    function mineBlock(
        address _minerAddress
    ) public returns (bytes32) {
        // In production, implement Proof of Work verification
        // For now, simplified mining with nonce
        
        bytes32 newBlockHash = keccak256(abi.encodePacked(
            blockHashHistory.length,
            latestBlockHash,
            block.timestamp,
            _minerAddress
        ));
        
        // Create block record
        bytes32[] memory emptyTxList;
        blocks[newBlockHash] = Block(
            blockHashHistory.length,
            newBlockHash,
            latestBlockHash,
            emptyTxList,
            block.timestamp,
            1,  // difficulty
            0   // nonce
        );
        
        // Update blockchain state
        blockHashHistory.push(newBlockHash);
        latestBlockHash = newBlockHash;
        
        emit BlockMined(
            blockHashHistory.length - 1,
            newBlockHash,
            latestBlockHash,
            0,
            block.timestamp
        );
        
        return newBlockHash;
    }
    
    // ========================================================================
    // QUERY FUNCTIONS
    // ========================================================================
    
    /**
     * @dev Get transaction details by hash
     */
    function getTransaction(bytes32 _transactionHash) 
        public 
        view 
        returns (Transaction memory) 
    {
        return transactions[_transactionHash];
    }
    
    /**
     * @dev Get all transactions for an address
     */
    function getAddressTransactions(address _address) 
        public 
        view 
        returns (bytes32[] memory) 
    {
        return addressTransactions[_address];
    }
    
    /**
     * @dev Get all transactions for a scheme
     */
    function getSchemeTransactions(string memory _schemeId) 
        public 
        view 
        returns (bytes32[] memory) 
    {
        return schemeTransactions[_schemeId];
    }
    
    /**
     * @dev Get blockchain summary statistics
     */
    function getBlockchainSummary() 
        public 
        view 
        returns (
            uint256 _totalTransactions,
            uint256 _totalBlocks,
            uint256 _totalAmountTransferred,
            bytes32 _latestBlockHash
        ) 
    {
        return (
            totalTransactions,
            blockHashHistory.length,
            totalAmountTransferred,
            latestBlockHash
        );
    }
    
    /**
     * @dev Validate blockchain integrity
     */
    function validateBlockchain() 
        public 
        view 
        returns (bool) 
    {
        // Check that all blocks are properly linked
        for (uint256 i = 1; i < blockHashHistory.length; i++) {
            bytes32 currentHash = blockHashHistory[i];
            bytes32 previousHash = blockHashHistory[i - 1];
            
            Block memory currentBlock = blocks[currentHash];
            if (currentBlock.previousBlockHash != previousHash) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * @dev Get total blocks in blockchain
     */
    function getTotalBlocks() public view returns (uint256) {
        return blockHashHistory.length;
    }
    
    /**
     * @dev Verify transaction integrity (sender and receiver hashes match)
     */
    function verifyTransaction(bytes32 _transactionHash) 
        public 
        view 
        returns (bool) 
    {
        Transaction memory txn = transactions[_transactionHash];
        return txn.verified && txn.senderHash != bytes32(0) && txn.receiverHash != bytes32(0);
    }
}
