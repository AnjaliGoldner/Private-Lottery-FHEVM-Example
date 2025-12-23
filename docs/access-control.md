# Access Control Demonstration

Comprehensive guide to FHE access control patterns and permission management

## Contents

1. [Overview](#overview)
2. [Permission Patterns](#permission-patterns)

---

## Overview

Demonstrates all FHE permission patterns: allowThis, allow, and allowTransient.

## Key Concepts

- **allowThis**: Contract permission for operations
- **allow**: User permission for decryption
- **allowTransient**: Temporary permissions for view functions
- **Shared Values**: Multiple parties accessing same encrypted data

## Permission Patterns

### Basic Pattern
```solidity
FHE.allowThis(encryptedValue);  // Contract can operate
FHE.allow(encryptedValue, user); // User can decrypt
```

### Shared Access
```solidity
FHE.allow(sharedValue, user1);
FHE.allow(sharedValue, user2);
```

### Transient (View Functions)
```solidity
FHE.allowTransient(tempValue, user);
```

