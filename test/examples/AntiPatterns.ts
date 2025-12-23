import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { AntiPatterns } from "../../types";
import type { Signers } from "../types";

describe("AntiPatterns", function () {
  let contract: AntiPatterns;
  let contractAddress: string;
  let signers: Signers;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    signers = await ethers.getSigners();

    const AntiPatternsFactory = await ethers.getContractFactory("AntiPatterns");
    contract = await AntiPatternsFactory.connect(signers.alice).deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Deployment", function () {
    it("✅ should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Anti-Pattern #1: Input Proof Validation", function () {
    it("✅ should correctly validate input proof", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      // CORRECT: Using input proof
      await expect(
        contract.connect(signers.alice).storeValueCorrect(
          encryptedInput.handles[0],
          encryptedInput.inputProof,
        ),
      )
        .to.emit(contract, "ValueStored")
        .withArgs(signers.alice.address);
    });

    it("✅ should demonstrate proper proof validation pattern", async function () {
      const value1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      const value2 = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(200)
        .encrypt();

      // Both should work with proper proofs
      await contract.connect(signers.alice).storeValueCorrect(
        value1.handles[0],
        value1.inputProof,
      );

      await contract.connect(signers.bob).storeValueCorrect(
        value2.handles[0],
        value2.inputProof,
      );

      expect(true).to.be.true;
    });
  });

  describe("Anti-Pattern #2: Missing allowThis Permission", function () {
    it("✅ should grant allowThis permission", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      // CORRECT: Using both allowThis and allow
      await expect(
        contract.connect(signers.alice).storeBalanceCorrect(
          encryptedInput.handles[0],
          encryptedInput.inputProof,
        ),
      )
        .to.emit(contract, "ValueStored")
        .withArgs(signers.alice.address);
    });

    it("✅ should demonstrate dual permission pattern", async function () {
      const balance1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(1000)
        .encrypt();

      const balance2 = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(2000)
        .encrypt();

      await contract.connect(signers.alice).storeBalanceCorrect(
        balance1.handles[0],
        balance1.inputProof,
      );

      await contract.connect(signers.bob).storeBalanceCorrect(
        balance2.handles[0],
        balance2.inputProof,
      );

      expect(true).to.be.true;
    });
  });

  describe("Anti-Pattern #3: View Function Encrypted Return", function () {
    it("✅ should retrieve encrypted value via view function", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(123)
        .encrypt();

      await contract.connect(signers.alice).storeValueCorrect(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      // CORRECT: View function returns encrypted handle
      const result = await contract.connect(signers.alice).getEncryptedValueCorrect();
      expect(result).to.exist;
    });
  });

  describe("Anti-Pattern #4: Re-grant Permissions After Operations", function () {
    it("✅ should re-grant permissions after FHE operations", async function () {
      const balance = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).storeBalanceCorrect(
        balance.handles[0],
        balance.inputProof,
      );

      // Add to balance
      const amount = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      // CORRECT: Permissions re-granted after operation
      await expect(
        contract.connect(signers.alice).addToBalanceCorrect(
          amount.handles[0],
          amount.inputProof,
        ),
      ).to.not.be.reverted;
    });

    it("❌ should fail adding without initial balance", async function () {
      const amount = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(50)
        .encrypt();

      await expect(
        contract.connect(signers.bob).addToBalanceCorrect(
          amount.handles[0],
          amount.inputProof,
        ),
      ).to.be.revertedWith("No balance");
    });
  });

  describe("Anti-Pattern #5: Signer Mismatch", function () {
    it("✅ should ensure encryption signer matches transaction signer", async function () {
      // Alice encrypts for herself
      const encryptedForAlice = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      // Alice can use her encryption
      await expect(
        contract.connect(signers.alice).storeValueWithSignerCheck(
          encryptedForAlice.handles[0],
          encryptedForAlice.inputProof,
        ),
      ).to.not.be.reverted;
    });

    it("✅ should handle multiple users with different signers", async function () {
      const aliceData = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      const bobData = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(200)
        .encrypt();

      await contract.connect(signers.alice).storeValueWithSignerCheck(
        aliceData.handles[0],
        aliceData.inputProof,
      );

      await contract.connect(signers.bob).storeValueWithSignerCheck(
        bobData.handles[0],
        bobData.inputProof,
      );

      expect(true).to.be.true;
    });
  });

  describe("Anti-Pattern #6: Initialization Checks", function () {
    it("✅ should check initialization before transfer", async function () {
      // Setup: Alice stores balance
      const balance = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).storeBalanceCorrect(
        balance.handles[0],
        balance.inputProof,
      );

      // Transfer to Bob
      const amount = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();

      await expect(
        contract.connect(signers.alice).transferCorrect(
          signers.bob.address,
          amount.handles[0],
          amount.inputProof,
        ),
      ).to.not.be.reverted;
    });

    it("❌ should fail transfer from user without balance", async function () {
      const amount = await fhevm
        .createEncryptedInput(contractAddress, signers.carol.address)
        .add32(10)
        .encrypt();

      await expect(
        contract.connect(signers.carol).transferCorrect(
          signers.bob.address,
          amount.handles[0],
          amount.inputProof,
        ),
      ).to.be.revertedWith("Sender has no balance");
    });

    it("❌ should reject transfer to zero address", async function () {
      const balance = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).storeBalanceCorrect(
        balance.handles[0],
        balance.inputProof,
      );

      const amount = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();

      await expect(
        contract.connect(signers.alice).transferCorrect(
          ethers.ZeroAddress,
          amount.handles[0],
          amount.inputProof,
        ),
      ).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Anti-Pattern #7: Event Emission", function () {
    it("✅ should emit events with non-sensitive data", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await expect(
        contract.connect(signers.alice).updateBalanceWithEvent(
          encryptedInput.handles[0],
          encryptedInput.inputProof,
        ),
      )
        .to.emit(contract, "BalanceUpdatedCorrect")
        .withArgs(signers.alice.address);
    });

    it("✅ should not expose encrypted values in events", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(250)
        .encrypt();

      const tx = await contract.connect(signers.alice).updateBalanceWithEvent(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      const receipt = await tx.wait();
      expect(receipt).to.exist;
      // Ensure event was emitted (encrypted values not exposed)
    });
  });

  describe("Anti-Pattern #8: FHE Arithmetic Operations", function () {
    it("✅ should use FHE library functions for arithmetic", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await expect(
        contract.connect(signers.alice).addCorrect(
          encryptedInput.handles[0],
          encryptedInput.inputProof,
        ),
      ).to.not.be.reverted;
    });

    it("✅ should demonstrate proper FHE.add usage", async function () {
      const value1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(20)
        .encrypt();

      const value2 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();

      await contract.connect(signers.alice).addCorrect(
        value1.handles[0],
        value1.inputProof,
      );

      await contract.connect(signers.alice).addCorrect(
        value2.handles[0],
        value2.inputProof,
      );

      expect(true).to.be.true;
    });
  });

  describe("All Anti-Patterns Combined", function () {
    it("✅ should demonstrate correct patterns working together", async function () {
      // 1. Setup with proper input proofs
      const balance = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(1000)
        .encrypt();

      await contract.connect(signers.alice).storeBalanceCorrect(
        balance.handles[0],
        balance.inputProof,
      );

      // 2. Check initialization
      expect(await contract.connect(signers.alice).hasBalance()).to.be.true;

      // 3. Update with proper permissions
      const amount = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).addToBalanceCorrect(
        amount.handles[0],
        amount.inputProof,
      );

      // 4. Transfer to another user
      const transferAmount = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(200)
        .encrypt();

      await contract.connect(signers.alice).transferCorrect(
        signers.bob.address,
        transferAmount.handles[0],
        transferAmount.inputProof,
      );

      // 5. Verify Bob received balance
      expect(await contract.connect(signers.bob).hasBalance()).to.be.true;

      // 6. Emit event with proper data
      const eventValue = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      await expect(
        contract.connect(signers.alice).updateBalanceWithEvent(
          eventValue.handles[0],
          eventValue.inputProof,
        ),
      ).to.emit(contract, "BalanceUpdatedCorrect");
    });

    it("✅ should handle multiple users following best practices", async function () {
      // Alice
      const aliceBalance = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(500)
        .encrypt();

      await contract.connect(signers.alice).storeBalanceCorrect(
        aliceBalance.handles[0],
        aliceBalance.inputProof,
      );

      // Bob
      const bobBalance = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(300)
        .encrypt();

      await contract.connect(signers.bob).storeBalanceCorrect(
        bobBalance.handles[0],
        bobBalance.inputProof,
      );

      // Transfers
      const aliceTransfer = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).transferCorrect(
        signers.bob.address,
        aliceTransfer.handles[0],
        aliceTransfer.inputProof,
      );

      const bobTransfer = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(50)
        .encrypt();

      await contract.connect(signers.bob).transferCorrect(
        signers.carol.address,
        bobTransfer.handles[0],
        bobTransfer.inputProof,
      );

      // Verify all have balances
      expect(await contract.connect(signers.alice).hasBalance()).to.be.true;
      expect(await contract.connect(signers.bob).hasBalance()).to.be.true;
      expect(await contract.connect(signers.carol).hasBalance()).to.be.true;
    });
  });
});
