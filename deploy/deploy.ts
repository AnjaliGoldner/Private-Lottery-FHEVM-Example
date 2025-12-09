import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy: deployContract } = hre.deployments;

  const deploymentResult = await deployContract("PrivateLottery", {
    from: deployer,
    log: true,
  });

  console.log(`PrivateLottery deployed to: ${deploymentResult.address}`);
};

deploy.tags = ["PrivateLottery"];
export default deploy;
