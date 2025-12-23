# Private Lottery FHEVM Example Documentation

## Overview

Complete documentation for FHEVM example projects.

## Examples

### Basic

- [FHE Counter](./fhe-counter.md)
- [Encrypted Storage](./encrypted-storage.md)
- [Access Control Demonstration](./access-control.md)

### Applications

- [Private Lottery](./private-lottery.md)

## Quick Reference

- [Core Concepts](#core-concepts)
- [Common Patterns](#common-patterns)
- [Testing Guide](#testing-guide)
- [Resources](#resources)

## Core Concepts

### FHEVM Basics
- Encrypted data types (euint32, euint64, etc.)
- Permission model (allowThis, allow)
- Input proofs and validation
- Decryption patterns

## Common Patterns

### Encrypted Input Validation
```solidity
euint32 value = FHE.fromExternal(encryptedInput, inputProof);
```

### Permission Management
```solidity
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, userAddress);
```

## Testing Guide

All examples include comprehensive test suites (65+ tests) covering:
- Functionality verification
- Security validation
- Edge case handling
- Integration scenarios

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol Examples](https://docs.zama.org/protocol/examples)
- [Hardhat Documentation](https://hardhat.org)
- [Solidity Documentation](https://docs.soliditylang.org)
