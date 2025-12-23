# FHEVM Hardhat Base Template

This is the base Hardhat template for creating FHEVM examples. It provides a complete development environment with all necessary configuration and dependencies pre-configured.

## What's Included

### Configuration Files
- **hardhat.config.ts** - Hardhat configuration with FHEVM plugin
- **tsconfig.json** - TypeScript compiler configuration
- **package.json** - Dependencies and scripts

### Code Quality Tools
- **ESLint** - JavaScript/TypeScript linting (.eslintrc.yml, .eslintignore)
- **Prettier** - Code formatting (.prettierrc.yml, .prettierignore)
- **Solhint** - Solidity linting (.solhint.json, .solhintignore)
- **Solidity Coverage** - Test coverage reporting (.solcover.js)

### Directory Structure
```
base-template/
├── contracts/          # Solidity contracts go here
├── test/              # Test files go here
├── deploy/            # Deployment scripts
├── tasks/             # Hardhat tasks
├── .github/workflows/ # CI/CD configuration
└── Configuration files
```

## Quick Start

### 1. Clone this template
```bash
cp -r base-template my-new-example
cd my-new-example
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add your contract
Create your contract in `contracts/YourContract.sol`:
```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract YourContract is ZamaEthereumConfig {
    // Your implementation
}
```

### 4. Add tests
Create tests in `test/YourContract.ts`:
```typescript
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("YourContract", function () {
    // Your tests
});
```

### 5. Compile and test
```bash
npm run compile
npm run test
```

## Available Scripts

### Development
- `npm run compile` - Compile contracts
- `npm run test` - Run tests with mock FHEVM
- `npm run clean` - Clean build artifacts
- `npm run typechain` - Generate TypeScript types

### Code Quality
- `npm run lint` - Run all linters
- `npm run lint:sol` - Lint Solidity files
- `npm run lint:ts` - Lint TypeScript files
- `npm run prettier:check` - Check code formatting
- `npm run prettier:write` - Auto-format code
- `npm run coverage` - Generate test coverage report

### Deployment
- `npm run deploy:localhost` - Deploy to local network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run verify:sepolia` - Verify contract on Etherscan

### Testing
- `npm run test` - Run tests on local mock FHEVM
- `npm run test:sepolia` - Run tests on Sepolia testnet

## Requirements

- Node.js >= 20
- npm >= 7.0.0

## Dependencies

### Core Dependencies
- `@fhevm/solidity` ^0.9.1 - FHEVM Solidity library
- `encrypted-types` ^0.0.4 - Encrypted type definitions

### Development Dependencies
- Hardhat and plugins
- TypeScript and type definitions
- Testing libraries (Chai, Mocha)
- Linting and formatting tools

## Using with Automation Scripts

This template is designed to work with the automation scripts:

### Create Example from Template
```bash
ts-node scripts/create-fhevm-example.ts example-name ./output-dir
```

### Generate Documentation
```bash
ts-node scripts/generate-docs.ts example-name
```

## Best Practices

1. **One concept per example** - Keep examples focused on a single FHE pattern
2. **Comprehensive tests** - Aim for 65+ test cases minimum
3. **Clear documentation** - Document all FHE patterns and decisions
4. **Follow naming conventions** - Use `encrypted*` prefix for encrypted variables
5. **Validate input proofs** - Always use `FHE.fromExternal(value, proof)`
6. **Grant permissions** - Use both `FHE.allowThis()` and `FHE.allow()`

## Support

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org)
- [Zama Discord Community](https://discord.com/invite/zama)
- [Zama Community Forum](https://www.zama.ai/community)

## License

BSD-3-Clause-Clear - See LICENSE file for details

---

**Built for the FHEVM ecosystem by Zama**
