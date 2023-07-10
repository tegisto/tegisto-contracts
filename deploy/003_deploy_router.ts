import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer} = await hre.getNamedAccounts();
  const chainId = parseInt(await hre.getChainId());

  const factoryAddress = (await hre.deployments.get('DexFactory')).address;
  let wethAddress = '';
  if ([31337, 44787].includes(chainId)) {
    // local network, Celo Alfajores
    wethAddress = (await hre.deployments.get('WETH9')).address;
  } else if (chainId === 1) {
    wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // ethereum mainnet
  } else if (chainId === 56) {
    wethAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // BSC Mainnet
  } else if (chainId == 97) {
    wethAddress = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'; // BSC Testnet
  } else if (chainId === 2222) {
    wethAddress = '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b'; // KAVA Mainnet
  }
  if (wethAddress === '') {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const deployResult: DeployResult = await deploy('DexRouter', {
    from: deployer,
    args: [factoryAddress, wethAddress],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

export default func;
func.id = 'deploy_dex_router'; // id required to prevent reexecution
func.tags = ['DexRouter'];
module.exports.dependencies = ['DexFactory'];
