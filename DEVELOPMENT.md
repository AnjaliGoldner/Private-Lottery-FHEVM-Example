# Development Guide

## Architecture Overview

The Private Lottery contract demonstrates a practical application of FHEVM (Fully Homomorphic Encryption Virtual Machine) for privacy-preserving smart contracts.

### Core Components

1. **PrivateLottery.sol**: Main contract implementing lottery logic with encrypted state
2. **Test Suite**: Comprehensive tests demonstrating correct usage patterns
3. **Deployment Scripts**: Hardhat deployment configuration
4. **Build System**: TypeScript/Hardhat compilation and type generation

## FHE Patterns Demonstrated

### 1. Encrypted Data Storage

The contract stores encrypted lottery entries as `euint32` values:

```solidity
struct LotteryEntry {
    address participant;
    euint32 encryptedNumber;  // Encrypted value stored on-chain
    uint256 timestamp;
}
```

**Key Points:**
- Encrypted values are opaque - nobody can read them without proper permissions
- Operations on encrypted values are performed cryptographically on-chain
- Decryption requires explicit permission grants

### 2. Input Proof Validation

When accepting encrypted inputs from users:

```solidity
function enterLottery(externalEuint32 encryptedNumber, bytes calldata inputProof) external payable {
    // Convert external encrypted value to internal
    euint32 encryptedValue = FHE.fromExternal(encryptedNumber, inputProof);

    // Store the encrypted value
    entries.push(LotteryEntry({
        participant: msg.sender,
        encryptedNumber: encryptedValue,
        timestamp: block.timestamp
    }));
}
```

**Why Input Proofs Matter:**
- Zero-knowledge proofs that the encryption is binding to [contract, user] pair
- Prevents relay attacks where someone could use encrypted values from another transaction
- Ensures the encrypted value was created specifically for this contract and user

### 3. Permission Model

FHEVM requires dual permissions to operate on encrypted values:

```solidity
// Grant contract permission
FHE.allowThis(encryptedValue);

// Grant user permission
FHE.allow(encryptedValue, msg.sender);
```

**Why Both are Needed:**
- `FHE.allowThis()`: Allows the contract to read the encrypted value
- `FHE.allow()`: Allows the specific user to read the encrypted value
- Both must be granted for most operations to succeed

### 4. Randomness in Drawing

The contract uses blockchain data for pseudo-randomness:

```solidity
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
```

**Considerations:**
- Uses multiple entropy sources for better randomness
- Deterministic but unpredictable to participants
- In production, consider using oracles for stronger randomness guarantees

## Common FHEVM Patterns

### ✅ Correct: Full Permission Grant

```solidity
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, msg.sender);
// Now operations can proceed
```

### ❌ Incorrect: Missing allowThis

```solidity
FHE.allow(encryptedValue, msg.sender);
// Will fail - contract doesn't have permission
```

### ✅ Correct: Matching Encryption Signer

```typescript
// Encrypt with user's address
const enc = await fhevm
  .createEncryptedInput(contractAddr, userAddress)
  .add32(value)
  .encrypt();

// Submit transaction with same signer
await contract.connect(userSigner).enterLottery(enc.handles[0], enc.inputProof);
```

### ❌ Incorrect: Mismatched Signer

```typescript
// Encrypt with alice's address
const enc = await fhevm
  .createEncryptedInput(contractAddr, alice.address)
  .add32(value)
  .encrypt();

// Submit with bob - will fail!
await contract.connect(bob).enterLottery(enc.handles[0], enc.inputProof);
```

## State Management

### Entry Storage Pattern

Entries are stored as structs containing encrypted data:

```solidity
LotteryEntry[] public entries;

entries.push(LotteryEntry({
    participant: msg.sender,
    encryptedNumber: encryptedValue,
    timestamp: block.timestamp
}));
```

**Design Rationale:**
- Array allows iteration for drawing
- Struct keeps related data together
- Public allows external view access (without reading encrypted data)

### Multi-Round Lottery

