import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {ERC20} from '../typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, ethers} = hre;
  const {deployer, tertiary} = await getNamedAccounts();

  const tgsToken: ERC20 = await ethers.getContract('TGSToken', deployer);

  console.log('tertiary', tertiary);

  await deployments.deploy('StakingRewardsTegisto', {
    contract: 'StakingRewards',
    from: deployer,
    args: [
      deployer, //address _owner
      tertiary, //address _rewardsDistribution
      tgsToken.address, //address _rewardsToken
      tgsToken.address, //address _stakingToken
    ],
    log: true,
    autoMine: true,
  });
};

export default func;
/*func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const chainId = parseInt(await hre.getChainId());
  return [31337, 97, 44787].includes(chainId) == false;
};*/
func.id = 'deploy_stake'; // id required to prevent reexecution
func.tags = ['Stake'];
