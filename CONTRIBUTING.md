# Contributing Guide

Thank you for interest in contributing to the Private Lottery FHEVM Example!

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- Git

### Setup Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd private-lottery-fhevm

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow existing code style and patterns
- Ensure all code is in English
- Add appropriate comments and documentation

### 3. Test Your Changes

```bash
# Run tests
npm run test

# Run linting
npm run lint

# Run code formatting
npm run prettier:write

# Generate coverage
npm run coverage
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "Description of your changes"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

## Code Standards

### Solidity

- Follow official Solidity style guide
- Use meaningful variable and function names
- Add comprehensive natspec documentation
- Include examples and use cases in comments

Example:

```solidity
/// @title Example Function
/// @author Your Name
/// @notice Describes what the function does
/// @param inputParam Description of input
/// @return outputValue Description of output
/// @dev Implementation notes and warnings
function exampleFunction(uint256 inputParam) external returns (uint256) {
    // Implementation
}
```

### TypeScript

- Use strict type checking
- Follow existing naming conventions
- Add JSDoc comments for complex logic
- Use meaningful variable names

Example:

```typescript
/**
 * Encrypts a value for the contract
 * @param value - The value to encrypt
 * @param userAddress - The user's address
 * @returns Encrypted value and input proof
 */
async function encryptValue(value: number, userAddress: string) {
  // Implementation
}
```

### Tests

- Write tests for all new features
- Include both positive and negative test cases
- Use clear test descriptions
- Follow existing test patterns

Example:

```typescript
it("✅ should successfully perform action", async function () {
  // Setup
  const input = await fhevm.createEncryptedInput(/*...*/).encrypt();

  // Execute
  const tx = await contract.connect(user).function(input.handles[0], input.inputProof);
  await tx.wait();

  // Verify
  expect(await contract.getState()).to.equal(expectedValue);
});

it("❌ should reject invalid input", async function () {
  // Test error cases
  await expect(
    contract.connect(user).function(invalidInput)
  ).to.be.revertedWith("Error message");
});
```

## Documentation

### Adding New Features

1. **Update Contract Comments**: Add comprehensive natspec comments
2. **Update README**: Add usage examples and function descriptions
3. **Update Tests**: Include test documentation
4. **Create Examples**: Add concrete examples in comments

### Updating Dependencies

When updating dependencies:

1. Update `package.json`
2. Run `npm install`
3. Test compilation: `npm run compile`
4. Run all tests: `npm run test`
5. Document breaking changes if any

## Commit Message Guidelines

Use clear, descriptive commit messages:

```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build, dependencies, etc.

Example:

```
feat: add encryption validation in enterLottery

- Validate encrypted input format
- Add input proof verification
- Include comprehensive error messages

Fixes #123
```

## Reporting Issues

When reporting issues:

1. Use descriptive titles
2. Provide minimal reproduction steps
3. Include relevant context (Node version, OS, etc.)
4. Add error messages and stack traces

## Questions?

- Check existing documentation
- Review test files for examples
- Consult FHEVM documentation
- Ask in GitHub discussions

## License

By contributing, you agree your code will be licensed under BSD-3-Clause-Clear.

---

Thank you for contributing! 🙏
