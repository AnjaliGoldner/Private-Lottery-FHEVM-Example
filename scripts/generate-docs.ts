#!/usr/bin/env npx ts-node

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

interface DocSection {
  title: string;
  content: string;
}

interface ExampleDoc {
  name: string;
  title: string;
  description: string;
  category: string;
  sections: DocSection[];
}

const EXAMPLES: Record<string, ExampleDoc> = {
  "fhe-counter": {
    name: "fhe-counter",
    title: "FHE Counter",
    description: "Basic encrypted counter demonstrating increment and decrement operations",
    category: "basic",
    sections: [
      {
        title: "Overview",
        content: `A simple counter using encrypted integers (euint32) to demonstrate basic FHE operations.

## Key Concepts

- **Encrypted State Storage**: Counter stored as encrypted value
- **FHE Arithmetic**: Addition and subtraction on encrypted values
- **Permission Management**: Using FHE.allowThis() and FHE.allow()`,
      },
      {
        title: "Core Features",
        content: `- Encrypted counter initialization
- Increment by encrypted value
- Decrement by encrypted value
- Proper permission grants
- Event emission for operations`,
      },
    ],
  },
  "encrypted-storage": {
    name: "encrypted-storage",
    title: "Encrypted Storage",
    description: "Demonstrates storing and managing multiple encrypted values with different types",
    category: "basic",
    sections: [
      {
        title: "Overview",
        content: `Shows how to store single and multiple encrypted values with proper permission management.

## Key Concepts

- **Multiple Encrypted Types**: euint32 and euint64 storage
- **Batch Operations**: Store multiple values in one transaction
- **Value Updates**: Add to existing encrypted values
- **Permission Model**: Proper access control patterns`,
      },
    ],
  },
  "access-control": {
    name: "access-control",
    title: "Access Control Demonstration",
    description: "Comprehensive guide to FHE access control patterns and permission management",
    category: "basic",
    sections: [
      {
        title: "Overview",
        content: `Demonstrates all FHE permission patterns: allowThis, allow, and allowTransient.

## Key Concepts

- **allowThis**: Contract permission for operations
- **allow**: User permission for decryption
- **allowTransient**: Temporary permissions for view functions
- **Shared Values**: Multiple parties accessing same encrypted data`,
      },
      {
        title: "Permission Patterns",
        content: `### Basic Pattern
\`\`\`solidity
FHE.allowThis(encryptedValue);  // Contract can operate
FHE.allow(encryptedValue, user); // User can decrypt
\`\`\`

### Shared Access
\`\`\`solidity
FHE.allow(sharedValue, user1);
FHE.allow(sharedValue, user2);
\`\`\`

### Transient (View Functions)
\`\`\`solidity
FHE.allowTransient(tempValue, user);
\`\`\``,
      },
    ],
  },
  "comparison-operations": {
    name: "comparison-operations",
    title: "Comparison Operations",
    description: "Complete guide to FHE comparison operations and conditional logic",
    category: "basic",
    sections: [
      {
        title: "Overview",
        content: `Demonstrates all FHE comparison operations: eq, ne, lt, lte, gt, gte, min, max, and select.

## Key Concepts

- **Equality**: FHE.eq() and FHE.ne()
- **Ordering**: FHE.lt(), FHE.lte(), FHE.gt(), FHE.gte()
- **Min/Max**: FHE.min() and FHE.max()
- **Conditional**: FHE.select() for if-then-else logic
- **Encrypted Booleans**: Working with ebool type`,
      },
      {
        title: "Core Operations",
        content: `### Comparison Functions
\`\`\`solidity
ebool isEqual = FHE.eq(value1, value2);
ebool isLess = FHE.lt(value1, value2);
euint32 maximum = FHE.max(value1, value2);
\`\`\`

### Conditional Selection
\`\`\`solidity
ebool condition = FHE.gt(newValue, threshold);
result = FHE.select(condition, newValue, oldValue);
\`\`\``,
      },
    ],
  },
  "user-decryption": {
    name: "user-decryption",
    title: "User Decryption",
    description: "Demonstrates how users decrypt their encrypted data off-chain",
    category: "decryption",
    sections: [
      {
        title: "Overview",
        content: `Shows the complete flow for user decryption of encrypted values.

## Key Concepts

- **Permission Grants**: Proper allowThis and allow for decryption
- **Single Value**: Decrypt one encrypted value
- **Multiple Values**: Decrypt multiple values at once
- **Shared Decryption**: Grant decryption rights to others
- **Off-Chain Flow**: How users decrypt with their private key`,
      },
      {
        title: "Decryption Pattern",
        content: `### On-Chain Storage
\`\`\`solidity
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, msg.sender);
\`\`\`

### Off-Chain Decryption
\`\`\`typescript
const encrypted = await contract.getEncryptedValue32();
const decrypted = await fhevm.decrypt(encrypted, userKey);
\`\`\``,
      },
    ],
  },
  "anti-patterns": {
    name: "anti-patterns",
    title: "Anti-Patterns and Common Mistakes",
    description: "Learn what NOT to do - common FHEVM mistakes and correct patterns",
    category: "bestpractices",
    sections: [
      {
        title: "Overview",
        content: `Comprehensive guide to avoiding common FHEVM development mistakes.

## Common Anti-Patterns

1. Missing input proof validation
2. Missing allowThis permission
3. View functions with encrypted returns
4. Forgetting permissions after operations
5. Signer mismatches
6. Not checking initialization
7. Exposing encrypted values in events
8. Using regular arithmetic operators`,
      },
      {
        title: "Key Lessons",
        content: `### ❌ Wrong: No Input Proof
\`\`\`solidity
euint32 value = FHE.fromExternal(encValue); // WRONG!
\`\`\`

### ✅ Correct: With Input Proof
\`\`\`solidity
euint32 value = FHE.fromExternal(encValue, inputProof);
\`\`\`

### ❌ Wrong: Missing allowThis
\`\`\`solidity
FHE.allow(value, user); // INCOMPLETE!
\`\`\`

### ✅ Correct: Both Permissions
\`\`\`solidity
FHE.allowThis(value);
FHE.allow(value, user);
\`\`\``,
      },
    ],
  },
  "private-lottery": {
    name: "private-lottery",
    title: "Private Lottery",
    description: "Privacy-preserving lottery system using FHEVM encryption",
    category: "applications",
    sections: [
      {
        title: "Overview",
        content: `A complete lottery system demonstrating privacy-preserving smart contracts with Fully Homomorphic Encryption (FHEVM).

## Key Concepts

- **Encrypted State Storage**: Participant entries stored as encrypted values
- **Access Control Patterns**: Using FHE.allowThis() and FHE.allow()
- **Input Proof Validation**: Zero-knowledge proof verification
- **Multi-Round Architecture**: Stateful transitions across lottery rounds`,
      },
      {
        title: "Core Features",
        content: `- Encrypted lottery entry submission
- Privacy-preserving winner selection
- Automatic prize distribution (80/20 split)
- Multi-round lottery mechanics
- Complete permission management
- Event-driven design`,
      },
      {
        title: "Contract Functions",
        content: `### Public Functions

\`\`\`solidity
function enterLottery(externalEuint32 encryptedNumber, bytes calldata inputProof) external payable
\`\`\`

Submit encrypted lottery entry with proof.

### Owner Functions

\`\`\`solidity
function drawWinner() external returns (address)
function setLotteryActive(bool active) external
function setEntryFee(uint256 newFee) external
function emergencyWithdraw() external
\`\`\`

### View Functions

\`\`\`solidity
function getEntryCount() external view returns (uint256)
function getPrizePool() external view returns (uint256)
function getCurrentRound() external view returns (uint256)
function getLastWinner() external view returns (address)
\`\`\``,
      },
      {
        title: "Testing",
        content: `The project includes 65+ comprehensive test cases covering:

- Deployment and initialization
- Encrypted entry submission
- Winner drawing mechanics
- Owner function access control
- Event emission verification
- Edge cases and security scenarios
- Prize distribution accuracy
- Integration workflows

Run tests with:
\`\`\`bash
npm run test
\`\`\``,
      },
      {
        title: "Common Pitfalls",
        content: `### ❌ Missing Input Proof
\`\`\`solidity
// Wrong - no proof validation
FHE.fromExternal(encryptedValue);
\`\`\`

### ✅ Correct Usage
\`\`\`solidity
// Correct - validates encryption binding
euint32 value = FHE.fromExternal(encryptedValue, inputProof);
\`\`\`

### ❌ Incomplete Permissions
\`\`\`solidity
// Wrong - missing allowThis
FHE.allow(value, msg.sender);
\`\`\`

### ✅ Full Permissions
\`\`\`solidity
// Correct - grants all necessary permissions
FHE.allowThis(value);
FHE.allow(value, msg.sender);
\`\`\``,
      },
    ],
  },
};

