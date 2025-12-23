import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { EncryptedStorage } from "../../types";
import type { Signers } from "../types";

describe("EncryptedStorage", function () {
  let contract: EncryptedStorage;
  let contractAddress: string;
  let signers: Signers;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    signers = await ethers.getSigners();

    const EncryptedStorageFactory = await ethers.getContractFactory("EncryptedStorage");
    contract = await EncryptedStorageFactory.connect(signers.alice).deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Single Value Storage - 32 bit", function () {
    it("✅ should store encrypted 32-bit value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      await expect(
        contract.connect(signers.alice).storeSingleValue32(encryptedInput.handles[0], encryptedInput.inputProof),
      )
        .to.emit(contract, "ValueStored32")
        .withArgs(signers.alice.address);
    });

    it("✅ should retrieve stored encrypted value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue32(encryptedInput.handles[0], encryptedInput.inputProof);

      expect(await contract.connect(signers.alice).getEncryptedValue32()).to.exist;
    });

    it("✅ should allow different users to store different values", async function () {
      const aliceInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue32(aliceInput.handles[0], aliceInput.inputProof);

      const bobInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(20)
        .encrypt();

      await contract.connect(signers.bob).storeSingleValue32(bobInput.handles[0], bobInput.inputProof);

      // Both should have their own values
      expect(await contract.connect(signers.alice).getEncryptedValue32()).to.exist;
      expect(await contract.connect(signers.bob).getEncryptedValue32()).to.exist;
    });
  });

  describe("Single Value Storage - 64 bit", function () {
    it("✅ should store encrypted 64-bit value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add64(1000000)
        .encrypt();

      await expect(
        contract.connect(signers.alice).storeSingleValue64(encryptedInput.handles[0], encryptedInput.inputProof),
      )
        .to.emit(contract, "ValueStored64")
        .withArgs(signers.alice.address);
    });

    it("✅ should retrieve stored encrypted 64-bit value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add64(999999999)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue64(encryptedInput.handles[0], encryptedInput.inputProof);

      expect(await contract.connect(signers.alice).getEncryptedValue64()).to.exist;
    });
  });

  describe("Multiple Values Storage", function () {
    it("✅ should store both 32-bit and 64-bit values in one transaction", async function () {
      const input32 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      const input64 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add64(1000000)
        .encrypt();

      await expect(
        contract
          .connect(signers.alice)
          .storeMultipleValues(
            input32.handles[0],
            input32.inputProof,
            input64.handles[0],
            input64.inputProof,
          ),
      )
        .to.emit(contract, "MultipleValuesStored")
        .withArgs(signers.alice.address);
    });

    it("✅ should retrieve both stored values", async function () {
      const input32 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      const input64 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add64(2000000)
        .encrypt();

      await contract
        .connect(signers.alice)
        .storeMultipleValues(input32.handles[0], input32.inputProof, input64.handles[0], input64.inputProof);

      expect(await contract.connect(signers.alice).getEncryptedValue32()).to.exist;
      expect(await contract.connect(signers.alice).getEncryptedValue64()).to.exist;
    });
  });

  describe("Value Updates", function () {
    it("✅ should add to existing encrypted value", async function () {
      // First store a value
      const initialInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue32(initialInput.handles[0], initialInput.inputProof);

      // Add to it
      const addInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(5)
        .encrypt();

      await expect(contract.connect(signers.alice).addToValue32(addInput.handles[0], addInput.inputProof)).to.not.be
        .reverted;
    });

    it("❌ should revert when adding to non-existent value", async function () {
      const addInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(5)
        .encrypt();

      await expect(
        contract.connect(signers.bob).addToValue32(addInput.handles[0], addInput.inputProof),
      ).to.be.revertedWith("No value stored");
    });
  });

  describe("Value Checking", function () {
    it("✅ should check if user has stored value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue32(encryptedInput.handles[0], encryptedInput.inputProof);

      expect(await contract.hasValue32(signers.alice.address)).to.be.true;
    });

    it("✅ should return false for user without stored value", async function () {
      expect(await contract.hasValue32(signers.bob.address)).to.be.false;
    });
  });

  describe("Permission Management", function () {
    it("✅ should grant proper permissions after storage", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(123)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue32(encryptedInput.handles[0], encryptedInput.inputProof);

      // User should be able to retrieve their encrypted value
      const retrievedValue = await contract.connect(signers.alice).getEncryptedValue32();
      expect(retrievedValue).to.exist;
    });
  });
});
