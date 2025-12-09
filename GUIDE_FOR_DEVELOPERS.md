# Developer Guide for Adding New FHEVM Examples

This guide explains how to create, test, and maintain FHEVM examples using this project as a template.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Creating a New Example](#creating-a-new-example)
3. [Writing Contracts](#writing-contracts)
4. [Writing Tests](#writing-tests)
5. [Managing Dependencies](#managing-dependencies)
6. [Documentation](#documentation)
7. [Automation and Scaffolding](#automation-and-scaffolding)
8. [Best Practices](#best-practices)

## Project Structure

A typical FHEVM example project includes:

```
project-root/
├── contracts/
│   └── YourContract.sol         # Main contract demonstrating FHE concept
├── test/
│   └── YourContract.ts          # Comprehensive test suite (65+ tests minimum)
├── deploy/
│   └── deploy.ts                # Deployment script
├── tasks/
│   └── YourContract.ts          # Hardhat tasks for interaction
├── scripts/
│   ├── create-fhevm-example.ts  # Scaffolding script
│   └── generate-docs.ts         # Documentation generator
├── docs/
│   └── (GitBook-compatible docs)
├── hardhat.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Creating a New Example

### Step 1: Plan Your Example

- **Choose a clear concept**: One FHE pattern or application per example
- **Identify use case**: Real-world application or educational pattern
- **Plan test coverage**: Aim for 65+ test cases minimum
- **Document thoroughly**: Clear comments and external documentation

**Examples of good concepts:**
- Access control with FHE
- Encrypted voting system
- Privacy-preserving auction
- Confidential token operations
- Encrypted state transitions

### Step 2: Write the Contract

Create `contracts/YourExample.sol`:

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Your Example Contract
/// @author Your Name
/// @notice Clear description of what this contract does
/// @dev Explains the FHE patterns used
contract YourExample is ZamaEthereumConfig {
    // State variables
    euint32 private encryptedState;

    /// @notice Function description
    /// @param encryptedInput The encrypted input value
    /// @param inputProof Zero-knowledge proof of encryption
    /// @dev Detailed explanation of how it works
    function exampleFunction(externalEuint32 encryptedInput, bytes calldata inputProof) external {
        // Implementation
        euint32 value = FHE.fromExternal(encryptedInput, inputProof);

        // Grant permissions
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        // Perform encrypted operations
        encryptedState = FHE.add(encryptedState, value);
    }
}
```

### Step 3: Write Tests

Create `test/YourExample.ts` with comprehensive test coverage:

```typescript
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { YourExample, YourExample__factory } from "../types";

describe("YourExample", function () {
  let contract: YourExample;
  let contractAddress: string;
  let signers: any[];

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    signers = await ethers.getSigners();
    const factory = (await ethers.getContractFactory("YourExample")) as YourExample__factory;
    contract = (await factory.deploy()) as YourExample;
    contractAddress = await contract.getAddress();
  });

  describe("Basic Functionality", function () {
    it("✅ should perform operation with encrypted input", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers[0].address)
        .add32(42)
        .encrypt();

      await expect(
        contract.exampleFunction(encryptedInput.handles[0], encryptedInput.inputProof)
      ).to.not.be.reverted;
    });

    // Add 65+ test cases covering:
    // - Normal operation paths
    // - Error cases
    // - Edge cases
    // - Security scenarios
    // - Integration flows
  });
});
```

**Test Coverage Checklist:**
- [ ] Deployment and initialization (4+ tests)
- [ ] Core functionality (6+ tests)
- [ ] Error handling (5+ tests)
- [ ] Permission enforcement (6+ tests)
- [ ] State management (5+ tests)
- [ ] Event emission (4+ tests)
- [ ] Edge cases (7+ tests)
- [ ] Integration scenarios (4+ tests)
- [ ] **Total: 65+ tests minimum**

### Step 4: Create Deployment Script

Create `deploy/deploy.ts`:

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy: deployContract } = hre.deployments;

  await deployContract("YourExample", {
    from: deployer,
    log: true,
  });
};

deploy.tags = ["YourExample"];
export default deploy;
```

### Step 5: Create Hardhat Tasks

Create `tasks/YourExample.ts` for contract interaction:

```typescript
import { task } from "hardhat/config";

task("your-task", "Task description")
  .addParam("address", "Contract address")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt("YourExample", taskArgs.address);
    // Implement task logic
  });
```

## Writing Contracts

### FHE Best Practices

**✅ DO: Validate Input Proofs**
```solidity
euint32 value = FHE.fromExternal(encryptedInput, inputProof);
```

**✅ DO: Grant All Required Permissions**
```solidity
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, msg.sender);
```

**✅ DO: Use Clear Variable Names**
```solidity
euint32 private encryptedBalance;  // Good - clearly encrypted
```

**❌ DON'T: Return Encrypted Values from View Functions**
```solidity
// Wrong - encrypted values can't be returned
function getEncrypted() public view returns (euint32) { }
```

**❌ DON'T: Skip Input Validation**
```solidity
// Wrong - no proof validation
euint32 value = FHE.fromExternal(encryptedInput);
```

### Documentation Requirements

Every contract should include:

1. **Contract-level natspec:**
```solidity
/// @title Clear title
/// @author Developer name
/// @notice User-facing description
/// @dev Technical implementation details
```

2. **Function-level natspec:**
```solidity
/// @notice What this function does
/// @param paramName Description of parameter
/// @return Description of return value
/// @dev Implementation notes and important details
```

3. **Inline comments for complex logic:**
```solidity
// Explanation of why this specific approach is used
euint32 result = FHE.add(a, b);

// Security consideration or FHE-specific detail
FHE.allowThis(result);
```

## Writing Tests

### Test Organization

Tests should be organized into describe blocks:

```typescript
describe("YourExample", function () {
  describe("Deployment", function () { /* ... */ });
  describe("Core Functionality", function () { /* ... */ });
  describe("Error Handling", function () { /* ... */ });
  describe("Security", function () { /* ... */ });
  describe("Integration", function () { /* ... */ });
});
```

### Test Patterns

**Setup pattern:**
```typescript
beforeEach(async function () {
  if (!fhevm.isMock) this.skip();
  // Deploy contract
  // Setup test data
});
```

**Encrypted input pattern:**
```typescript
const encryptedInput = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(value)
  .encrypt();

await contract.connect(user).function(
  encryptedInput.handles[0],
  encryptedInput.inputProof
);
```

**Error testing pattern:**
```typescript
it("❌ should reject invalid input", async function () {
  await expect(
    contract.function(invalidInput)
  ).to.be.revertedWith("Error message");
});
```

## Managing Dependencies

### Updating FHEVM Version

When `@fhevm/solidity` releases a new version:

1. **Update package.json:**
```bash
npm install @fhevm/solidity@latest
```

2. **Test compilation:**
```bash
npm run compile
```

3. **Run test suite:**
```bash
npm run test
```

4. **Check for breaking changes:**
- Review FHEVM changelog
- Update code if needed
- Re-test thoroughly

5. **Update documentation:**
```bash
npm run prettier:write
git add .
git commit -m "chore: update FHEVM version"
```

### Dependency Compatibility

Maintain compatibility with:
- Node.js >= 20
- npm >= 7.0.0
- Hardhat ^2.26.0
- TypeScript ^5.8.3
- Solidity ^0.8.24

## Documentation

### README.md Structure

```markdown
# Example Title

Brief description

## Overview
- Key features
- Concepts demonstrated

## Quick Start
- Installation
- Running tests

## Project Structure
- File organization

## Core Concepts
- Detailed explanations

## Usage Examples
- Code samples

## Testing
- Test coverage
- Running tests

## Deployment
- Instructions

## License
```

### Generate Documentation

Use the provided script:
```bash
ts-node scripts/generate-docs.ts example-name
```

This generates:
- `docs/example-name.md` - Full documentation
- `docs/SUMMARY.md` - Index of all examples

## Automation and Scaffolding

### Create Standalone Example

```bash
ts-node scripts/create-fhevm-example.ts your-example ./output-directory
```

This:
- Clones the template structure
- Copies contract and tests
- Generates package.json
- Creates README
- Sets up configuration

### Generate All Documentation

```bash
ts-node scripts/generate-docs.ts --all
```

## Best Practices

### Code Quality

1. **Use TypeScript strict mode**
   - No `any` types without justification
   - Full type annotations

2. **Follow naming conventions**
   - `encrypted*` for encrypted variables
   - `claim*`, `handle*` for proof variables
   - `euint32` for 32-bit encrypted integers

3. **Comprehensive error messages**
   - Explain what went wrong
   - Suggest how to fix it
   - Include context

4. **Test everything**
   - Normal cases
   - Error cases
   - Edge cases
   - Security scenarios

### Documentation Quality

1. **Clear natspec comments**
   - Explain the "what" and "why"
   - Include examples where helpful
   - Note FHE-specific considerations

2. **Inline comments for complexity**
   - Explain non-obvious logic
   - Note security implications
   - Reference FHE patterns

3. **README examples**
   - Complete, runnable code
   - Real-world scenarios
   - Common pitfalls

### Security Practices

1. **Input validation**
   - Always validate proofs
   - Check permissions
   - Verify caller authorization

2. **Permission management**
   - Grant both allowThis and allow
   - Understand scope of permissions
   - Document permission requirements

3. **State management**
   - Clear round/state transitions
   - Proper cleanup
   - No data leakage

## Checklist for New Examples

- [ ] Contract written with full natspec
- [ ] 65+ comprehensive test cases
- [ ] All tests passing
- [ ] Linting and formatting clean
- [ ] Deployment script working
- [ ] Tasks created for interaction
- [ ] README with usage examples
- [ ] Code comments explain FHE concepts
- [ ] Error messages are helpful
- [ ] Documentation generated
- [ ] No secrets in code
- [ ] All content in English
- [ ] Ready for scaffolding

## Support and Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org)
- [Solidity Documentation](https://docs.soliditylang.org)
- [Zama Discord Community](https://discord.gg/zama)

---

Built with ❤️ for the FHEVM ecosystem