Each round:
1. Participants add entries (encrypted numbers)
2. Entries accumulate until draw is triggered
3. Winner is randomly selected
4. Prizes are distributed
5. Entries are cleared for next round

```solidity
function resetLottery() internal {
    delete entries;  // Clear all entries
    prizePool = 0;   // Reset prize pool
    roundNumber++;   // Increment round
}
```

## Testing Strategy

### Test Categories

1. **Unit Tests**: Individual function behavior
2. **Integration Tests**: Multi-function interactions
3. **Edge Cases**: Boundary conditions and error states
4. **Permission Tests**: FHE permission enforcement

### Key Test Patterns

```typescript
// Setup encrypted input
const encryptedInput = await fhevm
  .createEncryptedInput(contractAddress, signers.alice.address)
  .add32(chosenNumber)
  .encrypt();

// Execute contract function
const tx = await contract
  .connect(signers.alice)
  .enterLottery(encryptedInput.handles[0], encryptedInput.inputProof, {
    value: entryFee
  });
await tx.wait();

// Verify state changes
expect(await contract.getEntryCount()).to.equal(1n);
```

## Gas Considerations

### Encrypted Operations Cost More

Encrypted operations are more expensive than plain operations because:
- FHE computations are cryptographically intensive
- Multiple permission checks are performed
- Encrypted data requires special handling

### Optimization Tips

1. **Batch Operations**: Group multiple updates when possible
2. **Minimize Encrypted Operations**: Use plain data for non-critical state
3. **Efficient Data Types**: Choose appropriate encrypted types (euint32 vs euint64)

## Type Generation

The project uses TypeChain for type-safe contract interaction:

```typescript
import { PrivateLottery, PrivateLottery__factory } from "../types";

// Type-safe deployment
const factory = (await ethers.getContractFactory("PrivateLottery")) as PrivateLottery__factory;
const contract = (await factory.deploy()) as PrivateLottery;
```

## Build and Compile

### Compilation Process

```bash
npm run compile
```

This:
1. Compiles Solidity contracts with FHEVM extensions
2. Generates TypeChain types
3. Creates artifacts in `artifacts/` directory

### Type Generation

```bash
npm run typechain
```

Generates TypeScript types from contract ABIs in `types/` directory.

## Deployment

### Local Testing

```bash
npm run test  # Uses mock FHEVM
```

### Sepolia Testnet

```bash
# Setup environment
export MNEMONIC="your twelve word mnemonic"
export INFURA_API_KEY="your key"

# Deploy
npm run deploy:sepolia

# Test on Sepolia
npm run test:sepolia

# Verify contract
npm run verify:sepolia
```

## Debugging

### Enabling Debug Output

```bash
# Run tests with debug output
DEBUG=hardhat:* npm run test
```

### Mock FHEVMHelpers

The hardhat-plugin provides mock FHE helpers for testing:

```typescript
// Check if running on mock
if (fhevm.isMock) {
  // Running on local mock
}

// Create encrypted input
const encrypted = await fhevm
  .createEncryptedInput(contractAddr, userAddr)
  .add32(value)
  .encrypt();

// User decrypt (on mock)
const decrypted = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  encryptedValue,
  contractAddr,
  userSigner
);
```

## Resources

### FHEVM Documentation
- [Official Docs](https://docs.zama.ai/fhevm)
- [Solidity API](https://github.com/zama-ai/fhevm-solidity)
- [Hardhat Plugin](https://github.com/zama-ai/fhevm-hardhat-plugin)

### Hardhat Documentation
- [Hardhat Guide](https://hardhat.org)
- [Testing](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-waffle)
- [Deployment](https://hardhat.org/hardhat-deploy/)

### Web3/Ethereum
- [Ethers.js](https://docs.ethers.org)
- [Solidity Docs](https://docs.soliditylang.org)
- [Ethereum Yellow Paper](https://ethereum.org/en/developers/docs/)

---

For questions or issues with development, please check:
1. Existing test cases for examples
2. FHEVM documentation
3. GitHub issues and discussions
