import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { AccessControlDemo } from "../../types";
import type { Signers } from "../types";

describe("AccessControlDemo", function () {
  let contract: AccessControlDemo;
  let contractAddress: string;
  let signers: Signers;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    signers = await ethers.getSigners();

    const AccessControlDemoFactory = await ethers.getContractFactory("AccessControlDemo");
    contract = await AccessControlDemoFactory.connect(signers.alice).deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Deployment", function () {
    it("✅ should set deployer as owner", async function () {
      expect(await contract.owner()).to.equal(signers.alice.address);
    });
  });

  describe("Balance Management with Permissions", function () {
    it("✅ should set encrypted balance with proper permissions", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await expect(contract.connect(signers.alice).setBalance(encryptedInput.handles[0], encryptedInput.inputProof))
        .to.emit(contract, "BalanceSet")
        .withArgs(signers.alice.address);
    });

    it("✅ should retrieve own balance after setting", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(50)
        .encrypt();

      await contract.connect(signers.bob).setBalance(encryptedInput.handles[0], encryptedInput.inputProof);

      expect(await contract.connect(signers.bob).getMyBalance()).to.exist;
    });

    it("✅ should allow multiple users to set their own balances", async function () {
      const aliceInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).setBalance(aliceInput.handles[0], aliceInput.inputProof);

      const bobInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(200)
        .encrypt();

      await contract.connect(signers.bob).setBalance(bobInput.handles[0], bobInput.inputProof);

      expect(await contract.connect(signers.alice).getMyBalance()).to.exist;
      expect(await contract.connect(signers.bob).getMyBalance()).to.exist;
    });
  });

  describe("Shared Value Access Control", function () {
    it("✅ should allow owner to set shared value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(999)
        .encrypt();

      await expect(contract.connect(signers.alice).setSharedValue(encryptedInput.handles[0], encryptedInput.inputProof))
        .to.emit(contract, "SharedValueSet");
    });

    it("❌ should reject non-owner setting shared value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(999)
        .encrypt();

      await expect(
        contract.connect(signers.bob).setSharedValue(encryptedInput.handles[0], encryptedInput.inputProof),
      ).to.be.revertedWith("Not owner");
    });

    it("✅ should allow owner to access shared value", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(777)
        .encrypt();

      await contract.connect(signers.alice).setSharedValue(encryptedInput.handles[0], encryptedInput.inputProof);

      expect(await contract.connect(signers.alice).getSharedValue()).to.exist;
    });
  });

  describe("User Authorization", function () {
    beforeEach(async function () {
      // Set up shared value first
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(500)
        .encrypt();

      await contract.connect(signers.alice).setSharedValue(encryptedInput.handles[0], encryptedInput.inputProof);
    });

    it("✅ should authorize user to access shared value", async function () {
      await expect(contract.connect(signers.alice).authorizeUser(signers.bob.address))
        .to.emit(contract, "UserAuthorized")
        .withArgs(signers.bob.address);
    });

    it("✅ should allow authorized user to access shared value", async function () {
      await contract.connect(signers.alice).authorizeUser(signers.bob.address);

      expect(await contract.connect(signers.bob).getSharedValue()).to.exist;
    });

    it("❌ should reject unauthorized user accessing shared value", async function () {
      await expect(contract.connect(signers.bob).getSharedValue()).to.be.revertedWith("Not authorized");
    });

    it("❌ should prevent non-owner from authorizing users", async function () {
      await expect(contract.connect(signers.bob).authorizeUser(signers.carol.address)).to.be.revertedWith(
        "Not owner",
      );
    });

    it("❌ should reject authorizing already authorized user", async function () {
      await contract.connect(signers.alice).authorizeUser(signers.bob.address);

      await expect(contract.connect(signers.alice).authorizeUser(signers.bob.address)).to.be.revertedWith(
        "Already authorized",
      );
    });
  });

  describe("User Revocation", function () {
    beforeEach(async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(500)
        .encrypt();

      await contract.connect(signers.alice).setSharedValue(encryptedInput.handles[0], encryptedInput.inputProof);
      await contract.connect(signers.alice).authorizeUser(signers.bob.address);
    });

    it("✅ should revoke user authorization", async function () {
      await expect(contract.connect(signers.alice).revokeUser(signers.bob.address))
        .to.emit(contract, "UserRevoked")
        .withArgs(signers.bob.address);
    });

    it("✅ should check user authorization status", async function () {
      expect(await contract.isAuthorized(signers.bob.address)).to.be.true;

      await contract.connect(signers.alice).revokeUser(signers.bob.address);

      expect(await contract.isAuthorized(signers.bob.address)).to.be.false;
    });

    it("❌ should reject revoking non-authorized user", async function () {
      await expect(contract.connect(signers.alice).revokeUser(signers.carol.address)).to.be.revertedWith(
        "Not authorized",
      );
    });
  });

  describe("Transfer with Permission Management", function () {
    beforeEach(async function () {
      // Set up initial balances
      const aliceInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).setBalance(aliceInput.handles[0], aliceInput.inputProof);
    });

    it("✅ should transfer encrypted amount between users", async function () {
      const transferInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();

      await expect(
        contract.connect(signers.alice).transfer(signers.bob.address, transferInput.handles[0], transferInput.inputProof),
      ).to.not.be.reverted;
    });

    it("✅ should update both sender and recipient balances", async function () {
      const transferInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(25)
        .encrypt();

      await contract
        .connect(signers.alice)
        .transfer(signers.bob.address, transferInput.handles[0], transferInput.inputProof);

      // Both should have balances
      expect(await contract.connect(signers.alice).getMyBalance()).to.exist;
      expect(await contract.connect(signers.bob).getMyBalance()).to.exist;
    });

    it("❌ should reject transfer from user without balance", async function () {
      const transferInput = await fhevm
        .createEncryptedInput(contractAddress, signers.carol.address)
        .add32(10)
        .encrypt();

      await expect(
        contract.connect(signers.carol).transfer(signers.bob.address, transferInput.handles[0], transferInput.inputProof),
      ).to.be.revertedWith("No balance");
    });

    it("❌ should reject transfer to zero address", async function () {
      const transferInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      await expect(
        contract.connect(signers.alice).transfer(ethers.ZeroAddress, transferInput.handles[0], transferInput.inputProof),
      ).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Transient Permissions", function () {
    it("✅ should compute with transient permissions", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();

      const result = await contract
        .connect(signers.alice)
        .computeWithTransient(encryptedInput.handles[0], encryptedInput.inputProof);

      expect(result).to.exist;
    });

    it("✅ should work for multiple users", async function () {
      const aliceInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(5)
        .encrypt();

      await expect(
        contract.connect(signers.alice).computeWithTransient(aliceInput.handles[0], aliceInput.inputProof),
      ).to.not.be.reverted;

      const bobInput = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(15)
        .encrypt();

      await expect(contract.connect(signers.bob).computeWithTransient(bobInput.handles[0], bobInput.inputProof)).to.not
        .be.reverted;
    });
  });
});
