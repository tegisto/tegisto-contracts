import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer} = await hre.getNamedAccounts();

  const deployResult: DeployResult = await deploy('WETH9', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

export default func;
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const chainId = parseInt(await hre.getChainId());
  return [31337, 42220, 44787].includes(chainId) == false;
};
func.id = 'deploy_weth'; // id required to prevent reexecution
func.tags = ['WETH'];
