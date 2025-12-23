import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { FHECounter } from "../../types";
import type { Signers } from "../types";

describe("FHECounter", function () {
  let contract: FHECounter;
  let contractAddress: string;
  let signers: Signers;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    signers = await ethers.getSigners();

    // Deploy with initial value of 0
    const initialEncrypted = await fhevm
      .createEncryptedInput(ethers.ZeroAddress, signers.alice.address)
      .add32(0)
      .encrypt();

    const FHECounterFactory = await ethers.getContractFactory("FHECounter");
    contract = await FHECounterFactory.connect(signers.alice).deploy(
      initialEncrypted.handles[0],
      initialEncrypted.inputProof,
    );

    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Deployment", function () {
    it("✅ should deploy successfully with encrypted initial value", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Increment Operations", function () {
    it("✅ should increment counter by encrypted value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(5)
        .encrypt();

      await expect(
        contract.connect(signers.alice).increment(encryptedInput.handles[0], encryptedInput.inputProof),
      )
        .to.emit(contract, "Incremented")
        .withArgs(signers.alice.address);
    });

    it("✅ should allow multiple increments", async function () {
      const input1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await contract.connect(signers.alice).increment(input1.handles[0], input1.inputProof);

      const input2 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(15)
        .encrypt();

      await expect(contract.connect(signers.alice).increment(input2.handles[0], input2.inputProof)).to.not.be
        .reverted;
    });

    it("✅ should allow different users to increment", async function () {
      const aliceInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(5)
        .encrypt();

      await contract.connect(signers.alice).increment(aliceInput.handles[0], aliceInput.inputProof);

      const bobInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(3)
        .encrypt();

      await expect(contract.connect(signers.bob).increment(bobInput.handles[0], bobInput.inputProof)).to.not.be
        .reverted;
    });
  });

  describe("Decrement Operations", function () {
    it("✅ should decrement counter by encrypted value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(3)
        .encrypt();

      await expect(
        contract.connect(signers.alice).decrement(encryptedInput.handles[0], encryptedInput.inputProof),
      )
        .to.emit(contract, "Decremented")
        .withArgs(signers.alice.address);
    });

    it("✅ should handle increment followed by decrement", async function () {
      const incrementInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(20)
        .encrypt();

      await contract.connect(signers.alice).increment(incrementInput.handles[0], incrementInput.inputProof);

      const decrementInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(5)
        .encrypt();

      await expect(contract.connect(signers.alice).decrement(decrementInput.handles[0], decrementInput.inputProof))
        .to.not.be.reverted;
    });
  });

  describe("Permission Model", function () {
    it("✅ should grant permissions after operations", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await contract.connect(signers.alice).increment(encryptedInput.handles[0], encryptedInput.inputProof);

      // Should be able to get encrypted counter (permissions granted)
      expect(await contract.getEncryptedCounter()).to.exist;
    });
  });

  describe("Event Emission", function () {
    it("✅ should emit Incremented event with correct address", async function () {
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(1)
        .encrypt();

      await expect(contract.connect(signers.alice).increment(input.handles[0], input.inputProof))
        .to.emit(contract, "Incremented")
        .withArgs(signers.alice.address);
    });

    it("✅ should emit Decremented event with correct address", async function () {
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(1)
        .encrypt();

      await expect(contract.connect(signers.alice).decrement(input.handles[0], input.inputProof))
        .to.emit(contract, "Decremented")
        .withArgs(signers.alice.address);
    });
  });
});
