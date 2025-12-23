// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Simple FHE Counter
/// @author FHEVM Examples
/// @notice Demonstrates basic encrypted state management with increment/decrement operations
/// @dev Shows how to use encrypted integers (euint32) for private on-chain storage
contract FHECounter is ZamaEthereumConfig {
  euint32 private encryptedCounter;

  event Incremented(address indexed user);
  event Decremented(address indexed user);

  constructor(externalEuint32 initialValue, bytes calldata inputProof) {
    euint32 decrypted = FHE.fromExternal(initialValue, inputProof);
    encryptedCounter = decrypted;

    FHE.allowThis(encryptedCounter);
    FHE.allow(encryptedCounter, msg.sender);
  }

  /// @notice Increment the counter by a specified encrypted value
  /// @param encryptedAmount The encrypted amount to add
  /// @param inputProof Zero-knowledge proof of correct encryption
  /// @dev Demonstrates FHE addition and permission model
  function increment(externalEuint32 encryptedAmount, bytes calldata inputProof) external {
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);
    encryptedCounter = FHE.add(encryptedCounter, amount);

    // Grant both contract and user permissions to access the result
    FHE.allowThis(encryptedCounter);
    FHE.allow(encryptedCounter, msg.sender);

    emit Incremented(msg.sender);
  }

  /// @notice Decrement the counter by a specified encrypted value
  /// @param encryptedAmount The encrypted amount to subtract
  /// @param inputProof Zero-knowledge proof of correct encryption
  /// @dev Demonstrates FHE subtraction and permission model
  function decrement(externalEuint32 encryptedAmount, bytes calldata inputProof) external {
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);
    encryptedCounter = FHE.sub(encryptedCounter, amount);

    // Grant both contract and user permissions
    FHE.allowThis(encryptedCounter);
    FHE.allow(encryptedCounter, msg.sender);

    emit Decremented(msg.sender);
  }

  /// @notice Get encrypted counter value
  /// @return The encrypted counter (can only be decrypted by authorized parties)
  /// @dev Note: View functions cannot return encrypted values; use off-chain decryption
  function getEncryptedCounter() external view returns (euint32) {
    return encryptedCounter;
  }
}
