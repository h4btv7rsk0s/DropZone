// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Lottery - Privacy-preserving lottery with encrypted ticket numbers
/// @notice Ticket numbers remain encrypted until users claim prizes with proof
contract FHELottery is SepoliaConfig {
    struct Ticket {
        address buyer;
        euint32 number; // Encrypted ticket number
        bool claimed;
    }

    struct LotteryRound {
        string name;
        uint256 drawTime;
        bool drawn;
        uint32 plainWinningNumber; // Revealed after draw
        uint256 ticketCount;
        mapping(uint256 => Ticket) tickets; // ticketId => Ticket
        mapping(address => uint256[]) userTickets; // user => ticketIds
    }

    mapping(uint256 => LotteryRound) public rounds;
    uint256 public roundCount;
    address public admin;

    event RoundCreated(uint256 indexed roundId, string name, uint256 drawTime);
    event TicketBought(uint256 indexed roundId, address indexed buyer, uint256 ticketId);
    event RoundDrawn(uint256 indexed roundId, uint32 winningNumber);
    event PrizeClaimed(uint256 indexed roundId, address indexed winner, uint256 ticketId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Create a new lottery round
    function createRound(string calldata name, uint256 drawTime) external onlyAdmin returns (uint256) {
        require(drawTime > block.timestamp, "Draw time must be in future");

        uint256 roundId = roundCount++;
        LotteryRound storage r = rounds[roundId];
        r.name = name;
        r.drawTime = drawTime;
        r.drawn = false;
        r.plainWinningNumber = 0;

        emit RoundCreated(roundId, name, drawTime);
        return roundId;
    }

    /// @notice Buy a lottery ticket with encrypted number
    function buyTicket(uint256 roundId, externalEuint32 encryptedNumber, bytes memory proof) external returns (uint256) {
        require(roundId < roundCount, "Round not exist");
        LotteryRound storage round = rounds[roundId];
        require(!round.drawn, "Already drawn");
        require(block.timestamp < round.drawTime, "Round closed");

        // Convert external encrypted input to internal encrypted value
        euint32 cipherNumber = FHE.fromExternal(encryptedNumber, proof);

        uint256 ticketId = round.ticketCount++;
        Ticket storage ticket = round.tickets[ticketId];
        ticket.buyer = msg.sender;
        ticket.number = cipherNumber;
        ticket.claimed = false;

        round.userTickets[msg.sender].push(ticketId);

        // Allow user and contract to access encrypted number
        FHE.allow(cipherNumber, msg.sender);
        FHE.allowThis(cipherNumber);

        emit TicketBought(roundId, msg.sender, ticketId);
        return ticketId;
    }

    /// @notice Admin draws the winning number (stored in plaintext after draw)
    function draw(uint256 roundId, uint32 plainWinningNumber) external onlyAdmin {
        require(roundId < roundCount, "Round not exist");
        LotteryRound storage round = rounds[roundId];
        require(!round.drawn, "Already drawn");
        require(block.timestamp >= round.drawTime, "Cannot draw before draw time");

        round.plainWinningNumber = plainWinningNumber;
        round.drawn = true;

        emit RoundDrawn(roundId, plainWinningNumber);
    }

    /// @notice Users claim prize by proving their encrypted number matches winning number
    /// @dev User must provide proof that their ticket number equals winning number
    function claimPrize(uint256 roundId, uint256 ticketId) external {
        require(roundId < roundCount, "Round not exist");
        LotteryRound storage round = rounds[roundId];
        require(round.drawn, "Not drawn yet");

        Ticket storage ticket = round.tickets[ticketId];
        require(ticket.buyer == msg.sender, "Not ticket owner");
        require(!ticket.claimed, "Already claimed");

        // Compare encrypted ticket number with plaintext winning number
        euint32 winningCipher = FHE.asEuint32(round.plainWinningNumber);
        ebool isWinner = FHE.eq(ticket.number, winningCipher);

        // Allow user to decrypt the comparison result
        FHE.allow(isWinner, msg.sender);

        // User must call this from frontend with decrypted proof
        // In production, you would transfer prize here if isWinner is true
        ticket.claimed = true;

        emit PrizeClaimed(roundId, msg.sender, ticketId);
    }

    /// @notice Get encrypted ticket number handle for user to decrypt
    function getMyTicketNumber(uint256 roundId, uint256 ticketId) external view returns (euint32) {
        require(roundId < roundCount, "Round not exist");
        LotteryRound storage round = rounds[roundId];
        Ticket storage ticket = round.tickets[ticketId];
        require(ticket.buyer == msg.sender, "Not ticket owner");

        return ticket.number;
    }

    /// @notice Get round information
    function getRound(uint256 roundId) external view returns (
        string memory name,
        uint32 winningNumber,
        uint256 drawTime,
        bool drawn,
        uint256 ticketCount
    ) {
        require(roundId < roundCount, "Round not exist");
        LotteryRound storage round = rounds[roundId];

        return (
            round.name,
            round.drawn ? round.plainWinningNumber : 0,
            round.drawTime,
            round.drawn,
            round.ticketCount
        );
    }

    /// @notice Get user's ticket IDs for a round
    function getMyTickets(uint256 roundId) external view returns (uint256[] memory) {
        require(roundId < roundCount, "Round not exist");
        return rounds[roundId].userTickets[msg.sender];
    }

    /// @notice Get ticket info
    function getTicketInfo(uint256 roundId, uint256 ticketId) external view returns (
        address buyer,
        bool claimed
    ) {
        require(roundId < roundCount, "Round not exist");
        LotteryRound storage round = rounds[roundId];
        require(ticketId < round.ticketCount, "Ticket not exist");

        Ticket storage ticket = round.tickets[ticketId];
        return (ticket.buyer, ticket.claimed);
    }
}
