// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, externalEuint32, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title User Decryption Example
/// @author FHEVM Examples
/// @notice Demonstrates how users can decrypt their own encrypted values off-chain
/// @dev Shows proper permission grants and decryption flow for user-specific data
contract UserDecryption is ZamaEthereumConfig {
  // User encrypted data storage
  mapping(address => euint32) private userEncryptedData32;
  mapping(address => euint64) private userEncryptedData64;

  // Struct to hold multiple encrypted values
  struct UserData {
    euint32 balance;
    euint32 score;
    euint64 timestamp;
  }

  mapping(address => UserData) private userData;

  event DataStored(address indexed user);
  event MultipleValuesStored(address indexed user);

  /// @notice Store a single encrypted 32-bit value for user decryption
  /// @param encryptedValue The encrypted value to store
  /// @param inputProof Zero-knowledge proof of correct encryption
  /// @dev User can later decrypt this value off-chain using their private key
  function storeSingleValue(externalEuint32 encryptedValue, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);
    userEncryptedData32[msg.sender] = value;

    // CRITICAL: Grant permissions for user decryption
    // allowThis: Contract can perform operations
    FHE.allowThis(value);
    // allow: User can decrypt off-chain
    FHE.allow(value, msg.sender);

    emit DataStored(msg.sender);
  }

  /// @notice Store a single encrypted 64-bit value for user decryption
  /// @param encryptedValue The encrypted value to store
  /// @param inputProof Zero-knowledge proof of correct encryption
  function storeSingleValue64(externalEuint64 encryptedValue, bytes calldata inputProof) external {
    euint64 value = FHE.fromExternal(encryptedValue, inputProof);
    userEncryptedData64[msg.sender] = value;

    FHE.allowThis(value);
    FHE.allow(value, msg.sender);

    emit DataStored(msg.sender);
  }

  /// @notice Store multiple encrypted values that user can decrypt
  /// @param encBalance Encrypted balance
  /// @param proofBalance Proof for balance
  /// @param encScore Encrypted score
  /// @param proofScore Proof for score
  /// @param encTimestamp Encrypted timestamp
  /// @param proofTimestamp Proof for timestamp
  /// @dev Demonstrates storing and granting decryption rights for multiple values
  function storeMultipleValues(
    externalEuint32 encBalance,
    bytes calldata proofBalance,
    externalEuint32 encScore,
    bytes calldata proofScore,
    externalEuint64 encTimestamp,
    bytes calldata proofTimestamp
  ) external {
    // Decrypt and store balance
    euint32 balance = FHE.fromExternal(encBalance, proofBalance);
    FHE.allowThis(balance);
    FHE.allow(balance, msg.sender);

    // Decrypt and store score
    euint32 score = FHE.fromExternal(encScore, proofScore);
    FHE.allowThis(score);
    FHE.allow(score, msg.sender);

    // Decrypt and store timestamp
    euint64 timestamp = FHE.fromExternal(encTimestamp, proofTimestamp);
    FHE.allowThis(timestamp);
    FHE.allow(timestamp, msg.sender);

    // Store in struct
    userData[msg.sender] = UserData({balance: balance, score: score, timestamp: timestamp});

    emit MultipleValuesStored(msg.sender);
  }

  /// @notice Get encrypted 32-bit value (requires off-chain decryption)
  /// @return The encrypted value that user can decrypt
  /// @dev User must use their private key to decrypt off-chain
  function getEncryptedValue32() external view returns (euint32) {
    return userEncryptedData32[msg.sender];
  }

  /// @notice Get encrypted 64-bit value (requires off-chain decryption)
  /// @return The encrypted value that user can decrypt
  function getEncryptedValue64() external view returns (euint64) {
    return userEncryptedData64[msg.sender];
  }

  /// @notice Get user's encrypted balance from struct
  /// @return The encrypted balance
  function getUserBalance() external view returns (euint32) {
    return userData[msg.sender].balance;
  }

  /// @notice Get user's encrypted score from struct
  /// @return The encrypted score
  function getUserScore() external view returns (euint32) {
    return userData[msg.sender].score;
  }

  /// @notice Get user's encrypted timestamp from struct
  /// @return The encrypted timestamp
  function getUserTimestamp() external view returns (euint64) {
    return userData[msg.sender].timestamp;
  }

  /// @notice Update encrypted value with FHE addition
  /// @param encAmount The encrypted amount to add
  /// @param inputProof Zero-knowledge proof
  /// @dev Demonstrates operations that preserve decryption rights
  function addToValue(externalEuint32 encAmount, bytes calldata inputProof) external {
    require(FHE.isInitialized(userEncryptedData32[msg.sender]), "No value stored");

    euint32 amount = FHE.fromExternal(encAmount, inputProof);
    userEncryptedData32[msg.sender] = FHE.add(userEncryptedData32[msg.sender], amount);

    // Re-grant permissions after operation
    FHE.allowThis(userEncryptedData32[msg.sender]);
    FHE.allow(userEncryptedData32[msg.sender], msg.sender);
  }

  /// @notice Example: Grant decryption permission to another address
  /// @param recipient The address to grant decryption rights
  /// @dev Shows how to share encrypted data with specific parties
  function shareWithUser(address recipient) external {
    require(FHE.isInitialized(userEncryptedData32[msg.sender]), "No value stored");
    require(recipient != address(0), "Invalid recipient");

    // Grant recipient permission to decrypt sender's data
    FHE.allow(userEncryptedData32[msg.sender], recipient);
  }

  /// @notice Check if user has stored a value
  /// @return True if user has stored a value
  function hasValue() external view returns (bool) {
    return FHE.isInitialized(userEncryptedData32[msg.sender]);
  }
}
