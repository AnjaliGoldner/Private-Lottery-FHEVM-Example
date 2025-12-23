// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Comparison Operations Example
/// @author FHEVM Examples
/// @notice Demonstrates FHE comparison operations: eq, ne, lt, lte, gt, gte
/// @dev Shows how to compare encrypted values while preserving privacy
contract ComparisonOperations is ZamaEthereumConfig {
  euint32 private storedValue;
  address public owner;

  event ComparisonPerformed(address indexed user, string operationType);
  event ValueUpdated(address indexed user);

  modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
  }

  constructor(externalEuint32 initialValue, bytes calldata inputProof) {
    owner = msg.sender;
    euint32 value = FHE.fromExternal(initialValue, inputProof);
    storedValue = value;

    FHE.allowThis(storedValue);
    FHE.allow(storedValue, msg.sender);
  }

  /// @notice Check if two encrypted values are equal
  /// @param encValue The encrypted value to compare
  /// @param inputProof Zero-knowledge proof
  /// @return Encrypted boolean result (true if equal)
  /// @dev Demonstrates FHE.eq() - equality comparison
  function isEqual(externalEuint32 encValue, bytes calldata inputProof) external returns (ebool) {
    euint32 value = FHE.fromExternal(encValue, inputProof);

    // FHE.eq returns encrypted boolean (ebool)
    ebool result = FHE.eq(storedValue, value);

    // Grant permissions for the result
    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "equality");
    return result;
  }

  /// @notice Check if two encrypted values are not equal
  /// @param encValue The encrypted value to compare
  /// @param inputProof Zero-knowledge proof
  /// @return Encrypted boolean result (true if not equal)
  /// @dev Demonstrates FHE.ne() - inequality comparison
  function isNotEqual(externalEuint32 encValue, bytes calldata inputProof) external returns (ebool) {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    ebool result = FHE.ne(storedValue, value);

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "inequality");
    return result;
  }

  /// @notice Check if stored value is less than provided value
  /// @param encValue The encrypted value to compare
  /// @param inputProof Zero-knowledge proof
  /// @return Encrypted boolean result
  /// @dev Demonstrates FHE.lt() - less than comparison
  function isLessThan(externalEuint32 encValue, bytes calldata inputProof) external returns (ebool) {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    ebool result = FHE.lt(storedValue, value);

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "lessThan");
    return result;
  }

  /// @notice Check if stored value is less than or equal to provided value
  /// @param encValue The encrypted value to compare
  /// @param inputProof Zero-knowledge proof
  /// @return Encrypted boolean result
  /// @dev Demonstrates FHE.lte() - less than or equal comparison
  function isLessThanOrEqual(externalEuint32 encValue, bytes calldata inputProof) external returns (ebool) {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    ebool result = FHE.lte(storedValue, value);

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "lessThanOrEqual");
    return result;
  }

  /// @notice Check if stored value is greater than provided value
  /// @param encValue The encrypted value to compare
  /// @param inputProof Zero-knowledge proof
  /// @return Encrypted boolean result
  /// @dev Demonstrates FHE.gt() - greater than comparison
  function isGreaterThan(externalEuint32 encValue, bytes calldata inputProof) external returns (ebool) {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    ebool result = FHE.gt(storedValue, value);

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "greaterThan");
    return result;
  }

  /// @notice Check if stored value is greater than or equal to provided value
  /// @param encValue The encrypted value to compare
  /// @param inputProof Zero-knowledge proof
  /// @return Encrypted boolean result
  /// @dev Demonstrates FHE.gte() - greater than or equal comparison
  function isGreaterThanOrEqual(externalEuint32 encValue, bytes calldata inputProof) external returns (ebool) {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    ebool result = FHE.gte(storedValue, value);

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "greaterThanOrEqual");
    return result;
  }

  /// @notice Conditionally update value based on comparison
  /// @param newValue New encrypted value
  /// @param proofNew Proof for new value
  /// @param threshold Encrypted threshold
  /// @param proofThreshold Proof for threshold
  /// @dev Demonstrates FHE.select() - conditional selection based on encrypted condition
  function updateIfGreater(
    externalEuint32 newValue,
    bytes calldata proofNew,
    externalEuint32 threshold,
    bytes calldata proofThreshold
  ) external onlyOwner {
    euint32 newVal = FHE.fromExternal(newValue, proofNew);
    euint32 thresh = FHE.fromExternal(threshold, proofThreshold);

    // Check if new value is greater than threshold
    ebool condition = FHE.gt(newVal, thresh);

    // FHE.select: if condition is true, use newVal, else keep storedValue
    storedValue = FHE.select(condition, newVal, storedValue);

    FHE.allowThis(storedValue);
    FHE.allow(storedValue, owner);

    emit ValueUpdated(msg.sender);
  }

  /// @notice Get the maximum of two encrypted values
  /// @param encValue The encrypted value to compare
  /// @param inputProof Zero-knowledge proof
  /// @return The maximum value (encrypted)
  /// @dev Demonstrates FHE.max() - maximum of two encrypted values
  function getMaximum(externalEuint32 encValue, bytes calldata inputProof) external returns (euint32) {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    euint32 result = FHE.max(storedValue, value);

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    return result;
  }

  /// @notice Get the minimum of two encrypted values
  /// @param encValue The encrypted value to compare
  /// @param inputProof Zero-knowledge proof
  /// @return The minimum value (encrypted)
  /// @dev Demonstrates FHE.min() - minimum of two encrypted values
  function getMinimum(externalEuint32 encValue, bytes calldata inputProof) external returns (euint32) {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    euint32 result = FHE.min(storedValue, value);

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    return result;
  }

  /// @notice Update stored value
  /// @param newValue New encrypted value
  /// @param inputProof Zero-knowledge proof
  function updateValue(externalEuint32 newValue, bytes calldata inputProof) external onlyOwner {
    euint32 value = FHE.fromExternal(newValue, inputProof);
    storedValue = value;

    FHE.allowThis(storedValue);
    FHE.allow(storedValue, owner);

    emit ValueUpdated(msg.sender);
  }

  /// @notice Get stored encrypted value
  /// @return The encrypted value
  function getStoredValue() external view onlyOwner returns (euint32) {
    return storedValue;
  }
}
