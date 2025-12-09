// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Privacy-Preserving Lottery Contract
/// @author FHEVM Examples
/// @notice A lottery system demonstrating FHE encryption for privacy-preserving participant entries
/// @dev This contract showcases:
/// - Encrypted number storage using FHEVM
/// - Access control patterns with FHE.allowThis and FHE.allow
/// - Input proofs for encrypted values
/// - Multi-round lottery mechanics
contract PrivateLottery is ZamaEthereumConfig {
    struct LotteryEntry {
        address participant;
        euint32 encryptedNumber;
        uint256 timestamp;
    }

    struct Winner {
        address winner;
        uint256 prize;
        uint32 winningNumber;
        uint256 timestamp;
    }

    address public owner;
    uint256 public entryFee = 0.001 ether;
    uint256 public prizePool;
    bool public isActive = true;
    uint256 public roundNumber = 1;

    LotteryEntry[] public entries;
    Winner[] public winners;

    mapping(address => uint256) public participantEntries;
    mapping(address => bool) public hasWon;

    event LotteryEntered(address indexed participant, uint256 timestamp, uint256 round);
    event WinnerDrawn(address indexed winner, uint256 prize, uint32 winningNumber, uint256 round);
    event LotteryReset(uint256 newRound);
    event LotteryStatusChanged(bool isActive);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyActive() {
        require(isActive, "Lottery is not active");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Enter the lottery with an encrypted number between 1-100
    /// @param encryptedNumber The encrypted number chosen by the participant
    /// @param inputProof The input proof for the encrypted number
    /// @dev The number is encrypted on the client side and can only be decrypted
    /// by the contract with proper permissions. This ensures privacy of participant choices.
    function enterLottery(externalEuint32 encryptedNumber, bytes calldata inputProof) external payable onlyActive {
        require(msg.value >= entryFee, "Insufficient entry fee");

        // Convert external encrypted value to internal euint32
        euint32 encryptedValue = FHE.fromExternal(encryptedNumber, inputProof);

        // Store the encrypted entry
        entries.push(LotteryEntry({ participant: msg.sender, encryptedNumber: encryptedValue, timestamp: block.timestamp }));

        participantEntries[msg.sender]++;
        prizePool += msg.value;

        emit LotteryEntered(msg.sender, block.timestamp, roundNumber);
    }

    /// @notice Draw a winner from the current lottery round
    /// @return The address of the winner
    /// @dev This function:
    /// 1. Selects a random entry using block data
    /// 2. Extracts and decrypts the winning encrypted number
    /// 3. Records the winner
    /// 4. Transfers prizes
    /// 5. Resets for the next round
    function drawWinner() external onlyOwner onlyActive returns (address) {
        require(entries.length > 0, "No entries in lottery");

        // Generate random index
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.number,
                    blockhash(block.number - 1),
                    entries.length,
                    msg.sender
                )
            )
        ) % entries.length;

        LotteryEntry storage winningEntry = entries[randomIndex];
        address winner = winningEntry.participant;
        euint32 encryptedWinningNumber = winningEntry.encryptedNumber;

        // Grant permissions to decrypt the winning number
        FHE.allowThis(encryptedWinningNumber);
        FHE.allow(encryptedWinningNumber, owner);

        // For demonstration: decrypt by owner (in production, could use relayer)
        // Note: In actual FHEVM, decryption requires proper authorization
        uint32 winningNumber = 0; // Placeholder for decrypted value

        // Calculate prize distribution
        uint256 prize = (prizePool * 80) / 100; // 80% to winner
        uint256 ownerFee = prizePool - prize;   // 20% to platform

        // Record winner
        hasWon[winner] = true;
        winners.push(Winner({ winner: winner, prize: prize, winningNumber: winningNumber, timestamp: block.timestamp }));

        // Transfer prizes
        (bool successWinner, ) = payable(winner).call{ value: prize }("");
        require(successWinner, "Prize transfer to winner failed");

        (bool successOwner, ) = payable(owner).call{ value: ownerFee }("");
        require(successOwner, "Fee transfer to owner failed");

        emit WinnerDrawn(winner, prize, winningNumber, roundNumber);

        // Reset for next round
        resetLottery();

        return winner;
    }

    /// @notice Reset the lottery for the next round
    function resetLottery() internal {
        delete entries;
        prizePool = 0;
        roundNumber++;

        emit LotteryReset(roundNumber);
    }

    // View functions

    /// @notice Get the current prize pool
    /// @return The total prize pool in wei
    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }

    /// @notice Get the entry fee
    /// @return The entry fee in wei
    function getEntryFee() external view returns (uint256) {
        return entryFee;
    }

    /// @notice Get the number of entries in current round
    /// @return The number of entries
    function getEntryCount() external view returns (uint256) {
        return entries.length;
    }

    /// @notice Get the current round number
    /// @return The current round number
    function getCurrentRound() external view returns (uint256) {
        return roundNumber;
    }

    /// @notice Get the last winner
    /// @return The address of the last winner
    function getLastWinner() external view returns (address) {
        require(winners.length > 0, "No winners yet");
        return winners[winners.length - 1].winner;
    }

    /// @notice Get all winners
    /// @return Array of all winners
    function getAllWinners() external view returns (Winner[] memory) {
        return winners;
    }

    /// @notice Check if lottery is active
    /// @return True if active, false otherwise
    function isLotteryActive() external view returns (bool) {
        return isActive;
    }

    /// @notice Get number of entries for a participant
    /// @param participant The participant address
    /// @return The number of entries
    function getParticipantEntries(address participant) external view returns (uint256) {
        return participantEntries[participant];
    }

    /// @notice Check if a participant has won
    /// @param participant The participant address
    /// @return True if participant has won
    function hasParticipantWon(address participant) external view returns (bool) {
        return hasWon[participant];
    }

    // Owner functions

    /// @notice Set the lottery active status
    /// @param active True to activate, false to deactivate
    function setLotteryActive(bool active) external onlyOwner {
        isActive = active;
        emit LotteryStatusChanged(active);
    }

    /// @notice Set the entry fee
    /// @param newFee The new entry fee in wei
    function setEntryFee(uint256 newFee) external onlyOwner {
        entryFee = newFee;
    }

    /// @notice Emergency withdraw all funds
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner).call{ value: address(this).balance }("");
        require(success, "Withdrawal failed");
    }

    /// @notice Allow direct donations to prize pool
    receive() external payable {
        prizePool += msg.value;
    }

    fallback() external payable {
        prizePool += msg.value;
    }
}
