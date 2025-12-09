# Automation Scripts

This directory contains scripts for automating common tasks and generating documentation for the Private Lottery FHEVM example.

## Usage

All scripts can be run using `npx ts-node` or npm scripts defined in `package.json`.

### Example Scripts

#### Create FHEVM Example (Scaffolding)

```bash
ts-node scripts/create-fhevm-example.ts <example-name> <output-directory>
```

**Example:**
```bash
ts-node scripts/create-fhevm-example.ts private-lottery ./generated/my-lottery
```

This script:
- Clones the base Hardhat template
- Copies the contract and test files
- Updates package.json with correct naming
- Generates a README for the example
- Creates deployment configuration

**Parameters:**
- `example-name`: Name of the example to scaffold (e.g., "private-lottery")
- `output-directory`: Where to create the standalone repository

**Output:**
A complete, standalone Hardhat project ready to use:
```
my-lottery/
├── contracts/PrivateLottery.sol
├── test/PrivateLottery.ts
├── deploy/deploy.ts
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── README.md
└── ... (configuration files)
```

#### Generate Documentation

```bash
ts-node scripts/generate-docs.ts [example-name]
```

**Examples:**
```bash
# Generate docs for specific example
ts-node scripts/generate-docs.ts private-lottery

# Generate docs for all examples
ts-node scripts/generate-docs.ts --all
```

This script:
- Extracts contract and test code
- Generates formatted markdown documentation
- Creates GitBook-compatible SUMMARY.md
- Organizes documentation by category

**Output:**
GitBook-compatible documentation structure:
```
docs/
├── SUMMARY.md
├── private-lottery.md
├── concepts/
│   ├── encryption.md
│   ├── permissions.md
│   └── state-management.md
└── ...
```

## Script Development

### Creating New Scripts

Scripts should:

1. **Be TypeScript-based** - Use `.ts` extension
2. **Handle errors gracefully** - Provide clear error messages
3. **Include help text** - Document parameters and usage
4. **Log progress** - Show what's happening with console logs
5. **Return useful output** - Generate files or useful information

### Common Patterns

**Reading configuration:**
```typescript
import { readFileSync } from "fs";
const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
```

**Creating directories:**
```typescript
import { mkdirSync } from "fs";
mkdirSync(outputDir, { recursive: true });
```

**Copying files:**
```typescript
import { copyFileSync } from "fs";
copyFileSync(source, destination);
```

**Generating content:**
```typescript
import { writeFileSync } from "fs";
const content = generateMarkdown(contract, tests);
writeFileSync(`${outputDir}/README.md`, content);
```

## Integration with Hardhat

Scripts can also be run as Hardhat tasks:

```bash
npx hardhat <task-name> --<param> <value>
```

See `tasks/` directory for available tasks.

## Example Workflow

### Complete Scaffolding Workflow

```bash
# 1. Generate a standalone example
ts-node scripts/create-fhevm-example.ts private-lottery ./examples/my-lottery

# 2. Navigate to generated project
cd ./examples/my-lottery

# 3. Install dependencies
npm install

# 4. Compile contracts
npm run compile

# 5. Run tests
npm run test

# 6. Run linting
npm run lint
```

### Documentation Workflow

```bash
# 1. Generate documentation
ts-node scripts/generate-docs.ts private-lottery

# 2. Build GitBook (if gitbook installed)
gitbook build ./docs

# 3. Serve documentation locally
gitbook serve ./docs
```

## Guidelines for Contributors

When adding new scripts:

1. **Place in this directory** - Keep all scripts in `scripts/`
2. **Update this README** - Document what the script does
3. **Add to package.json** - Create npm scripts for easy access
4. **Test thoroughly** - Verify output on clean environment
5. **Handle edge cases** - Consider empty inputs, missing files, etc.
6. **Follow naming** - Use descriptive names like `generate-`, `create-`, `deploy-`

## Future Enhancements

Potential scripts for future development:

- `validate-examples.ts` - Validate all examples compile and pass tests
- `update-dependencies.ts` - Update FHEVM versions across all examples
- `publish-examples.ts` - Publish examples to GitHub/NPM
- `analyze-coverage.ts` - Generate test coverage reports
- `benchmark-gas.ts` - Benchmark gas consumption
- `lint-all.ts` - Run linting across all examples

## Troubleshooting

### Script fails to find files

Ensure you're running from the project root directory:
```bash
cd /path/to/private-lottery
ts-node scripts/create-fhevm-example.ts private-lottery ./output
```

### Permission denied errors

On Linux/Mac, make scripts executable:
```bash
chmod +x scripts/*.ts
```

### TypeScript compilation errors

Ensure TypeScript is installed:
```bash
npm install --save-dev typescript ts-node @types/node
```

## References

- [Hardhat Tasks Documentation](https://hardhat.org/hardhat-runner/docs/guides/tasks)
- [Node.js File System API](https://nodejs.org/api/fs.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
