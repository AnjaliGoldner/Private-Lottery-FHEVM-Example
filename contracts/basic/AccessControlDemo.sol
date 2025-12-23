// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Access Control Demonstration
/// @author FHEVM Examples
/// @notice Demonstrates FHE access control patterns: allowThis, allow, allowTransient
/// @dev Shows how to properly grant permissions for encrypted data access
contract AccessControlDemo is ZamaEthereumConfig {
  // Private encrypted balances
  mapping(address => euint32) private encryptedBalances;

  // Shared encrypted value that multiple users can access
  euint32 private sharedEncryptedValue;
  mapping(address => bool) private authorizedUsers;

  event BalanceSet(address indexed user);
  event SharedValueSet(uint256 timestamp);
  event UserAuthorized(address indexed user);
  event UserRevoked(address indexed user);

  address public immutable owner;

  modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  /// @notice Set encrypted balance with proper permission grants
  /// @param encryptedBalance The encrypted balance to set
  /// @param inputProof Zero-knowledge proof
  /// @dev Demonstrates FHE.allowThis() and FHE.allow() pattern
  function setBalance(externalEuint32 encryptedBalance, bytes calldata inputProof) external {
    euint32 balance = FHE.fromExternal(encryptedBalance, inputProof);

    // CRITICAL: Must grant BOTH permissions
    // 1. allowThis: Allows contract to perform operations on the value
    FHE.allowThis(balance);

    // 2. allow: Allows specific address (user) to decrypt the value
    FHE.allow(balance, msg.sender);

    encryptedBalances[msg.sender] = balance;
    emit BalanceSet(msg.sender);
  }

  /// @notice Set shared encrypted value accessible by authorized users
  /// @param encryptedValue The encrypted value to share
  /// @param inputProof Zero-knowledge proof
  /// @dev Demonstrates granting permissions to multiple parties
  function setSharedValue(externalEuint32 encryptedValue, bytes calldata inputProof) external onlyOwner {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // Grant permission to contract
    FHE.allowThis(value);

    // Grant permission to owner
    FHE.allow(value, owner);

    sharedEncryptedValue = value;
    emit SharedValueSet(block.timestamp);
  }

  /// @notice Authorize a user to access the shared value
  /// @param user The user address to authorize
  /// @dev Shows how to grant access after value creation
  function authorizeUser(address user) external onlyOwner {
    require(!authorizedUsers[user], "Already authorized");

    // Grant permission to the new user
    FHE.allow(sharedEncryptedValue, user);
    authorizedUsers[user] = true;

    emit UserAuthorized(user);
  }

  /// @notice Revoke user's authorization (logical revocation)
  /// @param user The user address to revoke
  /// @dev Note: FHE permissions cannot be revoked, this is logical only
  function revokeUser(address user) external onlyOwner {
    require(authorizedUsers[user], "Not authorized");
    authorizedUsers[user] = false;
    emit UserRevoked(user);
  }

  /// @notice Transfer encrypted amount between users with proper permissions
  /// @param to Recipient address
  /// @param encryptedAmount Encrypted amount to transfer
  /// @param inputProof Zero-knowledge proof
  /// @dev Demonstrates permission management during transfers
  function transfer(address to, externalEuint32 encryptedAmount, bytes calldata inputProof) external {
    require(FHE.isInitialized(encryptedBalances[msg.sender]), "No balance");
    require(to != address(0), "Invalid recipient");

    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // Update sender balance
    encryptedBalances[msg.sender] = FHE.sub(encryptedBalances[msg.sender], amount);
    FHE.allowThis(encryptedBalances[msg.sender]);
    FHE.allow(encryptedBalances[msg.sender], msg.sender);

    // Update recipient balance
    if (!FHE.isInitialized(encryptedBalances[to])) {
      encryptedBalances[to] = amount;
    } else {
      encryptedBalances[to] = FHE.add(encryptedBalances[to], amount);
    }

    // Grant permissions for recipient's new balance
    FHE.allowThis(encryptedBalances[to]);
    FHE.allow(encryptedBalances[to], to);
  }

  /// @notice Get caller's encrypted balance
  /// @return The encrypted balance
  /// @dev Requires proper permissions granted during setBalance
  function getMyBalance() external view returns (euint32) {
    return encryptedBalances[msg.sender];
  }

  /// @notice Get shared encrypted value (for authorized users only)
  /// @return The shared encrypted value
  /// @dev Logical check for authorization (permissions already granted)
  function getSharedValue() external view returns (euint32) {
    require(authorizedUsers[msg.sender] || msg.sender == owner, "Not authorized");
    return sharedEncryptedValue;
  }

  /// @notice Check if a user is authorized to access shared value
  /// @param user The user address to check
  /// @return True if authorized
  function isAuthorized(address user) external view returns (bool) {
    return authorizedUsers[user];
  }

  /// @notice Demonstrate allowTransient for temporary permissions
  /// @param encryptedValue Encrypted value for computation
  /// @param inputProof Zero-knowledge proof
  /// @return Result of computation
  /// @dev Use allowTransient for intermediate values that don't need storage
  function computeWithTransient(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external view returns (euint32) {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // For view functions or temporary computations, use allowTransient
    FHE.allowTransient(value, msg.sender);

    // Perform computation
    euint32 result = FHE.mul(value, FHE.asEuint32(2));
    FHE.allowTransient(result, msg.sender);

    return result;
  }
}
