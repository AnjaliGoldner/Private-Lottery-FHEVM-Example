#!/usr/bin/env npx ts-node

import { execSync } from "child_process";
import { mkdirSync, copyFileSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

interface ExampleConfig {
  name: string;
  displayName: string;
  description: string;
  contract: string;
  testFile: string;
  category: string;
}

const EXAMPLES_CONFIG: Record<string, ExampleConfig> = {
  "private-lottery": {
    name: "private-lottery",
    displayName: "Private Lottery",
    description: "Privacy-preserving lottery system using FHEVM encryption",
    contract: "PrivateLottery.sol",
    testFile: "PrivateLottery.ts",
    category: "applications",
  },
};

function createFHEVMExample(exampleName: string, outputDir: string) {
  const config = EXAMPLES_CONFIG[exampleName];

  if (!config) {
    console.error(`❌ Unknown example: ${exampleName}`);
    console.log("\nAvailable examples:");
    Object.keys(EXAMPLES_CONFIG).forEach((name) => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }

  console.log(`\n📦 Creating FHEVM Example: ${config.displayName}`);
  console.log("─────────────────────────────────────────");

  // Create output directory
  console.log(`📁 Creating directory: ${outputDir}`);
  mkdirSync(outputDir, { recursive: true });

  // Copy directory structure
  console.log(`📋 Setting up project structure...`);
  mkdirSync(join(outputDir, "contracts"), { recursive: true });
  mkdirSync(join(outputDir, "test"), { recursive: true });
  mkdirSync(join(outputDir, "deploy"), { recursive: true });
  mkdirSync(join(outputDir, ".github/workflows"), { recursive: true });

  // Copy configuration files
  console.log(`⚙️  Copying configuration files...`);
  copyConfigFiles(outputDir, config);

  // Copy contract
  console.log(`📄 Copying contract: ${config.contract}`);
  copyFileSync(
    join(__dirname, `../contracts/${config.contract}`),
    join(outputDir, `contracts/${config.contract}`),
  );

  // Copy test
  console.log(`🧪 Copying test file: ${config.testFile}`);
  copyFileSync(
    join(__dirname, `../test/${config.testFile}`),
    join(outputDir, `test/${config.testFile}`),
  );

  // Copy deployment script
  console.log(`🚀 Copying deployment script...`);
  copyFileSync(
    join(__dirname, "../deploy/deploy.ts"),
    join(outputDir, "deploy/deploy.ts"),
  );

  // Generate package.json
  console.log(`📦 Generating package.json...`);
  generatePackageJson(outputDir, config);

  // Generate README
  console.log(`📖 Generating README...`);
  generateReadme(outputDir, config);

  // Copy other essential files
  console.log(`📋 Copying configuration and setup files...`);
  const essentialFiles = [
    "hardhat.config.ts",
    "tsconfig.json",
    ".gitignore",
    ".eslintrc.yml",
    ".eslintignore",
    ".prettierrc.yml",
    ".prettierignore",
    ".solhint.json",
    ".solhintignore",
    ".solcover.js",
    "LICENSE",
  ];

  essentialFiles.forEach((file) => {
    const source = join(__dirname, `../${file}`);
    const dest = join(outputDir, file);
    try {
      copyFileSync(source, dest);
    } catch (e) {
      console.warn(`  ⚠️  Could not copy ${file}`);
    }
  });

  // Copy GitHub Actions workflow
  console.log(`📊 Copying CI/CD configuration...`);
  try {
    copyFileSync(
      join(__dirname, "../.github/workflows/main.yml"),
      join(outputDir, ".github/workflows/main.yml"),
    );
  } catch (e) {
    console.warn(`  ⚠️  Could not copy GitHub Actions workflow`);
  }

  console.log("\n✅ Example created successfully!");
  console.log("─────────────────────────────────────────");
  console.log(`\n📂 Location: ${outputDir}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. cd ${outputDir}`);
  console.log(`   2. npm install`);
  console.log(`   3. npm run compile`);
  console.log(`   4. npm run test`);
  console.log(`\n📚 For more information, see README.md in the generated project.\n`);
}

function copyConfigFiles(outputDir: string, config: ExampleConfig) {
  // These are handled separately in the main function
}

function generatePackageJson(outputDir: string, config: ExampleConfig) {
  const packageJson = {
    name: `fhevm-${config.name}`,
    description: config.description,
    version: "1.0.0",
    license: "BSD-3-Clause-Clear",
    engines: {
      node: ">=20",
      npm: ">=7.0.0",
    },
    scripts: {
      clean: 'rimraf ./fhevmTemp ./artifacts ./cache ./coverage ./types ./coverage.json ./dist && npm run typechain',
      compile: "cross-env TS_NODE_TRANSPILE_ONLY=true hardhat compile",
      coverage: 'cross-env SOLIDITY_COVERAGE=true hardhat coverage --solcoverjs ./.solcover.js --temp artifacts --testfiles "test/**/*.ts" && npm run typechain',
      lint: "npm run lint:sol && npm run lint:ts && npm run prettier:check",
      "lint:sol": 'solhint --max-warnings 0 "contracts/**/*.sol"',
      "lint:ts": 'eslint --ignore-path ./.eslintignore --ext .js,.ts .',
      postcompile: "npm run typechain",
      "prettier:check": 'prettier --check "**/*.{js,json,md,sol,ts,yml}"',
      "prettier:write": 'prettier --write "**/*.{js,json,md,sol,ts,yml}"',
      test: "hardhat test",
      "test:sepolia": "hardhat test --network sepolia",
      "build:ts": "tsc --project tsconfig.json",
      typechain: "cross-env TS_NODE_TRANSPILE_ONLY=true hardhat typechain",
      chain: "hardhat node --network hardhat --no-deploy",
      "deploy:localhost": "hardhat deploy --network localhost",
      "deploy:sepolia": "hardhat deploy --network sepolia",
      "verify:sepolia": "hardhat verify --network sepolia",
    },
    dependencies: {
      "encrypted-types": "^0.0.4",
      "@fhevm/solidity": "^0.9.1",
    },
    devDependencies: {
      "@fhevm/hardhat-plugin": "^0.3.0-1",
      "@nomicfoundation/hardhat-chai-matchers": "^2.1.0",
      "@nomicfoundation/hardhat-ethers": "^3.1.0",
      "@nomicfoundation/hardhat-network-helpers": "^1.1.0",
      "@nomicfoundation/hardhat-verify": "^2.1.0",
      "@typechain/ethers-v6": "^0.5.1",
      "@typechain/hardhat": "^9.1.0",
      "@types/chai": "^4.3.20",
      "@types/mocha": "^10.0.10",
      "@types/node": "^20.19.8",
      "@typescript-eslint/eslint-plugin": "^8.37.0",
      "@typescript-eslint/parser": "^8.37.0",
      "@zama-fhe/relayer-sdk": "^0.3.0-5",
      chai: "^4.5.0",
      "chai-as-promised": "^8.0.1",
      "cross-env": "^7.0.3",
      eslint: "^8.57.1",
      "eslint-config-prettier": "^9.1.0",
      ethers: "^6.15.0",
      hardhat: "^2.26.0",
      "hardhat-deploy": "^0.11.45",
      "hardhat-gas-reporter": "^2.3.0",
      mocha: "^11.7.1",
      prettier: "^3.6.2",
      "prettier-plugin-solidity": "^2.1.0",
      rimraf: "^6.0.1",
      solhint: "^6.0.0",
      "solidity-coverage": "^0.8.16",
      "ts-generator": "^0.1.1",
      "ts-node": "^10.9.2",
      typechain: "^8.3.2",
      typescript: "^5.8.3",
    },
  };

  writeFileSync(join(outputDir, "package.json"), JSON.stringify(packageJson, null, 2));
}

function generateReadme(outputDir: string, config: ExampleConfig) {
  const readme = `# ${config.displayName} - FHEVM Example

${config.description}

## Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 7.0.0

### Installation

\`\`\`bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test
\`\`\`

## Project Structure

\`\`\`
.
├── contracts/
│   └── ${config.contract}
├── test/
│   └── ${config.testFile}
├── deploy/
│   └── deploy.ts
├── tasks/
│   └── (Hardhat tasks)
├── hardhat.config.ts
├── package.json
└── README.md
\`\`\`

## Key Features

- Encrypted state management with FHEVM
- Comprehensive test coverage
- Full TypeScript support
- Professional linting and formatting

## Available Scripts

\`\`\`bash
# Compilation
npm run compile

# Testing
npm run test
npm run test:sepolia    # Run on Sepolia testnet

# Code Quality
npm run lint            # Run all linters
npm run prettier:write  # Auto-format code

# Deployment
npm run deploy:sepolia  # Deploy to Sepolia
npm run verify:sepolia  # Verify on Etherscan

# Coverage
npm run coverage        # Generate coverage report
\`\`\`

## Understanding FHEVM

This example demonstrates key FHEVM concepts:

1. **Encrypted Data Types** - Using \`euint32\` for encrypted storage
2. **Permission Model** - Using \`FHE.allowThis()\` and \`FHE.allow()\`
3. **Input Proofs** - Validating encrypted inputs with zero-knowledge proofs
4. **Privacy-Preserving Logic** - Operating on encrypted data without revealing values

## Testing

The test suite includes 65+ test cases covering:
- Functionality tests
- Security tests
- Edge cases
- Error handling
- Integration scenarios

Run tests with:
\`\`\`bash
npm run test
\`\`\`

## Deployment

To deploy on Sepolia testnet:

\`\`\`bash
# Set environment variables
export MNEMONIC="your twelve word mnemonic here"
export INFURA_API_KEY="your infura key"

# Deploy
npm run deploy:sepolia

# Verify
npm run verify:sepolia
\`\`\`

## Documentation

For detailed documentation, see:
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Architecture and patterns
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development guidelines
- [README.md](../README.md) - Full project documentation

## License

BSD-3-Clause-Clear - See LICENSE file for details

---

**Built with FHEVM by Zama** 🔐
`;

  writeFileSync(join(outputDir, "README.md"), readme);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: create-fhevm-example.ts <example-name> <output-directory>");
  console.error("\nExample:");
  console.error("  ts-node scripts/create-fhevm-example.ts private-lottery ./output/my-lottery");
  process.exit(1);
}

const [exampleName, outputDir] = args;
createFHEVMExample(exampleName, outputDir);