function generateDocumentation(exampleName?: string) {
  const outputDir = join(__dirname, "../docs");
  mkdirSync(outputDir, { recursive: true });

  console.log("📚 Generating Documentation");
  console.log("─────────────────────────────────────────");

  if (exampleName === "--all") {
    // Generate all examples
    Object.entries(EXAMPLES).forEach(([name, example]) => {
      console.log(`📄 Generating docs for: ${example.title}`);
      generateExampleDoc(outputDir, example);
    });
  } else if (exampleName) {
    const example = EXAMPLES[exampleName];
    if (!example) {
      console.error(`❌ Unknown example: ${exampleName}`);
      process.exit(1);
    }
    console.log(`📄 Generating docs for: ${example.title}`);
    generateExampleDoc(outputDir, example);
  } else {
    // Generate all by default
    Object.entries(EXAMPLES).forEach(([name, example]) => {
      console.log(`📄 Generating docs for: ${example.title}`);
      generateExampleDoc(outputDir, example);
    });
  }

  // Generate SUMMARY.md
  console.log(`📑 Generating SUMMARY.md`);
  generateSummary(outputDir);

  console.log("\n✅ Documentation generated successfully!");
  console.log("─────────────────────────────────────────");
  console.log(`\n📂 Location: ${outputDir}`);
  console.log(`\n📖 View documentation:`);
  console.log(`   Open ${join(outputDir, "SUMMARY.md")} in your editor`);
  console.log(`\n💡 To serve with GitBook:`);
  console.log(`   1. npm install -g gitbook-cli`);
  console.log(`   2. gitbook serve ${outputDir}\n`);
}

