import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';
import {ERC20, SimpleVesting} from '../typechain';
import exec from '../utils/exec';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer, extra1} = await hre.getNamedAccounts();
  const chainId = parseInt(await hre.getChainId());

  const deployResult: DeployResult = await deploy('SimpleVestingAltava', {
    contract: 'SimpleVesting',
    from: deployer,
    args: [
      '0xdebe620609674F21B1089042527F420372eA98A5', // address _token,
      'SimpleVestingAltava', // idoName
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const contract: SimpleVesting = await hre.ethers.getContract('SimpleVestingAltava', deployer);
  const id = await contract.idoId();
  console.log({id});

  if (deployResult.newlyDeployed || true) {
    //await exec('BACKEND_ROLE', contract.grantRole(await contract.BACKEND_ROLE(), extra1));
    await exec('Release time 1', contract.addReleaseInfo(epoch('2022-09-17T00:05:00Z'), 100));
  }
};

function epoch(dateStr: string): number {
  return ~~(+new Date(dateStr) / 1000);
}

export default func;
func.id = 'deploy_simple_vesting_altava'; // id required to prevent reexecution
func.tags = ['SimpleVestingAltava'];
