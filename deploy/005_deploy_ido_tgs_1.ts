import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer} = await hre.getNamedAccounts();
  const chainId = parseInt(await hre.getChainId());

  // these addresses should be coming from deployed original contracts on production
  let fakeFeedbackAddress = '';
  let fakeTegistoAddress = '';
  if ([31337, 97, 44787].includes(chainId)) {
    fakeFeedbackAddress = (await hre.deployments.get('FakeFeedback')).address;
    fakeTegistoAddress = (await hre.deployments.get('FakeTegisto')).address;
  }

  let startDate = 0;
  let whitelistEndDate = 0;
  let endDate = 0;
  if (chainId === 31337) {
    startDate = ~~(+new Date() / 1000);
    whitelistEndDate = startDate;
    endDate = startDate + 60 * 60 * 24 * 365;
  }
  if (chainId === 97 || chainId === 44787) {
    startDate = ~~(+new Date('2022-06-17T15:00:00Z') / 1000);
    whitelistEndDate = startDate + 60 * 60 * 24;
    endDate = startDate + 60 * 60 * 24 * 30;
  }

  if (startDate === 0 || fakeFeedbackAddress === '' || fakeTegistoAddress === '') {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const deployResult: DeployResult = await deploy('TegistoSaleRound1', {
    from: deployer,
    args: [
      fakeTegistoAddress, // address _token,
      fakeFeedbackAddress, // address _buyCurrency,
      startDate, // uint256 _startDate,
      whitelistEndDate, // uint256 _whitelistEndDate,
      endDate, // uint256 _endDate,
      200, // uint256 _exchangeRate,
      parseEther('1000'), // uint256 _minBuyAmount,
      parseEther('1000000'), // uint256 _maxBuyAmount
      parseEther('2000000'), // uint256 _maxWhitelistedBuyAmount
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

export default func;
func.id = 'deploy_ido_tgs_1'; // id required to prevent reexecution
func.tags = ['TegistoSaleRound1'];
