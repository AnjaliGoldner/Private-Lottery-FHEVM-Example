import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("deploy-lottery", "Deploy the Private Lottery contract")
  .addOptionalParam("fee", "Entry fee in ether", "0.001")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("Deploying Private Lottery contract...");

    const factory = await hre.ethers.getContractFactory("PrivateLottery");
    const lottery = await factory.deploy();

    await lottery.waitForDeployment();
    const address = await lottery.getAddress();

    console.log("✅ Private Lottery deployed to:", address);
    console.log("Initial entry fee:", hre.ethers.parseEther(taskArgs.fee).toString(), "wei");
    console.log("Owner:", await lottery.owner());
    console.log("Is active:", await lottery.isLotteryActive());
    console.log("Current round:", (await lottery.getCurrentRound()).toString());
  });

task("get-lottery-status", "Get current lottery status")
  .addParam("address", "Lottery contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const lottery = await hre.ethers.getContractAt("PrivateLottery", taskArgs.address);

    const status = {
      owner: await lottery.owner(),
      isActive: await lottery.isLotteryActive(),
      currentRound: (await lottery.getCurrentRound()).toString(),
      entryFee: (await lottery.getEntryFee()).toString(),
      prizePool: hre.ethers.formatEther(await lottery.getPrizePool()),
      entryCount: (await lottery.getEntryCount()).toString(),
    };

    console.log("\n📊 Lottery Status:");
    console.log("─────────────────────────");
    console.log("Owner:", status.owner);
    console.log("Is Active:", status.isActive);
    console.log("Current Round:", status.currentRound);
    console.log("Entry Fee:", hre.ethers.formatEther(status.entryFee), "ETH");
    console.log("Prize Pool:", status.prizePool, "ETH");
    console.log("Entry Count:", status.entryCount);
    console.log("─────────────────────────\n");
  });

task("get-winners", "Get all past winners")
  .addParam("address", "Lottery contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const lottery = await hre.ethers.getContractAt("PrivateLottery", taskArgs.address);

    const winners = await lottery.getAllWinners();

    if (winners.length === 0) {
      console.log("No winners yet");
      return;
    }

    console.log("\n🏆 Winners History:");
    console.log("─────────────────────────");
    winners.forEach((winner, index) => {
      console.log(`\nRound ${index + 1}:`);
      console.log("  Winner:", winner.winner);
      console.log("  Prize:", hre.ethers.formatEther(winner.prize), "ETH");
      console.log("  Winning Numbers:", `${winner.num1}-${winner.num2}-${winner.num3}`);
      console.log("  Timestamp:", new Date(Number(winner.timestamp) * 1000).toISOString());
    });
    console.log("─────────────────────────\n");
  });

task("get-participant-info", "Get participant information")
  .addParam("address", "Lottery contract address")
  .addParam("participant", "Participant address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const lottery = await hre.ethers.getContractAt("PrivateLottery", taskArgs.address);

    const entries = await lottery.getParticipantEntries(taskArgs.participant);
    const hasWon = await lottery.hasParticipantWon(taskArgs.participant);

    console.log("\n👤 Participant Information:");
    console.log("─────────────────────────");
    console.log("Address:", taskArgs.participant);
    console.log("Total Entries:", entries.toString());
    console.log("Has Won:", hasWon ? "✅ Yes" : "❌ No");
    console.log("─────────────────────────\n");
  });

task("set-entry-fee", "Set the lottery entry fee")
  .addParam("address", "Lottery contract address")
  .addParam("fee", "New entry fee in ether")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const signer = await hre.ethers.getSigners();
    const lottery = await hre.ethers.getContractAt("PrivateLottery", taskArgs.address, signer[0]);

    const newFee = hre.ethers.parseEther(taskArgs.fee);
    console.log("Setting entry fee to:", taskArgs.fee, "ETH");

    const tx = await lottery.setEntryFee(newFee);
    await tx.wait();

    console.log("✅ Entry fee updated successfully");
    console.log("New fee:", hre.ethers.formatEther(await lottery.getEntryFee()), "ETH");
  });

task("toggle-lottery", "Toggle lottery active status")
  .addParam("address", "Lottery contract address")
  .addOptionalParam("active", "True to activate, false to deactivate", "true")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const signer = await hre.ethers.getSigners();
    const lottery = await hre.ethers.getContractAt("PrivateLottery", taskArgs.address, signer[0]);

    const shouldActivate = taskArgs.active === "true";
    console.log(shouldActivate ? "Activating lottery..." : "Deactivating lottery...");

    const tx = await lottery.setLotteryActive(shouldActivate);
    await tx.wait();

    const isActive = await lottery.isLotteryActive();
    console.log("✅ Lottery status updated");
    console.log("Is Active:", isActive ? "✅ Yes" : "❌ No");
  });

task("emergency-withdraw", "Perform emergency withdrawal")
  .addParam("address", "Lottery contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const signer = await hre.ethers.getSigners();
    const lottery = await hre.ethers.getContractAt("PrivateLottery", taskArgs.address, signer[0]);

    console.log("⚠️  Performing emergency withdrawal...");

    const balanceBefore = await hre.ethers.provider.getBalance(signer[0].address);
    const tx = await lottery.emergencyWithdraw();
    const receipt = await tx.wait();
    const balanceAfter = await hre.ethers.provider.getBalance(signer[0].address);

    const gasUsed = (receipt?.gasUsed || 0n) * (receipt?.gasPrice || 0n);
    const withdrawn = balanceAfter - balanceBefore + gasUsed;

    console.log("✅ Emergency withdrawal completed");
    console.log("Withdrawn:", hre.ethers.formatEther(withdrawn), "ETH");
  });
