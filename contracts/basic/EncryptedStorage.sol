// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, externalEuint32, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Storage Example
/// @author FHEVM Examples
/// @notice Demonstrates storing and managing multiple encrypted values
/// @dev Shows encryption of single and multiple values with proper permission management
contract EncryptedStorage is ZamaEthereumConfig {
  // User encrypted data storage
  mapping(address => euint32) private userEncryptedValue32;
  mapping(address => euint64) private userEncryptedValue64;

  event ValueStored32(address indexed user);
  event ValueStored64(address indexed user);
  event MultipleValuesStored(address indexed user);

  /// @notice Store a single encrypted 32-bit value for the caller
  /// @param encryptedValue The encrypted value to store
  /// @param inputProof Zero-knowledge proof of correct encryption
  /// @dev Demonstrates basic encrypted value storage with permissions
  function storeSingleValue32(externalEuint32 encryptedValue, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);
    userEncryptedValue32[msg.sender] = value;

    // Grant permissions for both contract and user
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);

    emit ValueStored32(msg.sender);
  }

  /// @notice Store a single encrypted 64-bit value for the caller
  /// @param encryptedValue The encrypted value to store
  /// @param inputProof Zero-knowledge proof of correct encryption
  /// @dev Demonstrates storage of different encrypted types
  function storeSingleValue64(externalEuint64 encryptedValue, bytes calldata inputProof) external {
    euint64 value = FHE.fromExternal(encryptedValue, inputProof);
    userEncryptedValue64[msg.sender] = value;

    FHE.allowThis(value);
    FHE.allow(value, msg.sender);

    emit ValueStored64(msg.sender);
  }

  /// @notice Store multiple encrypted values in one transaction
  /// @param encryptedValue32 The encrypted 32-bit value
  /// @param inputProof32 Proof for 32-bit value
  /// @param encryptedValue64 The encrypted 64-bit value
  /// @param inputProof64 Proof for 64-bit value
  /// @dev Demonstrates batch storage with multiple encrypted types
  function storeMultipleValues(
    externalEuint32 encryptedValue32,
    bytes calldata inputProof32,
    externalEuint64 encryptedValue64,
    bytes calldata inputProof64
  ) external {
    // Store 32-bit value
    euint32 value32 = FHE.fromExternal(encryptedValue32, inputProof32);
    userEncryptedValue32[msg.sender] = value32;
    FHE.allowThis(value32);
    FHE.allow(value32, msg.sender);

    // Store 64-bit value
    euint64 value64 = FHE.fromExternal(encryptedValue64, inputProof64);
    userEncryptedValue64[msg.sender] = value64;
    FHE.allowThis(value64);
    FHE.allow(value64, msg.sender);

    emit MultipleValuesStored(msg.sender);
  }

  /// @notice Retrieve the encrypted 32-bit value for the caller
  /// @return The encrypted value (requires off-chain decryption)
  function getEncryptedValue32() external view returns (euint32) {
    return userEncryptedValue32[msg.sender];
  }

  /// @notice Retrieve the encrypted 64-bit value for the caller
  /// @return The encrypted value (requires off-chain decryption)
  function getEncryptedValue64() external view returns (euint64) {
    return userEncryptedValue64[msg.sender];
  }

  /// @notice Check if user has stored a 32-bit value
  /// @param user The user address to check
  /// @return True if user has stored a value
  function hasValue32(address user) external view returns (bool) {
    // Note: This is a simplified check; in production, you'd need additional tracking
    return FHE.isInitialized(userEncryptedValue32[user]);
  }

  /// @notice Update existing encrypted value with FHE addition
  /// @param encryptedAmount The encrypted amount to add
  /// @param inputProof Zero-knowledge proof
  /// @dev Demonstrates FHE arithmetic operations on stored values
  function addToValue32(externalEuint32 encryptedAmount, bytes calldata inputProof) external {
    require(FHE.isInitialized(userEncryptedValue32[msg.sender]), "No value stored");

    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);
    userEncryptedValue32[msg.sender] = FHE.add(userEncryptedValue32[msg.sender], amount);

    FHE.allowThis(userEncryptedValue32[msg.sender]);
    FHE.allow(userEncryptedValue32[msg.sender], msg.sender);
  }
}
