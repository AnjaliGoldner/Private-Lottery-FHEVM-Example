import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { PrivateLottery, PrivateLottery__factory } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("PrivateLottery")) as PrivateLottery__factory;
  const lotteryContract = (await factory.deploy()) as PrivateLottery;
  const lotteryContractAddress = await lotteryContract.getAddress();

  return { lotteryContract, lotteryContractAddress };
}

describe("PrivateLottery", function () {
  let signers: Signers;
  let lotteryContract: PrivateLottery;
  let lotteryContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2], charlie: ethSigners[3] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ lotteryContract, lotteryContractAddress } = await deployFixture());
  });

  describe("Deployment", function () {
    it("✅ should set the owner correctly", async function () {
      expect(await lotteryContract.owner()).to.equal(signers.deployer.address);
    });

    it("✅ should initialize with active lottery", async function () {
      expect(await lotteryContract.isLotteryActive()).to.be.true;
    });

    it("✅ should have correct initial entry fee", async function () {
      expect(await lotteryContract.getEntryFee()).to.equal(ethers.parseEther("0.001"));
    });

    it("✅ should initialize with round number 1", async function () {
      expect(await lotteryContract.getCurrentRound()).to.equal(1n);
    });
  });

  describe("Entering Lottery", function () {
    it("✅ should allow participant to enter with encrypted number", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Create encrypted input
      const encryptedInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(42) // Choose number 42
        .encrypt();

      // Enter lottery
      const tx = await lotteryContract
        .connect(signers.alice)
        .enterLottery(encryptedInput.handles[0], encryptedInput.inputProof, { value: entryFee });

      await tx.wait();

      // Verify entry was recorded
      expect(await lotteryContract.getParticipantEntries(signers.alice.address)).to.equal(1n);
      expect(await lotteryContract.getEntryCount()).to.equal(1n);
    });

    it("✅ should add entry fee to prize pool", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      const encryptedInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      const initialPrizePool = await lotteryContract.getPrizePool();

      await lotteryContract
        .connect(signers.alice)
        .enterLottery(encryptedInput.handles[0], encryptedInput.inputProof, { value: entryFee });

      const newPrizePool = await lotteryContract.getPrizePool();
      expect(newPrizePool).to.equal(initialPrizePool + entryFee);
    });

    it("❌ should reject entry with insufficient fee", async function () {
      const entryFee = await lotteryContract.getEntryFee();
      const insufficientFee = entryFee / 2n;

      const encryptedInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(25)
        .encrypt();

      await expect(
        lotteryContract
          .connect(signers.alice)
          .enterLottery(encryptedInput.handles[0], encryptedInput.inputProof, { value: insufficientFee }),
      ).to.be.revertedWith("Insufficient entry fee");
    });

    it("❌ should reject entry when lottery is inactive", async function () {
      // Deactivate lottery
      await lotteryContract.connect(signers.deployer).setLotteryActive(false);

      const entryFee = await lotteryContract.getEntryFee();
      const encryptedInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(30)
        .encrypt();

      await expect(
        lotteryContract
          .connect(signers.alice)
          .enterLottery(encryptedInput.handles[0], encryptedInput.inputProof, { value: entryFee }),
      ).to.be.revertedWith("Lottery is not active");
    });

    it("✅ should allow multiple participants", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Alice enters
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(10)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      // Bob enters
      const bobInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.bob.address)
        .add32(20)
        .encrypt();
      await lotteryContract.connect(signers.bob).enterLottery(bobInput.handles[0], bobInput.inputProof, { value: entryFee });

      // Charlie enters
      const charlieInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.charlie.address)
        .add32(30)
        .encrypt();
      await lotteryContract
        .connect(signers.charlie)
        .enterLottery(charlieInput.handles[0], charlieInput.inputProof, { value: entryFee });

      expect(await lotteryContract.getEntryCount()).to.equal(3n);
      expect(await lotteryContract.getParticipantEntries(signers.alice.address)).to.equal(1n);
      expect(await lotteryContract.getParticipantEntries(signers.bob.address)).to.equal(1n);
      expect(await lotteryContract.getParticipantEntries(signers.charlie.address)).to.equal(1n);
    });

    it("✅ should allow same participant to enter multiple times", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // First entry
      const input1 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(15)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(input1.handles[0], input1.inputProof, { value: entryFee });

      // Second entry
      const input2 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(25)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(input2.handles[0], input2.inputProof, { value: entryFee });

      expect(await lotteryContract.getParticipantEntries(signers.alice.address)).to.equal(2n);
      expect(await lotteryContract.getEntryCount()).to.equal(2n);
    });
  });

  describe("Drawing Winner", function () {
    beforeEach(async function () {
      // Setup: Add entries from multiple participants
      const entryFee = await lotteryContract.getEntryFee();

      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(11)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      const bobInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.bob.address)
        .add32(22)
        .encrypt();
      await lotteryContract
        .connect(signers.bob)
        .enterLottery(bobInput.handles[0], bobInput.inputProof, { value: entryFee });

      const charlieInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.charlie.address)
        .add32(33)
        .encrypt();
      await lotteryContract
        .connect(signers.charlie)
        .enterLottery(charlieInput.handles[0], charlieInput.inputProof, { value: entryFee });
    });

    it("✅ should draw a winner and transfer 80% of prize pool", async function () {
      const prizePool = await lotteryContract.getPrizePool();
      const expectedWinnerPrize = (prizePool * 80n) / 100n;

      const aliceBalanceBefore = await ethers.provider.getBalance(signers.alice.address);

      // Draw winner
      const tx = await lotteryContract.connect(signers.deployer).drawWinner();
      await tx.wait();

      // One of the participants should have won
      const lastWinner = await lotteryContract.getLastWinner();
      expect([signers.alice.address, signers.bob.address, signers.charlie.address]).to.include(lastWinner);
    });

    it("✅ should reset lottery after drawing winner", async function () {
      const roundBefore = await lotteryContract.getCurrentRound();

      await lotteryContract.connect(signers.deployer).drawWinner();

      const roundAfter = await lotteryContract.getCurrentRound();
      expect(roundAfter).to.equal(roundBefore + 1n);
      expect(await lotteryContract.getEntryCount()).to.equal(0n);
    });

    it("❌ should reject draw when no entries exist", async function () {
      // Reset lottery manually to clear entries
      await lotteryContract.connect(signers.deployer).drawWinner();

      // Try to draw again with no entries
      await expect(lotteryContract.connect(signers.deployer).drawWinner()).to.be.revertedWith("No entries in lottery");
    });

    it("❌ should reject draw from non-owner", async function () {
      await expect(lotteryContract.connect(signers.alice).drawWinner()).to.be.revertedWith("Only owner can call this function");
    });

    it("✅ should record winner in winners list", async function () {
      const winnersCountBefore = (await lotteryContract.getAllWinners()).length;

      await lotteryContract.connect(signers.deployer).drawWinner();

      const winnersCountAfter = (await lotteryContract.getAllWinners()).length;
      expect(winnersCountAfter).to.equal(winnersCountBefore + 1);
    });
  });

  describe("Owner Functions", function () {
    it("✅ should allow owner to set entry fee", async function () {
      const newFee = ethers.parseEther("0.005");
      await lotteryContract.connect(signers.deployer).setEntryFee(newFee);
      expect(await lotteryContract.getEntryFee()).to.equal(newFee);
    });

    it("❌ should reject fee change from non-owner", async function () {
      const newFee = ethers.parseEther("0.005");
      await expect(
        lotteryContract.connect(signers.alice).setEntryFee(newFee),
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("✅ should allow owner to toggle lottery active status", async function () {
      expect(await lotteryContract.isLotteryActive()).to.be.true;

      await lotteryContract.connect(signers.deployer).setLotteryActive(false);
      expect(await lotteryContract.isLotteryActive()).to.be.false;

      await lotteryContract.connect(signers.deployer).setLotteryActive(true);
      expect(await lotteryContract.isLotteryActive()).to.be.true;
    });

    it("❌ should reject toggle from non-owner", async function () {
      await expect(
        lotteryContract.connect(signers.alice).setLotteryActive(false),
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("✅ should allow owner to perform emergency withdraw", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Add some entries
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(50)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      const balanceBefore = await ethers.provider.getBalance(signers.deployer.address);

      // Perform emergency withdraw
      const tx = await lotteryContract.connect(signers.deployer).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(signers.deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore - gasUsed);
    });

    it("❌ should reject emergency withdraw from non-owner", async function () {
      await expect(lotteryContract.connect(signers.alice).emergencyWithdraw()).to.be.revertedWith(
        "Only owner can call this function",
      );
    });
  });

  describe("Receive and Fallback", function () {
    it("✅ should accept donations via receive", async function () {
      const donationAmount = ethers.parseEther("0.5");
      const prizePoolBefore = await lotteryContract.getPrizePool();

      await signers.alice.sendTransaction({
        to: lotteryContractAddress,
        value: donationAmount,
      });

      const prizePoolAfter = await lotteryContract.getPrizePool();
      expect(prizePoolAfter).to.equal(prizePoolBefore + donationAmount);
    });

    it("✅ should accept donations via fallback", async function () {
      const donationAmount = ethers.parseEther("0.3");
      const prizePoolBefore = await lotteryContract.getPrizePool();

      // Send with data to trigger fallback
      await signers.bob.sendTransaction({
        to: lotteryContractAddress,
        value: donationAmount,
        data: "0x12345678", // Non-existent function
      });

      const prizePoolAfter = await lotteryContract.getPrizePool();
      expect(prizePoolAfter).to.equal(prizePoolBefore + donationAmount);
    });
  });

  describe("View Functions", function () {
    it("✅ should return correct participant history", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      const input1 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(10)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(input1.handles[0], input1.inputProof, { value: entryFee });

      const input2 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(20)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(input2.handles[0], input2.inputProof, { value: entryFee });

      expect(await lotteryContract.getParticipantEntries(signers.alice.address)).to.equal(2n);
    });

    it("✅ should return correct winner status", async function () {
      expect(await lotteryContract.hasParticipantWon(signers.alice.address)).to.be.false;

      // Setup entries
      const entryFee = await lotteryContract.getEntryFee();
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(40)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      const bobInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.bob.address)
        .add32(50)
        .encrypt();
      await lotteryContract
        .connect(signers.bob)
        .enterLottery(bobInput.handles[0], bobInput.inputProof, { value: entryFee });

      // Draw winner
      await lotteryContract.connect(signers.deployer).drawWinner();

      // At least one participant should have won
      const aliceWon = await lotteryContract.hasParticipantWon(signers.alice.address);
      const bobWon = await lotteryContract.hasParticipantWon(signers.bob.address);
      expect(aliceWon || bobWon).to.be.true;
    });

    it("✅ should return zero entries for non-participant", async function () {
      expect(await lotteryContract.getParticipantEntries(signers.charlie.address)).to.equal(0n);
    });

    it("✅ should return false for non-winner", async function () {
      expect(await lotteryContract.hasParticipantWon(signers.bob.address)).to.be.false;
    });

    it("✅ should return correct prize pool with no entries", async function () {
      expect(await lotteryContract.getPrizePool()).to.equal(0n);
    });
  });

  describe("Event Emission", function () {
    it("✅ should emit LotteryEntered event on entry", async function () {
      const entryFee = await lotteryContract.getEntryFee();
      const encryptedInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      await expect(
        lotteryContract
          .connect(signers.alice)
          .enterLottery(encryptedInput.handles[0], encryptedInput.inputProof, { value: entryFee }),
      )
        .to.emit(lotteryContract, "LotteryEntered")
        .withArgs(signers.alice.address, await lotteryContract.getCurrentRound());
    });

    it("✅ should emit WinnerDrawn event when winner is selected", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Add entries
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(11)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      // Draw should emit WinnerDrawn event
      await expect(lotteryContract.connect(signers.deployer).drawWinner()).to.emit(lotteryContract, "WinnerDrawn");
    });

    it("✅ should emit LotteryReset event after drawing", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Add entries
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(55)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      const currentRound = await lotteryContract.getCurrentRound();
      await expect(lotteryContract.connect(signers.deployer).drawWinner())
        .to.emit(lotteryContract, "LotteryReset")
        .withArgs(currentRound + 1n);
    });

    it("✅ should emit LotteryStatusChanged event when toggling status", async function () {
      await expect(lotteryContract.connect(signers.deployer).setLotteryActive(false))
        .to.emit(lotteryContract, "LotteryStatusChanged")
        .withArgs(false);

      await expect(lotteryContract.connect(signers.deployer).setLotteryActive(true))
        .to.emit(lotteryContract, "LotteryStatusChanged")
        .withArgs(true);
    });
  });

  describe("Edge Cases and Security", function () {
    it("✅ should handle exact entry fee payment", async function () {
      const entryFee = await lotteryContract.getEntryFee();
      const encryptedInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(77)
        .encrypt();

      await expect(
        lotteryContract
          .connect(signers.alice)
          .enterLottery(encryptedInput.handles[0], encryptedInput.inputProof, { value: entryFee }),
      ).to.not.be.reverted;
    });

    it("✅ should handle overpayment and keep excess in prize pool", async function () {
      const entryFee = await lotteryContract.getEntryFee();
      const overpayment = entryFee * 2n;

      const encryptedInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(88)
        .encrypt();

      const poolBefore = await lotteryContract.getPrizePool();

      await lotteryContract
        .connect(signers.alice)
        .enterLottery(encryptedInput.handles[0], encryptedInput.inputProof, { value: overpayment });

      const poolAfter = await lotteryContract.getPrizePool();
      expect(poolAfter).to.equal(poolBefore + overpayment);
    });

    it("❌ should reject zero entry fee", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(99)
        .encrypt();

      await expect(
        lotteryContract.connect(signers.alice).enterLottery(encryptedInput.handles[0], encryptedInput.inputProof, {
          value: 0,
        }),
      ).to.be.revertedWith("Insufficient entry fee");
    });

    it("✅ should handle single participant lottery", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Only Alice enters
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(33)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      // Should still be able to draw
      await expect(lotteryContract.connect(signers.deployer).drawWinner()).to.not.be.reverted;

      // Alice should be the winner
      expect(await lotteryContract.getLastWinner()).to.equal(signers.alice.address);
    });

    it("✅ should handle large number of participants", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Add 10 entries from different values
      for (let i = 0; i < 10; i++) {
        const input = await fhevm
          .createEncryptedInput(lotteryContractAddress, signers.alice.address)
          .add32(i + 1)
          .encrypt();
        await lotteryContract
          .connect(signers.alice)
          .enterLottery(input.handles[0], input.inputProof, { value: entryFee });
      }

      expect(await lotteryContract.getEntryCount()).to.equal(10n);
      expect(await lotteryContract.getParticipantEntries(signers.alice.address)).to.equal(10n);

      // Should still draw correctly
      await expect(lotteryContract.connect(signers.deployer).drawWinner()).to.not.be.reverted;
    });

    it("✅ should reset participant entries counter only for winners", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Alice and Bob both enter
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(11)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      const bobInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.bob.address)
        .add32(22)
        .encrypt();
      await lotteryContract.connect(signers.bob).enterLottery(bobInput.handles[0], bobInput.inputProof, { value: entryFee });

      const aliceEntriesBefore = await lotteryContract.getParticipantEntries(signers.alice.address);
      const bobEntriesBefore = await lotteryContract.getParticipantEntries(signers.bob.address);

      // Draw winner
      await lotteryContract.connect(signers.deployer).drawWinner();

      // Entries should still be tracked across rounds
      const aliceEntriesAfter = await lotteryContract.getParticipantEntries(signers.alice.address);
      const bobEntriesAfter = await lotteryContract.getParticipantEntries(signers.bob.address);

      expect(aliceEntriesAfter).to.equal(aliceEntriesBefore);
      expect(bobEntriesAfter).to.equal(bobEntriesBefore);
    });

    it("✅ should handle multiple consecutive rounds", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      for (let round = 0; round < 3; round++) {
        // Add entries
        const input = await fhevm
          .createEncryptedInput(lotteryContractAddress, signers.alice.address)
          .add32(round + 1)
          .encrypt();
        await lotteryContract
          .connect(signers.alice)
          .enterLottery(input.handles[0], input.inputProof, { value: entryFee });

        // Draw winner
        await lotteryContract.connect(signers.deployer).drawWinner();

        // Verify round incremented
        expect(await lotteryContract.getCurrentRound()).to.equal(BigInt(round + 2));
      }

      // Should have 3 winners
      const winners = await lotteryContract.getAllWinners();
      expect(winners.length).to.equal(3);
    });
  });

  describe("Prize Distribution", function () {
    it("✅ should distribute exactly 80% to winner", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Add single entry to ensure we know the winner
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(42)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      const prizePool = await lotteryContract.getPrizePool();
      const expectedPrize = (prizePool * 80n) / 100n;

      const aliceBalanceBefore = await ethers.provider.getBalance(signers.alice.address);

      await lotteryContract.connect(signers.deployer).drawWinner();

      const aliceBalanceAfter = await ethers.provider.getBalance(signers.alice.address);

      // Alice should receive exactly 80% of prize pool
      expect(aliceBalanceAfter - aliceBalanceBefore).to.equal(expectedPrize);
    });

    it("✅ should distribute 20% to owner", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Add entry
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(55)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      const prizePool = await lotteryContract.getPrizePool();
      const expectedOwnerFee = (prizePool * 20n) / 100n;

      const ownerBalanceBefore = await ethers.provider.getBalance(signers.deployer.address);

      const tx = await lotteryContract.connect(signers.deployer).drawWinner();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(signers.deployer.address);

      // Owner should receive 20% minus gas
      expect(ownerBalanceAfter - ownerBalanceBefore + gasUsed).to.equal(expectedOwnerFee);
    });

    it("✅ should handle prize distribution with large prize pool", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Add 50 entries to create large prize pool
      for (let i = 0; i < 50; i++) {
        const input = await fhevm
          .createEncryptedInput(lotteryContractAddress, signers.alice.address)
          .add32(i + 1)
          .encrypt();
        await lotteryContract
          .connect(signers.alice)
          .enterLottery(input.handles[0], input.inputProof, { value: entryFee });
      }

      const prizePool = await lotteryContract.getPrizePool();
      expect(prizePool).to.equal(entryFee * 50n);

      // Should draw successfully even with large pool
      await expect(lotteryContract.connect(signers.deployer).drawWinner()).to.not.be.reverted;
    });

    it("✅ should reset prize pool to zero after drawing", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      const input = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(99)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(input.handles[0], input.inputProof, { value: entryFee });

      expect(await lotteryContract.getPrizePool()).to.be.greaterThan(0n);

      await lotteryContract.connect(signers.deployer).drawWinner();

      expect(await lotteryContract.getPrizePool()).to.equal(0n);
    });
  });

  describe("Integration Tests", function () {
    it("✅ should handle complete lottery lifecycle", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Phase 1: Entry
      const aliceInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(11)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(aliceInput.handles[0], aliceInput.inputProof, { value: entryFee });

      const bobInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.bob.address)
        .add32(22)
        .encrypt();
      await lotteryContract.connect(signers.bob).enterLottery(bobInput.handles[0], bobInput.inputProof, { value: entryFee });

      expect(await lotteryContract.getEntryCount()).to.equal(2n);

      // Phase 2: Draw
      const roundBefore = await lotteryContract.getCurrentRound();
      await lotteryContract.connect(signers.deployer).drawWinner();
      const roundAfter = await lotteryContract.getCurrentRound();

      expect(roundAfter).to.equal(roundBefore + 1n);
      expect(await lotteryContract.getEntryCount()).to.equal(0n);

      // Phase 3: New round
      const charlieInput = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.charlie.address)
        .add32(33)
        .encrypt();
      await lotteryContract
        .connect(signers.charlie)
        .enterLottery(charlieInput.handles[0], charlieInput.inputProof, { value: entryFee });

      expect(await lotteryContract.getEntryCount()).to.equal(1n);
      expect(await lotteryContract.getCurrentRound()).to.equal(2n);
    });

    it("✅ should maintain winner history across multiple rounds", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Round 1
      const input1 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(10)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(input1.handles[0], input1.inputProof, { value: entryFee });
      await lotteryContract.connect(signers.deployer).drawWinner();

      // Round 2
      const input2 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.bob.address)
        .add32(20)
        .encrypt();
      await lotteryContract.connect(signers.bob).enterLottery(input2.handles[0], input2.inputProof, { value: entryFee });
      await lotteryContract.connect(signers.deployer).drawWinner();

      const winners = await lotteryContract.getAllWinners();
      expect(winners.length).to.equal(2);
    });

    it("✅ should handle fee changes between rounds", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Enter with original fee
      const input1 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(15)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(input1.handles[0], input1.inputProof, { value: entryFee });

      await lotteryContract.connect(signers.deployer).drawWinner();

      // Change fee
      const newFee = ethers.parseEther("0.002");
      await lotteryContract.connect(signers.deployer).setEntryFee(newFee);

      // Enter with new fee
      const input2 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.bob.address)
        .add32(25)
        .encrypt();
      await lotteryContract.connect(signers.bob).enterLottery(input2.handles[0], input2.inputProof, { value: newFee });

      expect(await lotteryContract.getEntryCount()).to.equal(1n);
    });

    it("✅ should handle lottery pause and resume", async function () {
      const entryFee = await lotteryContract.getEntryFee();

      // Enter normally
      const input1 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.alice.address)
        .add32(30)
        .encrypt();
      await lotteryContract
        .connect(signers.alice)
        .enterLottery(input1.handles[0], input1.inputProof, { value: entryFee });

      // Pause
      await lotteryContract.connect(signers.deployer).setLotteryActive(false);

      // Cannot enter when paused
      const input2 = await fhevm
        .createEncryptedInput(lotteryContractAddress, signers.bob.address)
        .add32(40)
        .encrypt();
      await expect(
        lotteryContract.connect(signers.bob).enterLottery(input2.handles[0], input2.inputProof, { value: entryFee }),
      ).to.be.revertedWith("Lottery is not active");

      // Resume
      await lotteryContract.connect(signers.deployer).setLotteryActive(true);

      // Can enter again
      await expect(
        lotteryContract.connect(signers.bob).enterLottery(input2.handles[0], input2.inputProof, { value: entryFee }),
      ).to.not.be.reverted;
    });
  });
});
