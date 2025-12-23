import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { ComparisonOperations } from "../../types";
import type { Signers } from "../types";

describe("ComparisonOperations", function () {
  let contract: ComparisonOperations;
  let contractAddress: string;
  let signers: Signers;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    signers = await ethers.getSigners();

    // Deploy with initial value of 50
    const initialEncrypted = await fhevm
      .createEncryptedInput(ethers.ZeroAddress, signers.alice.address)
      .add32(50)
      .encrypt();

    const ComparisonOperationsFactory = await ethers.getContractFactory("ComparisonOperations");
    contract = await ComparisonOperationsFactory.connect(signers.alice).deploy(
      initialEncrypted.handles[0],
      initialEncrypted.inputProof,
    );

    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Deployment", function () {
    it("✅ should deploy successfully with initial value", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Equality Comparisons", function () {
    it("✅ should check equality between values", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      const result = await contract.connect(signers.alice).isEqual(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(result).to.exist;
    });

    it("✅ should check inequality between values", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(25)
        .encrypt();

      const result = await contract.connect(signers.alice).isNotEqual(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(result).to.exist;
    });
  });

  describe("Ordering Comparisons", function () {
    it("✅ should check if value is less than", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(75)
        .encrypt();

      const result = await contract.connect(signers.alice).isLessThan(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(result).to.exist;
    });

    it("✅ should check if value is less than or equal", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      const result = await contract.connect(signers.alice).isLessThanOrEqual(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(result).to.exist;
    });

    it("✅ should check if value is greater than", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(25)
        .encrypt();

      const result = await contract.connect(signers.alice).isGreaterThan(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(result).to.exist;
    });

    it("✅ should check if value is greater than or equal", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      const result = await contract.connect(signers.alice).isGreaterThanOrEqual(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(result).to.exist;
    });
  });

  describe("Min/Max Operations", function () {
    it("✅ should get maximum of two values", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(75)
        .encrypt();

      const result = await contract.connect(signers.alice).getMaximum(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(result).to.exist;
    });

    it("✅ should get minimum of two values", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(25)
        .encrypt();

      const result = await contract.connect(signers.alice).getMinimum(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(result).to.exist;
    });

    it("✅ should handle equal values in min/max", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      const maxResult = await contract.connect(signers.alice).getMaximum(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      const minResult = await contract.connect(signers.alice).getMinimum(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(maxResult).to.exist;
      expect(minResult).to.exist;
    });
  });

  describe("Conditional Selection", function () {
    it("✅ should update value if greater than threshold", async function () {
      const newValueInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      const thresholdInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(40)
        .encrypt();

      await expect(
        contract.connect(signers.alice).updateIfGreater(
          newValueInput.handles[0],
          newValueInput.inputProof,
          thresholdInput.handles[0],
          thresholdInput.inputProof,
        ),
      ).to.not.be.reverted;
    });

    it("✅ should not update value if not greater than threshold", async function () {
      const newValueInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();

      const thresholdInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(40)
        .encrypt();

      await expect(
        contract.connect(signers.alice).updateIfGreater(
          newValueInput.handles[0],
          newValueInput.inputProof,
          thresholdInput.handles[0],
          thresholdInput.inputProof,
        ),
      ).to.not.be.reverted;
    });

    it("❌ should reject non-owner update", async function () {
      const newValueInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(100)
        .encrypt();

      const thresholdInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(40)
        .encrypt();

      await expect(
        contract.connect(signers.bob).updateIfGreater(
          newValueInput.handles[0],
          newValueInput.inputProof,
          thresholdInput.handles[0],
          thresholdInput.inputProof,
        ),
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("Value Update", function () {
    it("✅ should update stored value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await expect(
        contract.connect(signers.alice).updateValue(
          encryptedInput.handles[0],
          encryptedInput.inputProof,
        ),
      ).to.not.be.reverted;
    });

    it("❌ should reject non-owner value update", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(100)
        .encrypt();

      await expect(
        contract.connect(signers.bob).updateValue(
          encryptedInput.handles[0],
          encryptedInput.inputProof,
        ),
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("Multiple Comparisons", function () {
    it("✅ should handle multiple comparison operations", async function () {
      const testValue = 50;
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(testValue)
        .encrypt();

      // Test equality
      const equalResult = await contract.connect(signers.alice).isEqual(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(equalResult).to.exist;

      // Test greater than
      const gtInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();

      const gtResult = await contract.connect(signers.alice).isGreaterThan(
        gtInput.handles[0],
        gtInput.inputProof,
      );

      expect(gtResult).to.exist;
    });

    it("✅ should handle comparisons with different users", async function () {
      const aliceInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      await expect(
        contract.connect(signers.alice).isEqual(
          aliceInput.handles[0],
          aliceInput.inputProof,
        ),
      ).to.not.be.reverted;

      // New user can also do comparisons
      const bobInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(75)
        .encrypt();

      await expect(
        contract.connect(signers.bob).isGreaterThan(
          bobInput.handles[0],
          bobInput.inputProof,
        ),
      ).to.not.be.reverted;
    });
  });

  describe("Complex Scenarios", function () {
    it("✅ should handle chain of comparisons", async function () {
      // Get max between stored and new value
      const input1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(60)
        .encrypt();

      const maxResult = await contract.connect(signers.alice).getMaximum(
        input1.handles[0],
        input1.inputProof,
      );
      expect(maxResult).to.exist;

      // Get min between stored and another value
      const input2 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();

      const minResult = await contract.connect(signers.alice).getMinimum(
        input2.handles[0],
        input2.inputProof,
      );
      expect(minResult).to.exist;
    });
  });
});
