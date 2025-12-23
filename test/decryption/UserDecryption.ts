import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { UserDecryption } from "../../types";
import type { Signers } from "../types";

describe("UserDecryption", function () {
  let contract: UserDecryption;
  let contractAddress: string;
  let signers: Signers;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    signers = await ethers.getSigners();

    const UserDecryptionFactory = await ethers.getContractFactory("UserDecryption");
    contract = await UserDecryptionFactory.connect(signers.alice).deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Deployment", function () {
    it("✅ should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Single Value 32-bit Decryption", function () {
    it("✅ should store 32-bit encrypted value for user decryption", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      await expect(
        contract.connect(signers.alice).storeSingleValue(
          encryptedInput.handles[0],
          encryptedInput.inputProof,
        ),
      )
        .to.emit(contract, "DataStored")
        .withArgs(signers.alice.address);
    });

    it("✅ should retrieve encrypted 32-bit value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      const retrievedValue = await contract.connect(signers.alice).getEncryptedValue32();
      expect(retrievedValue).to.exist;
    });

    it("✅ should allow multiple users to store different values", async function () {
      const aliceInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue(
        aliceInput.handles[0],
        aliceInput.inputProof,
      );

      const bobInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(20)
        .encrypt();

      await contract.connect(signers.bob).storeSingleValue(
        bobInput.handles[0],
        bobInput.inputProof,
      );

      // Each user can retrieve their own value
      expect(await contract.connect(signers.alice).getEncryptedValue32()).to.exist;
      expect(await contract.connect(signers.bob).getEncryptedValue32()).to.exist;
    });

    it("✅ should grant proper permissions for user decryption", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(123)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      // User should be able to retrieve encrypted value for off-chain decryption
      const userValue = await contract.connect(signers.alice).getEncryptedValue32();
      expect(userValue).to.exist;
    });
  });

  describe("Single Value 64-bit Decryption", function () {
    it("✅ should store 64-bit encrypted value for user decryption", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add64(1000000)
        .encrypt();

      await expect(
        contract.connect(signers.alice).storeSingleValue64(
          encryptedInput.handles[0],
          encryptedInput.inputProof,
        ),
      )
        .to.emit(contract, "DataStored")
        .withArgs(signers.alice.address);
    });

    it("✅ should retrieve encrypted 64-bit value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add64(999999999)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue64(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      const retrievedValue = await contract.connect(signers.alice).getEncryptedValue64();
      expect(retrievedValue).to.exist;
    });
  });

  describe("Multiple Values Decryption", function () {
    it("✅ should store multiple encrypted values for user decryption", async function () {
      const input32 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      const input64 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add64(1000000)
        .encrypt();

      await expect(
        contract.connect(signers.alice).storeMultipleValues(
          input32.handles[0],
          input32.inputProof,
          input64.handles[0],
          input64.inputProof,
        ),
      )
        .to.emit(contract, "MultipleValuesStored")
        .withArgs(signers.alice.address);
    });

    it("✅ should retrieve all stored encrypted values", async function () {
      const input32 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      const input64 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add64(2000000)
        .encrypt();

      await contract.connect(signers.alice).storeMultipleValues(
        input32.handles[0],
        input32.inputProof,
        input64.handles[0],
        input64.inputProof,
      );

      // Retrieve each value
      expect(await contract.connect(signers.alice).getUserBalance()).to.exist;
      expect(await contract.connect(signers.alice).getUserScore()).to.exist;
      expect(await contract.connect(signers.alice).getUserTimestamp()).to.exist;
    });

    it("✅ should handle batch storage for decryption", async function () {
      const values = [
        { input: await fhevm
            .createEncryptedInput(contractAddress, signers.alice.address)
            .add32(100)
            .encrypt() },
        { input: await fhevm
            .createEncryptedInput(contractAddress, signers.bob.address)
            .add32(200)
            .encrypt() },
        { input: await fhevm
            .createEncryptedInput(contractAddress, signers.carol.address)
            .add32(300)
            .encrypt() },
      ];

      for (let i = 0; i < values.length; i++) {
        const signer = [signers.alice, signers.bob, signers.carol][i];
        await contract.connect(signer).storeSingleValue(
          values[i].input.handles[0],
          values[i].input.inputProof,
        );
      }

      // Each user can retrieve their value
      expect(await contract.connect(signers.alice).getEncryptedValue32()).to.exist;
      expect(await contract.connect(signers.bob).getEncryptedValue32()).to.exist;
      expect(await contract.connect(signers.carol).getEncryptedValue32()).to.exist;
    });
  });

  describe("Value Updates with Decryption", function () {
    it("✅ should add to stored value and preserve decryption rights", async function () {
      // Store initial value
      const initialInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue(
        initialInput.handles[0],
        initialInput.inputProof,
      );

      // Add to value
      const addInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(5)
        .encrypt();

      await expect(
        contract.connect(signers.alice).addToValue(
          addInput.handles[0],
          addInput.inputProof,
        ),
      ).to.not.be.reverted;

      // Should still be able to retrieve updated value
      expect(await contract.connect(signers.alice).getEncryptedValue32()).to.exist;
    });

    it("❌ should reject adding to non-existent value", async function () {
      const addInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(5)
        .encrypt();

      await expect(
        contract.connect(signers.bob).addToValue(
          addInput.handles[0],
          addInput.inputProof,
        ),
      ).to.be.revertedWith("No value stored");
    });

    it("✅ should allow multiple updates before decryption", async function () {
      // Store initial value
      const initialInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue(
        initialInput.handles[0],
        initialInput.inputProof,
      );

      // Perform multiple updates
      for (let i = 0; i < 3; i++) {
        const addInput = await fhevm
          .createEncryptedInput(contractAddress, signers.alice.address)
          .add32(1)
          .encrypt();

        await contract.connect(signers.alice).addToValue(
          addInput.handles[0],
          addInput.inputProof,
        );
      }

      // Value should still be retrievable
      expect(await contract.connect(signers.alice).getEncryptedValue32()).to.exist;
    });
  });

  describe("Shared Decryption", function () {
    it("✅ should share decryption rights with another user", async function () {
      // Alice stores a value
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      // Alice shares with Bob
      await expect(contract.connect(signers.alice).shareWithUser(signers.bob.address))
        .to.not.be.reverted;
    });

    it("❌ should reject sharing with zero address", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      await expect(
        contract.connect(signers.alice).shareWithUser(ethers.ZeroAddress),
      ).to.be.revertedWith("Invalid recipient");
    });

    it("❌ should reject sharing non-existent value", async function () {
      await expect(
        contract.connect(signers.bob).shareWithUser(signers.carol.address),
      ).to.be.revertedWith("No value stored");
    });
  });

  describe("Value Existence Checks", function () {
    it("✅ should check if user has stored value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
      );

      expect(await contract.connect(signers.alice).hasValue()).to.be.true;
    });

    it("✅ should return false for user without value", async function () {
      expect(await contract.connect(signers.bob).hasValue()).to.be.false;
    });

    it("✅ should handle value existence across multiple users", async function () {
      // Alice stores value
      const aliceInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await contract.connect(signers.alice).storeSingleValue(
        aliceInput.handles[0],
        aliceInput.inputProof,
      );

      // Check status
      expect(await contract.connect(signers.alice).hasValue()).to.be.true;
      expect(await contract.connect(signers.bob).hasValue()).to.be.false;

      // Bob stores value
      const bobInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(20)
        .encrypt();

      await contract.connect(signers.bob).storeSingleValue(
        bobInput.handles[0],
        bobInput.inputProof,
      );

      // Both should now have values
      expect(await contract.connect(signers.alice).hasValue()).to.be.true;
      expect(await contract.connect(signers.bob).hasValue()).to.be.true;
    });
  });

  describe("Event Emission", function () {
    it("✅ should emit DataStored event", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      await expect(
        contract.connect(signers.alice).storeSingleValue(
          encryptedInput.handles[0],
          encryptedInput.inputProof,
        ),
      )
        .to.emit(contract, "DataStored")
        .withArgs(signers.alice.address);
    });

    it("✅ should emit MultipleValuesStored event", async function () {
      const input32 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      const input64 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add64(1000000)
        .encrypt();

      await expect(
        contract.connect(signers.alice).storeMultipleValues(
          input32.handles[0],
          input32.inputProof,
          input64.handles[0],
          input64.inputProof,
        ),
      )
        .to.emit(contract, "MultipleValuesStored")
        .withArgs(signers.alice.address);
    });
  });
});
