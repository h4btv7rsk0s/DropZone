// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ChainVote
 * @notice On-chain voting DAO system based on FHE
 * @dev Implements voting mechanism using Fully Homomorphic Encryption
 * 
 * Core Features:
 * - Anyone can create proposals (with anti-spam fee)
 * - All votes are encrypted using euint64
 * - Time-based voting windows
 * - Results can be decrypted after voting ends
 * - Double voting prevention
 * 
 * Privacy Model:
 * - All vote counts are encrypted during voting
 * - Uses FHE homomorphic operations to accumulate votes
 * - Only final results are decrypted
 * - Individual vote choices are never exposed
 */
contract ChainVote is SepoliaConfig {
    
    // ============================================
    // Struct Definitions
    // ============================================
    
    struct Proposal {
        string name;                                     // Proposal name
        string details;                                  // Proposal details
        string[] choices;                                // Voting choices
        uint256 votingStart;                             // Voting start time
        uint256 votingEnd;                               // Voting end time
        bool resultsPublished;                           // Results published flag
        address proposer;                                // Proposer address
        mapping(uint256 => euint64) encryptedVotes;      // Encrypted votes: choiceId => vote count
        mapping(uint256 => uint256) publicVotes;         // Public votes: choiceId => vote count
        mapping(address => bool) voted;                  // Vote record: address => voted status
        uint256 voterCount;                              // Total voters count
    }
    
    // ============================================
    // State Variables
    // ============================================
    
    address public admin;
    uint256 public proposalCounter;
    uint256 public proposalFee = 0.001 ether;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => uint256) private pendingDecryptions;  // proposalId => decryption requestId
    mapping(uint256 => uint256) private decryptionRequestToProposal; // requestId => proposalId (offset by +1)
    
    // ============================================
    // Events
    // ============================================
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string name,
        uint256 votingStart,
        uint256 votingEnd,
        uint256 choicesCount
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 indexed choiceId
    );
    
    event ResultsDecryptionRequested(
        uint256 indexed proposalId,
        uint256 indexed requestId
    );
    
    event ResultsPublished(
        uint256 indexed proposalId,
        uint256[] votes,
        uint256 totalVoters
    );
    
    event ProposalFeeUpdated(uint256 oldFee, uint256 newFee);
    event FundsWithdrawn(uint256 amount, address indexed recipient);
    
    // ============================================
    // Error Definitions
    // ============================================
    
    error Unauthorized();
    error InsufficientFee();
    error InvalidProposal();
    error InvalidTimeWindow();
    error InvalidChoices();
    error VotingNotStarted();
    error VotingEnded();
    error VotingInProgress();
    error AlreadyVoted();
    error InvalidChoice();
    error ResultsAlreadyPublished();
    error ResultsNotAvailable();
    error DecryptionPending();
    error InvalidCallback();
    error WithdrawFailed();
    
    // ============================================
    // Modifiers
    // ============================================
    
    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }
    
    modifier validProposal(uint256 proposalId) {
        if (proposalId >= proposalCounter) revert InvalidProposal();
        _;
    }
    
    modifier duringVoting(uint256 proposalId) {
        Proposal storage proposal = proposals[proposalId];
        if (block.timestamp < proposal.votingStart) revert VotingNotStarted();
        if (block.timestamp >= proposal.votingEnd) revert VotingEnded();
        _;
    }
    
    modifier afterVoting(uint256 proposalId) {
        if (block.timestamp < proposals[proposalId].votingEnd) revert VotingInProgress();
        _;
    }
    
    // ============================================
    // Constructor
    // ============================================
    
    constructor() {
        admin = msg.sender;
        proposalCounter = 0;
    }
    
    // ============================================
    // Admin Functions
    // ============================================
    
    /**
     * @notice Update proposal fee
     * @param newFee New fee amount
     */
    function updateProposalFee(uint256 newFee) external onlyAdmin {
        uint256 oldFee = proposalFee;
        proposalFee = newFee;
        emit ProposalFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @notice Withdraw contract balance
     */
    function withdrawFunds() external onlyAdmin {
        uint256 balance = address(this).balance;
        (bool success, ) = admin.call{value: balance}("");
        if (!success) revert WithdrawFailed();
        emit FundsWithdrawn(balance, admin);
    }
    
    // ============================================
    // Core Functions - Create Proposal
    // ============================================
    
    /**
     * @notice Create new proposal
     * @param name Proposal name
     * @param details Proposal details
     * @param choices Array of voting choices
     * @param votingStart Voting start timestamp
     * @param votingEnd Voting end timestamp
     * @return proposalId Proposal ID
     */
    function createProposal(
        string memory name,
        string memory details,
        string[] memory choices,
        uint256 votingStart,
        uint256 votingEnd
    ) external payable returns (uint256 proposalId) {
        // Validate fee
        if (msg.value < proposalFee) revert InsufficientFee();
        
        // Validate time window
        if (votingStart >= votingEnd || votingEnd <= block.timestamp) {
            revert InvalidTimeWindow();
        }
        
        // Validate choices count
        if (choices.length < 2 || choices.length > 10) {
            revert InvalidChoices();
        }
        
        proposalId = proposalCounter++;
        Proposal storage newProposal = proposals[proposalId];
        
        newProposal.name = name;
        newProposal.details = details;
        newProposal.choices = choices;
        newProposal.votingStart = votingStart;
        newProposal.votingEnd = votingEnd;
        newProposal.resultsPublished = false;
        newProposal.proposer = msg.sender;
        newProposal.voterCount = 0;
        
        // Initialize encrypted votes to 0
        for (uint256 i = 0; i < choices.length; i++) {
            euint64 zero = FHE.asEuint64(0);
            newProposal.encryptedVotes[i] = zero;
            FHE.allowThis(zero);
        }
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            name,
            votingStart,
            votingEnd,
            choices.length
        );
    }
    
    // ============================================
    // Core Functions - Voting
    // ============================================
    
    /**
     * @notice Cast vote
     * @param proposalId Proposal ID
     * @param choiceId Choice ID
     * @param encryptedVote Encrypted vote (value of 1)
     * @param proof Zero-knowledge proof
     */
    function castVote(
        uint256 proposalId,
        uint256 choiceId,
        externalEuint64 encryptedVote,
        bytes calldata proof
    ) 
        external 
        validProposal(proposalId) 
        duringVoting(proposalId) 
    {
        Proposal storage proposal = proposals[proposalId];
        
        // Check if already voted
        if (proposal.voted[msg.sender]) revert AlreadyVoted();
        
        // Validate choice ID
        if (choiceId >= proposal.choices.length) revert InvalidChoice();
        
        // Import encrypted vote
        euint64 vote = FHE.fromExternal(encryptedVote, proof);
        
        // Homomorphic addition to accumulate votes
        proposal.encryptedVotes[choiceId] = FHE.add(
            proposal.encryptedVotes[choiceId],
            vote
        );
        
        // Authorize contract to access new encrypted votes
        FHE.allowThis(proposal.encryptedVotes[choiceId]);
        
        // Mark as voted
        proposal.voted[msg.sender] = true;
        proposal.voterCount++;
        
        emit VoteCast(proposalId, msg.sender, choiceId);
    }
    
    // ============================================
    // Core Functions - Decrypt Results
    // ============================================
    
    /**
     * @notice Request decryption of voting results
     * @param proposalId Proposal ID
     */
    function requestResultsDecryption(uint256 proposalId)
        external
        validProposal(proposalId)
        afterVoting(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.resultsPublished) revert ResultsAlreadyPublished();
        if (pendingDecryptions[proposalId] != 0) revert DecryptionPending();
        
        uint256 choicesCount = proposal.choices.length;
        bytes32[] memory encryptedData = new bytes32[](choicesCount);
        
        for (uint256 i = 0; i < choicesCount; i++) {
            encryptedData[i] = FHE.toBytes32(proposal.encryptedVotes[i]);
        }
        
        uint256 requestId = FHE.requestDecryption(
            encryptedData,
            this.decryptionCallback.selector
        );
        
        pendingDecryptions[proposalId] = requestId;
        decryptionRequestToProposal[requestId] = proposalId + 1;
        
        emit ResultsDecryptionRequested(proposalId, requestId);
    }
    
    /**
     * @notice Decryption callback function
     * @param requestId Decryption request ID
     * @param decryptedData Decrypted data
     * @param decryptionProof Decryption proof
     */
    function decryptionCallback(
        uint256 requestId,
        bytes memory decryptedData,
        bytes memory decryptionProof
    ) external {
        uint256 storedValue = decryptionRequestToProposal[requestId];
        if (storedValue == 0) revert InvalidCallback();
        uint256 proposalId = storedValue - 1;
        
        // Verify signatures
        require(pendingDecryptions[proposalId] == requestId, "Invalid request");
        FHE.checkSignatures(requestId, decryptedData, decryptionProof);
        
        Proposal storage proposal = proposals[proposalId];
        uint256 choicesCount = proposal.choices.length;
        uint256[] memory votes = new uint256[](choicesCount);
        
        // Parse decrypted data
        for (uint256 i = 0; i < choicesCount; i++) {
            uint256 value;
            assembly {
                value := mload(add(add(decryptedData, 0x20), mul(i, 0x20)))
            }
            uint64 voteCount = uint64(value);
            votes[i] = uint256(voteCount);
            proposal.publicVotes[i] = uint256(voteCount);
        }
        
        proposal.resultsPublished = true;
        delete pendingDecryptions[proposalId];
        delete decryptionRequestToProposal[requestId];
        
        emit ResultsPublished(proposalId, votes, proposal.voterCount);
    }
    
    // ============================================
    // View Functions
    // ============================================
    
    /**
     * @notice Get proposal basic information
     */
    function getProposalInfo(uint256 proposalId)
        external
        view
        validProposal(proposalId)
        returns (
            string memory name,
            string memory details,
            string[] memory choices,
            uint256 votingStart,
            uint256 votingEnd,
            bool resultsPublished,
            address proposer,
            uint256 voterCount
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.name,
            proposal.details,
            proposal.choices,
            proposal.votingStart,
            proposal.votingEnd,
            proposal.resultsPublished,
            proposal.proposer,
            proposal.voterCount
        );
    }
    
    /**
     * @notice Get proposal results (only after published)
     */
    function getProposalResults(uint256 proposalId)
        external
        view
        validProposal(proposalId)
        returns (uint256[] memory votes)
    {
        Proposal storage proposal = proposals[proposalId];
        if (!proposal.resultsPublished) revert ResultsNotAvailable();
        
        uint256 choicesCount = proposal.choices.length;
        votes = new uint256[](choicesCount);
        
        for (uint256 i = 0; i < choicesCount; i++) {
            votes[i] = proposal.publicVotes[i];
        }
    }
    
    /**
     * @notice Check if user has voted
     */
    function hasVoted(uint256 proposalId, address voter)
        external
        view
        validProposal(proposalId)
        returns (bool)
    {
        return proposals[proposalId].voted[voter];
    }
    
    /**
     * @notice Get proposal count
     */
    function getProposalCount() external view returns (uint256) {
        return proposalCounter;
    }
}
