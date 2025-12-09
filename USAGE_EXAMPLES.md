# Usage Examples

Complete, practical examples of using the Private Lottery contract with FHEVM.

## Table of Contents

1. [Contract Deployment](#contract-deployment)
2. [Entering the Lottery](#entering-the-lottery)
3. [Drawing Winners](#drawing-winners)
4. [Managing Lottery](#managing-lottery)
5. [Advanced Scenarios](#advanced-scenarios)

## Contract Deployment

### Using Hardhat

```typescript
import { ethers } from "hardhat";

async function deployLottery() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const factory = await ethers.getContractFactory("PrivateLottery");
  const lottery = await factory.deploy();
  await lottery.waitForDeployment();

  const address = await lottery.getAddress();
  console.log("Lottery deployed to:", address);

  // Get initial configuration
  console.log("Owner:", await lottery.owner());
  console.log("Entry Fee:", ethers.formatEther(await lottery.getEntryFee()), "ETH");
  console.log("Is Active:", await lottery.isLotteryActive());
  console.log("Current Round:", await lottery.getCurrentRound());
}

deployLottery().catch(console.error);
```

### Using Deployment Task

```bash
npx hardhat deploy --network localhost
```

Or use the custom task:

```bash
npx hardhat deploy-lottery --fee 0.005
```

## Entering the Lottery

### Example 1: Single Entry

```typescript
import { ethers, fhevm } from "hardhat";

async function enterLottery() {
  const [player] = await ethers.getSigners();
  const contractAddress = "0x..."; // Your deployed contract address

  // Connect to contract
  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);

  // Create encrypted input (number between 1-100)
  const encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, player.address)
    .add32(42) // Your lucky number
    .encrypt();

  // Get entry fee
  const entryFee = await lottery.getEntryFee();

  // Submit encrypted entry
  const tx = await lottery.enterLottery(
    encryptedInput.handles[0],
    encryptedInput.inputProof,
    { value: entryFee }
  );

  await tx.wait();
  console.log("✅ Successfully entered lottery!");
  console.log("Transaction hash:", tx.hash);
}

enterLottery().catch(console.error);
```

### Example 2: Multiple Entries

```typescript
import { ethers, fhevm } from "hardhat";

async function multipleEntries() {
  const [player] = await ethers.getSigners();
  const contractAddress = "0x...";

  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);
  const entryFee = await lottery.getEntryFee();

  // Submit 3 entries
  for (let i = 0; i < 3; i++) {
    const number = 10 + i * 10; // 10, 20, 30

    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, player.address)
      .add32(number)
      .encrypt();

    const tx = await lottery.enterLottery(
      encryptedInput.handles[0],
      encryptedInput.inputProof,
      { value: entryFee }
    );

    await tx.wait();
    console.log(`✅ Entry ${i + 1} submitted with number ${number}`);
  }

  // Check participant status
  const entries = await lottery.getParticipantEntries(player.address);
  console.log(`Total entries: ${entries}`);
}

multipleEntries().catch(console.error);
```

### Example 3: From Multiple Accounts

```typescript
import { ethers, fhevm } from "hardhat";

async function multipleParticipants() {
  const [, alice, bob, charlie] = await ethers.getSigners();
  const contractAddress = "0x...";

  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);
  const entryFee = await lottery.getEntryFee();

  const participants = [
    { signer: alice, number: 15 },
    { signer: bob, number: 25 },
    { signer: charlie, number: 35 },
  ];

  for (const { signer, number } of participants) {
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signer.address)
      .add32(number)
      .encrypt();

    const tx = await lottery.connect(signer).enterLottery(
      encryptedInput.handles[0],
      encryptedInput.inputProof,
      { value: entryFee }
    );

    await tx.wait();
    console.log(`✅ ${signer.address} entered with number ${number}`);
  }

  // Check lottery status
  const status = await checkLotteryStatus(contractAddress);
  console.log("Lottery Status:", status);
}

multipleParticipants().catch(console.error);
```

## Drawing Winners

### Example 1: Basic Draw

```typescript
import { ethers } from "hardhat";

async function drawWinner() {
  const [owner] = await ethers.getSigners();
  const contractAddress = "0x...";

  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);

  // Check current state
  const entryCount = await lottery.getEntryCount();
  const prizePool = await lottery.getPrizePool();

  console.log("Entry count:", entryCount.toString());
  console.log("Prize pool:", ethers.formatEther(prizePool), "ETH");

  if (entryCount === 0n) {
    console.log("No entries to draw!");
    return;
  }

  // Draw winner
  const tx = await lottery.drawWinner();
  await tx.wait();

  // Get winner information
  const winner = await lottery.getLastWinner();
  const round = await lottery.getCurrentRound();

  console.log("✅ Winner drawn!");
  console.log("Winner address:", winner);
  console.log("New round:", round.toString());
}

drawWinner().catch(console.error);
```

### Example 2: View Winners

```typescript
import { ethers } from "hardhat";

async function viewWinners() {
  const contractAddress = "0x...";
  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);

  const winners = await lottery.getAllWinners();

  console.log(`\n🏆 Total Winners: ${winners.length}\n`);

  winners.forEach((winner, index) => {
    console.log(`Round ${index + 1}:`);
    console.log(`  Winner: ${winner.winner}`);
    console.log(`  Prize: ${ethers.formatEther(winner.prize)} ETH`);
    console.log(`  Numbers: ${winner.num1}-${winner.num2}-${winner.num3}`);
    console.log(`  Timestamp: ${new Date(Number(winner.timestamp) * 1000).toISOString()}\n`);
  });
}

viewWinners().catch(console.error);
```

## Managing Lottery

### Change Entry Fee

```typescript
import { ethers } from "hardhat";

async function changeEntryFee() {
  const [owner] = await ethers.getSigners();
  const contractAddress = "0x...";

  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);

  // Old fee
  const oldFee = await lottery.getEntryFee();
  console.log("Old fee:", ethers.formatEther(oldFee), "ETH");

  // Set new fee: 0.005 ETH
  const newFee = ethers.parseEther("0.005");
  const tx = await lottery.setEntryFee(newFee);
  await tx.wait();

  const updatedFee = await lottery.getEntryFee();
  console.log("New fee:", ethers.formatEther(updatedFee), "ETH");
}

changeEntryFee().catch(console.error);
```

### Pause and Resume

```typescript
import { ethers } from "hardhat";

async function pauseAndResume() {
  const [owner] = await ethers.getSigners();
  const contractAddress = "0x...";

  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);

  // Check status
  let isActive = await lottery.isLotteryActive();
  console.log("Is active:", isActive);

  // Pause
  let tx = await lottery.setLotteryActive(false);
  await tx.wait();
  console.log("✅ Lottery paused");

  // Try to enter (should fail)
  isActive = await lottery.isLotteryActive();
  console.log("Is active:", isActive);

  // Resume
  tx = await lottery.setLotteryActive(true);
  await tx.wait();
  console.log("✅ Lottery resumed");

  isActive = await lottery.isLotteryActive();
  console.log("Is active:", isActive);
}

pauseAndResume().catch(console.error);
```

### Emergency Withdraw

```typescript
import { ethers } from "hardhat";

async function emergencyWithdraw() {
  const [owner] = await ethers.getSigners();
  const contractAddress = "0x...";

  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);

  // Check balance before
  const balanceBefore = await ethers.provider.getBalance(owner.address);
  console.log("Balance before:", ethers.formatEther(balanceBefore), "ETH");

  // Withdraw
  const tx = await lottery.emergencyWithdraw();
  const receipt = await tx.wait();
  const gasUsed = (receipt?.gasUsed || 0n) * (receipt?.gasPrice || 0n);

  // Check balance after
  const balanceAfter = await ethers.provider.getBalance(owner.address);
  const withdrawn = balanceAfter - balanceBefore + gasUsed;

  console.log("Withdrawn:", ethers.formatEther(withdrawn), "ETH");
  console.log("Balance after:", ethers.formatEther(balanceAfter), "ETH");
}

emergencyWithdraw().catch(console.error);
```

## Advanced Scenarios

### Example 1: Complete Lifecycle

```typescript
import { ethers, fhevm } from "hardhat";

async function completeLottery() {
  const [owner, alice, bob] = await ethers.getSigners();
  const contractAddress = "0x...";
  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);
  const entryFee = await lottery.getEntryFee();

  console.log("\n📊 Lottery Lifecycle Demo\n");

  // Round 1: Entry Phase
  console.log("--- Round 1: Entry Phase ---");
  const roundBefore = await lottery.getCurrentRound();
  console.log("Starting round:", roundBefore.toString());

  // Alice enters
  let encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add32(11)
    .encrypt();
  await lottery.connect(alice).enterLottery(
    encryptedInput.handles[0],
    encryptedInput.inputProof,
    { value: entryFee }
  );
  console.log("✅ Alice entered");

  // Bob enters
  encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, bob.address)
    .add32(22)
    .encrypt();
  await lottery.connect(bob).enterLottery(
    encryptedInput.handles[0],
    encryptedInput.inputProof,
    { value: entryFee }
  );
  console.log("✅ Bob entered");

  // Round 1: Draw Phase
  console.log("\n--- Round 1: Draw Phase ---");
  const prizePool = await lottery.getPrizePool();
  console.log("Prize pool:", ethers.formatEther(prizePool), "ETH");

  const tx = await lottery.drawWinner();
  await tx.wait();

  const winner = await lottery.getLastWinner();
  const roundAfter = await lottery.getCurrentRound();
  console.log("✅ Winner:", winner);
  console.log("Round after draw:", roundAfter.toString());

  // Check state reset
  const entriesAfter = await lottery.getEntryCount();
  console.log("Entries after draw:", entriesAfter.toString());

  // Round 2: Entry Phase
  console.log("\n--- Round 2: Entry Phase ---");
  const newRound = await lottery.getCurrentRound();
  console.log("New round:", newRound.toString());

  // Alice enters again
  encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add32(33)
    .encrypt();
  await lottery.connect(alice).enterLottery(
    encryptedInput.handles[0],
    encryptedInput.inputProof,
    { value: entryFee }
  );
  console.log("✅ Alice entered Round 2");

  console.log("\n✅ Complete lifecycle demo finished!\n");
}

completeLottery().catch(console.error);
```

### Example 2: Participant Analytics

```typescript
import { ethers } from "hardhat";

async function analyticsExample() {
  const contractAddress = "0x...";
  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);

  const [alice, bob, charlie] = await ethers.getSigners();
  const participants = [alice.address, bob.address, charlie.address];

  console.log("\n📈 Participant Analytics\n");

  for (const participant of participants) {
    const entries = await lottery.getParticipantEntries(participant);
    const hasWon = await lottery.hasParticipantWon(participant);

    console.log(`Participant: ${participant}`);
    console.log(`  Total Entries: ${entries}`);
    console.log(`  Has Won: ${hasWon ? "✅ Yes" : "❌ No"}`);
    console.log();
  }
}

analyticsExample().catch(console.error);
```

## Helper Functions

```typescript
import { ethers } from "hardhat";

// Get complete lottery status
async function checkLotteryStatus(contractAddress: string) {
  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);

  return {
    owner: await lottery.owner(),
    isActive: await lottery.isLotteryActive(),
    currentRound: (await lottery.getCurrentRound()).toString(),
    entryFee: ethers.formatEther(await lottery.getEntryFee()),
    prizePool: ethers.formatEther(await lottery.getPrizePool()),
    entryCount: (await lottery.getEntryCount()).toString(),
  };
}

// Get participant info
async function getParticipantInfo(contractAddress: string, address: string) {
  const lottery = await ethers.getContractAt("PrivateLottery", contractAddress);

  return {
    address,
    entries: (await lottery.getParticipantEntries(address)).toString(),
    hasWon: await lottery.hasParticipantWon(address),
  };
}

// Format and display lottery info
function displayLotteryStatus(status: any) {
  console.log("\n📊 Lottery Status:");
  console.log("─────────────────────────");
  console.log(`Owner:        ${status.owner}`);
  console.log(`Is Active:    ${status.isActive ? "✅" : "❌"}`);
  console.log(`Round:        ${status.currentRound}`);
  console.log(`Entry Fee:    ${status.entryFee} ETH`);
  console.log(`Prize Pool:   ${status.prizePool} ETH`);
  console.log(`Entries:      ${status.entryCount}`);
  console.log("─────────────────────────\n");
}
```

## Running Examples

### Setup

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Start local network
npx hardhat node
```

### Execute Example

In another terminal:

```bash
# Run example script
npx hardhat run scripts/example.ts --network localhost
```

Or use Hardhat tasks:

```bash
npx hardhat get-lottery-status --address 0x...
npx hardhat get-winners --address 0x...
```

---

For more examples and advanced patterns, see [DEVELOPMENT.md](./DEVELOPMENT.md) and [GUIDE_FOR_DEVELOPERS.md](./GUIDE_FOR_DEVELOPERS.md).
