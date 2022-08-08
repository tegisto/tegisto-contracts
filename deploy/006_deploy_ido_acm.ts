import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';
import {TokenPublicSale} from '../typechain';
import exec from '../utils/exec';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer, extra1} = await hre.getNamedAccounts();
  const chainId = parseInt(await hre.getChainId());

  // these addresses should be coming from deployed original contracts on production
  let acmAddress = '';
  let tgsAddress = '';
  if ([31337, 44787].includes(chainId)) {
    acmAddress = (await hre.deployments.get('AcmeToken')).address;
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
    startDate = ~~(+new Date('2022-08-08T10:00:00Z') / 1000);
    whitelistEndDate = startDate;
    endDate = startDate + 60 * 60 * 10;
  }

  if (startDate === 0 || acmAddress === '' || tgsAddress === '') {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const deployResult: DeployResult = await deploy('AcmeSale', {
    contract: 'TokenPublicSale',
    from: deployer,
    args: [
      acmAddress, // address _token,
      tgsAddress, // address _buyCurrency,
      startDate, // uint256 _startDate,
      whitelistEndDate, // uint256 _whitelistEndDate,
      endDate, // uint256 _endDate,
      200, // uint256 _exchangeRate,
      parseEther('5000'), // uint256 _minBuyAmount,
      parseEther('1000000'), // uint256 _maxBuyAmount
      parseEther('5000000'), // uint256 _maxWhitelistedBuyAmount
      60 * 60 * 24 * 3, // uint256 _releaseDuration,
      10 * 60, // uint256 _releaseInterval
      hre.ethers.utils.solidityKeccak256(['string'], ['AcmeSale']),
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const contract: TokenPublicSale = await hre.ethers.getContract('AcmeSale', deployer);
  const id = await contract.idoId();
  console.log(id);
  console.log(extra1);
  await exec('WHITELISTER_ROLE', contract.grantRole(await contract.WHITELISTER_ROLE(), extra1));
};

export default func;
func.id = 'deploy_ido_acm'; // id required to prevent reexecution
func.tags = ['AcmeSale'];
