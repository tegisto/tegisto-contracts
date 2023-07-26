import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';
import * as contracts from '../typechain';
import keypress from '../utils/keypress';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer} = await hre.getNamedAccounts();

  let deployResult: DeployResult | null = null;
  const chainId = parseInt(await hre.getChainId());
  if ([2222].includes(chainId)) {
    // On kava, there will be no fee
    deployResult = await deploy('DexFactory', {
      contract: 'DexNoFeeFactory',
      from: deployer,
      args: [deployer],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
  } else {
    deployResult = await deploy('DexFactory', {
      contract: 'DexFactory',
      from: deployer,
      args: [deployer],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
  }

  const factory = (await hre.ethers.getContract('DexFactory')) as contracts.DexFactory;
  const init_code_hash = await factory.INIT_CODE_PAIR_HASH();
  console.log('INIT_CODE_PAIR_HASH = ', init_code_hash);
  console.log('Please update Library code with init code pair hash \n    at src/periphery/liraries/DexLibrary.sol:24');
  console.log('Press any key to continue...');
  await keypress();
};

export default func;
func.id = 'deploy_dex_factory'; // id required to prevent reexecution
func.tags = ['DexFactory'];
