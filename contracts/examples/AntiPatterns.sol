// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Anti-Patterns and Common Mistakes
/// @author FHEVM Examples
/// @notice Demonstrates common FHEVM anti-patterns and how to avoid them
/// @dev This contract shows CORRECT patterns - see comments for anti-patterns
contract AntiPatterns is ZamaEthereumConfig {
  euint32 private encryptedValue;
  mapping(address => euint32) private userBalances;

  event ValueStored(address indexed user);

  /// ============================================
  /// ANTI-PATTERN #1: Missing Input Proof
  /// ============================================

  /// ❌ WRONG: No input proof validation
  /// function storeValueWrong(externalEuint32 encValue) external {
  ///     euint32 value = FHE.fromExternal(encValue); // MISSING PROOF!
  ///     encryptedValue = value;
  /// }

  /// ✅ CORRECT: Always validate with input proof
  /// @notice Store value with proper input proof validation
  /// @param encValue The encrypted value
  /// @param inputProof Zero-knowledge proof of correct encryption
  /// @dev Input proofs prevent replay attacks and ensure encryption binding
  function storeValueCorrect(externalEuint32 encValue, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    encryptedValue = value;

    FHE.allowThis(value);
    FHE.allow(value, msg.sender);

    emit ValueStored(msg.sender);
  }

  /// ============================================
  /// ANTI-PATTERN #2: Missing allowThis Permission
  /// ============================================

  /// ❌ WRONG: Only user permission, no contract permission
  /// function storeBalanceWrong(externalEuint32 encBalance, bytes calldata inputProof) external {
  ///     euint32 balance = FHE.fromExternal(encBalance, inputProof);
  ///     userBalances[msg.sender] = balance;
  ///     FHE.allow(balance, msg.sender); // MISSING allowThis!
  /// }

  /// ✅ CORRECT: Grant both contract and user permissions
  /// @notice Store balance with proper permission grants
  /// @param encBalance The encrypted balance
  /// @param inputProof Zero-knowledge proof
  /// @dev Both allowThis and allow are REQUIRED
  function storeBalanceCorrect(externalEuint32 encBalance, bytes calldata inputProof) external {
    euint32 balance = FHE.fromExternal(encBalance, inputProof);
    userBalances[msg.sender] = balance;

    // CRITICAL: Grant BOTH permissions
    FHE.allowThis(balance); // Contract can perform operations
    FHE.allow(balance, msg.sender); // User can decrypt

    emit ValueStored(msg.sender);
  }

  /// ============================================
  /// ANTI-PATTERN #3: View Function Returning Encrypted Value
  /// ============================================

  /// ❌ WRONG: Cannot return encrypted value from view function
  /// function getEncryptedValueWrong() external view returns (euint32) {
  ///     return encryptedValue; // This will not work as expected in view
  /// }

  /// ✅ CORRECT: Return encrypted handle, user decrypts off-chain
  /// @notice Get encrypted value (requires off-chain decryption)
  /// @return The encrypted value
  /// @dev User must decrypt off-chain using their private key
  function getEncryptedValueCorrect() external view returns (euint32) {
    // This returns the encrypted handle
    // User decrypts off-chain
    return encryptedValue;
  }

  /// ============================================
  /// ANTI-PATTERN #4: Missing Permission After Operations
  /// ============================================

  /// ❌ WRONG: Forgetting to re-grant permissions after operations
  /// function addToBalanceWrong(externalEuint32 encAmount, bytes calldata inputProof) external {
  ///     euint32 amount = FHE.fromExternal(encAmount, inputProof);
  ///     userBalances[msg.sender] = FHE.add(userBalances[msg.sender], amount);
  ///     // MISSING: Permission grants for the NEW result!
  /// }

  /// ✅ CORRECT: Always re-grant permissions after operations
  /// @notice Add to balance with proper permission management
  /// @param encAmount Encrypted amount to add
  /// @param inputProof Zero-knowledge proof
  /// @dev Must re-grant permissions after FHE operations
  function addToBalanceCorrect(externalEuint32 encAmount, bytes calldata inputProof) external {
    require(FHE.isInitialized(userBalances[msg.sender]), "No balance");

    euint32 amount = FHE.fromExternal(encAmount, inputProof);
    userBalances[msg.sender] = FHE.add(userBalances[msg.sender], amount);

    // Re-grant permissions for the NEW result
    FHE.allowThis(userBalances[msg.sender]);
    FHE.allow(userBalances[msg.sender], msg.sender);
  }

  /// ============================================
  /// ANTI-PATTERN #5: Signer Mismatch
  /// ============================================

  /// ❌ WRONG: Encryption signer doesn't match transaction signer
  /// // Off-chain: const enc = await fhevm.createEncryptedInput(contract, alice.address).add32(42).encrypt()
  /// // On-chain: await contract.connect(bob).storeValue(enc.handles[0], enc.inputProof)
  /// // This will FAIL because signer mismatch!

  /// ✅ CORRECT: Encryption signer MUST match transaction signer
  /// @notice Store value (caller must match encryption signer)
  /// @param encValue Encrypted value
  /// @param inputProof Zero-knowledge proof
  /// @dev Encryption must be created for msg.sender's address
  function storeValueWithSignerCheck(externalEuint32 encValue, bytes calldata inputProof) external {
    // The inputProof validates that encryption was created for msg.sender
    euint32 value = FHE.fromExternal(encValue, inputProof);

    userBalances[msg.sender] = value;
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
  }

  /// ============================================
  /// ANTI-PATTERN #6: Not Checking Initialization
  /// ============================================

  /// ❌ WRONG: Operating on uninitialized encrypted value
  /// function transferWrong(address to, externalEuint32 encAmount, bytes calldata inputProof) external {
  ///     euint32 amount = FHE.fromExternal(encAmount, inputProof);
  ///     userBalances[msg.sender] = FHE.sub(userBalances[msg.sender], amount); // May be uninitialized!
  ///     userBalances[to] = FHE.add(userBalances[to], amount); // May be uninitialized!
  /// }

  /// ✅ CORRECT: Check initialization before operations
  /// @notice Transfer with proper initialization checks
  /// @param to Recipient address
  /// @param encAmount Encrypted amount to transfer
  /// @param inputProof Zero-knowledge proof
  function transferCorrect(address to, externalEuint32 encAmount, bytes calldata inputProof) external {
    require(to != address(0), "Invalid recipient");
    require(FHE.isInitialized(userBalances[msg.sender]), "Sender has no balance");

    euint32 amount = FHE.fromExternal(encAmount, inputProof);

    // Update sender balance
    userBalances[msg.sender] = FHE.sub(userBalances[msg.sender], amount);
    FHE.allowThis(userBalances[msg.sender]);
    FHE.allow(userBalances[msg.sender], msg.sender);

    // Check if recipient has balance
    if (!FHE.isInitialized(userBalances[to])) {
      userBalances[to] = amount;
    } else {
      userBalances[to] = FHE.add(userBalances[to], amount);
    }

    FHE.allowThis(userBalances[to]);
    FHE.allow(userBalances[to], to);
  }

  /// ============================================
  /// ANTI-PATTERN #7: Exposing Encrypted Values in Events
  /// ============================================

  /// ❌ WRONG: Emitting encrypted values directly
  /// event BalanceUpdatedWrong(address indexed user, euint32 newBalance); // Don't emit encrypted values!

  /// ✅ CORRECT: Only emit non-sensitive metadata
  event BalanceUpdatedCorrect(address indexed user, uint256 timestamp);

  /// @notice Update balance with correct event emission
  /// @param encBalance New encrypted balance
  /// @param inputProof Zero-knowledge proof
  function updateBalanceWithEvent(externalEuint32 encBalance, bytes calldata inputProof) external {
    euint32 balance = FHE.fromExternal(encBalance, inputProof);
    userBalances[msg.sender] = balance;

    FHE.allowThis(balance);
    FHE.allow(balance, msg.sender);

    // Emit only non-sensitive data
    emit BalanceUpdatedCorrect(msg.sender, block.timestamp);
  }

  /// ============================================
  /// ANTI-PATTERN #8: Using Regular Arithmetic on Encrypted Values
  /// ============================================

  /// ❌ WRONG: Using + - * / operators directly
  /// function addWrong(externalEuint32 encValue, bytes calldata inputProof) external {
  ///     euint32 value = FHE.fromExternal(encValue, inputProof);
  ///     encryptedValue = encryptedValue + value; // WRONG! Use FHE.add()
  /// }

  /// ✅ CORRECT: Use FHE library functions
  /// @notice Add to value using FHE operations
  /// @param encValue Encrypted value to add
  /// @param inputProof Zero-knowledge proof
  function addCorrect(externalEuint32 encValue, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(encValue, inputProof);

    // Use FHE library functions
    encryptedValue = FHE.add(encryptedValue, value);

    FHE.allowThis(encryptedValue);
    FHE.allow(encryptedValue, msg.sender);
  }

  /// @notice Get user balance
  /// @return Encrypted balance
  function getBalance() external view returns (euint32) {
    return userBalances[msg.sender];
  }

  /// @notice Check if user has balance
  /// @return True if balance exists
  function hasBalance() external view returns (bool) {
    return FHE.isInitialized(userBalances[msg.sender]);
  }
}
