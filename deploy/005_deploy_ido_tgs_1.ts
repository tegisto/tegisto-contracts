import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';
import {TegistoSaleRound1} from '../typechain';
import exec from '../utils/exec';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer, extra1} = await hre.getNamedAccounts();
  const chainId = parseInt(await hre.getChainId());

  // these addresses should be coming from deployed original contracts on production
  let tfbxAddress = '';
  let tgsAddress = '';
  if ([31337, 97, 44787, 42220].includes(chainId)) {
    tfbxAddress = (await hre.deployments.get('TFBXToken')).address;
    tgsAddress = (await hre.deployments.get('TGSToken')).address;
  }

  let startDate = 0;
  let whitelistEndDate = 0;
  let endDate = 0;
  if (chainId === 31337) {
    startDate = ~~(+new Date() / 1000);
    whitelistEndDate = startDate;
    endDate = startDate + 60 * 60 * 24 * 365;
  } else {
    startDate = ~~(+new Date('2022-06-29T17:00:00Z') / 1000);
    whitelistEndDate = startDate + 60 * 60 * 1;
    endDate = startDate + 60 * 60 * 24;
  }

  if (startDate === 0 || tfbxAddress === '' || tgsAddress === '') {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const deployResult: DeployResult = await deploy('TegistoSaleRound1', {
    from: deployer,
    args: [
      tgsAddress, // address _token,
      tfbxAddress, // address _buyCurrency,
      startDate, // uint256 _startDate,
      whitelistEndDate, // uint256 _whitelistEndDate,
      endDate, // uint256 _endDate,
      200, // uint256 _exchangeRate,
      parseEther('50000'), // uint256 _minBuyAmount,
      parseEther('1000000'), // uint256 _maxBuyAmount
      parseEther('5000000'), // uint256 _maxWhitelistedBuyAmount
      60 * 60 * 24 * 30 * 6, // uint256 _releaseDuration,
      60 * 60 * 24, // uint256 _releaseInterval
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const contract: TegistoSaleRound1 = await hre.ethers.getContract('TegistoSaleRound1', deployer);
  const id = await contract.idoId();
  console.log(id);
  console.log(extra1);
  await exec('WHITELISTER_ROLE', contract.grantRole(await contract.WHITELISTER_ROLE(), extra1));
};

export default func;
func.id = 'deploy_ido_tgs_1'; // id required to prevent reexecution
func.tags = ['TegistoSaleRound1'];
