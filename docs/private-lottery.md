# Private Lottery

Privacy-preserving lottery system using FHEVM encryption

## Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Contract Functions](#contract-functions)
4. [Testing](#testing)
5. [Common Pitfalls](#common-pitfalls)

---

## Overview

A complete lottery system demonstrating privacy-preserving smart contracts with Fully Homomorphic Encryption (FHEVM).

## Key Concepts

- **Encrypted State Storage**: Participant entries stored as encrypted values
- **Access Control Patterns**: Using FHE.allowThis() and FHE.allow()
- **Input Proof Validation**: Zero-knowledge proof verification
- **Multi-Round Architecture**: Stateful transitions across lottery rounds

## Core Features

- Encrypted lottery entry submission
- Privacy-preserving winner selection
- Automatic prize distribution (80/20 split)
- Multi-round lottery mechanics
- Complete permission management
- Event-driven design

## Contract Functions

### Public Functions

```solidity
function enterLottery(externalEuint32 encryptedNumber, bytes calldata inputProof) external payable
```

Submit encrypted lottery entry with proof.

### Owner Functions

```solidity
function drawWinner() external returns (address)
function setLotteryActive(bool active) external
function setEntryFee(uint256 newFee) external
function emergencyWithdraw() external
```

### View Functions

```solidity
function getEntryCount() external view returns (uint256)
function getPrizePool() external view returns (uint256)
function getCurrentRound() external view returns (uint256)
function getLastWinner() external view returns (address)
```

## Testing

The project includes 65+ comprehensive test cases covering:

- Deployment and initialization
- Encrypted entry submission
- Winner drawing mechanics
- Owner function access control
- Event emission verification
- Edge cases and security scenarios
- Prize distribution accuracy
- Integration workflows

Run tests with:
```bash
npm run test
```

## Common Pitfalls

### ❌ Missing Input Proof
```solidity
// Wrong - no proof validation
FHE.fromExternal(encryptedValue);
```

### ✅ Correct Usage
```solidity
// Correct - validates encryption binding
euint32 value = FHE.fromExternal(encryptedValue, inputProof);
```

### ❌ Incomplete Permissions
```solidity
// Wrong - missing allowThis
FHE.allow(value, msg.sender);
```

### ✅ Full Permissions
```solidity
// Correct - grants all necessary permissions
FHE.allowThis(value);
FHE.allow(value, msg.sender);
```