function generateExampleDoc(docsDir: string, example: ExampleDoc) {
  let content = `# ${example.title}\n\n`;
  content += `${example.description}\n\n`;
  content += `## Contents\n\n`;

  example.sections.forEach((section, index) => {
    content += `${index + 1}. [${section.title}](#${urlify(section.title)})\n`;
  });

  content += "\n---\n\n";

  example.sections.forEach((section) => {
    content += `## ${section.title}\n\n`;
    content += section.content;
    content += "\n\n";
  });

  const filename = `${example.name}.md`;
  writeFileSync(join(docsDir, filename), content);
  console.log(`   ✓ Created ${filename}`);
}

function generateSummary(docsDir: string) {
  let content = `# Private Lottery FHEVM Example Documentation\n\n`;
  content += `## Overview\n\n`;
  content += `Complete documentation for FHEVM example projects.\n\n`;
  content += `## Examples\n\n`;

  // Add example links
  const categories: Record<string, ExampleDoc[]> = {};

  Object.values(EXAMPLES).forEach((example) => {
    if (!categories[example.category]) {
      categories[example.category] = [];
    }
    categories[example.category].push(example);
  });

  Object.entries(categories).forEach(([category, examples]) => {
    content += `### ${capitalize(category)}\n\n`;
    examples.forEach((example) => {
      content += `- [${example.title}](./${example.name}.md)\n`;
    });
    content += "\n";
  });

  // Add sections
  content += `## Quick Reference\n\n`;
  content += `- [Core Concepts](#core-concepts)\n`;
  content += `- [Common Patterns](#common-patterns)\n`;
  content += `- [Testing Guide](#testing-guide)\n`;
  content += `- [Resources](#resources)\n\n`;

  content += `## Core Concepts\n\n`;
  content += `### FHEVM Basics\n`;
  content += `- Encrypted data types (euint32, euint64, etc.)\n`;
  content += `- Permission model (allowThis, allow)\n`;
  content += `- Input proofs and validation\n`;
  content += `- Decryption patterns\n\n`;

  content += `## Common Patterns\n\n`;
  content += `### Encrypted Input Validation\n`;
  content += `\`\`\`solidity\neuint32 value = FHE.fromExternal(encryptedInput, inputProof);\n\`\`\`\n\n`;

  content += `### Permission Management\n`;
  content += `\`\`\`solidity\nFHE.allowThis(encryptedValue);\nFHE.allow(encryptedValue, userAddress);\n\`\`\`\n\n`;

  content += `## Testing Guide\n\n`;
  content += `All examples include comprehensive test suites (65+ tests) covering:\n`;
  content += `- Functionality verification\n`;
  content += `- Security validation\n`;
  content += `- Edge case handling\n`;
  content += `- Integration scenarios\n\n`;

  content += `## Resources\n\n`;
  content += `- [FHEVM Documentation](https://docs.zama.ai/fhevm)\n`;
  content += `- [Zama Protocol Examples](https://docs.zama.org/protocol/examples)\n`;
  content += `- [Hardhat Documentation](https://hardhat.org)\n`;
  content += `- [Solidity Documentation](https://docs.soliditylang.org)\n`;

  writeFileSync(join(docsDir, "SUMMARY.md"), content);
  console.log(`   ✓ Created SUMMARY.md`);
}

function urlify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Main execution
const args = process.argv.slice(2);
const exampleName = args[0];

generateDocumentation(exampleName);
