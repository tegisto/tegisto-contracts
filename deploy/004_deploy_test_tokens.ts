import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';
import {DexRouter, DexFactory, FakeFeedback, FakeTegisto} from '../typechain';
import exec from '../utils/exec';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer} = await hre.getNamedAccounts();

  console.log({deployer});

  const deployResult1: DeployResult = await deploy('FakeFeedback', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const deployResult2: DeployResult = await deploy('FakeTegisto', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const ffb: FakeFeedback = await hre.ethers.getContract('FakeFeedback', deployer);
  const tgs: FakeTegisto = await hre.ethers.getContract('FakeTegisto', deployer);
  const router: DexRouter = await hre.ethers.getContract('DexRouter', deployer);
  const factory: DexFactory = await hre.ethers.getContract('DexFactory', deployer);

  await exec('Approve FFB', ffb.approve(router.address, hre.ethers.constants.MaxUint256));
  await exec('Approve TGS', tgs.approve(router.address, hre.ethers.constants.MaxUint256));

  await exec('CreatePair FFB-FAKETGS', factory.createPair(ffb.address, tgs.address));

  await exec(
    'addLiquidity | 1M FFB  -  2.1M TGS',
    router.addLiquidity(
      ffb.address, // tokenA
      tgs.address, // tokenB
      hre.ethers.utils.parseEther('1000000'), // amountADesired
      hre.ethers.utils.parseEther('2100000'), // amountBDesired
      0, // amountAMin
      0, // amountBMin
      deployer, // to
      999000000000, // deadline
      {gasLimit: 5000000}
    )
  );
};

export default func;
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const chainId = parseInt(await hre.getChainId());
  return [31337, 97, 44787].includes(chainId) == false;
};
func.id = 'deploy_test_tokens'; // id required to prevent reexecution
func.tags = ['TestTokens'];
