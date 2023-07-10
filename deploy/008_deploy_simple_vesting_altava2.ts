import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';
import {ERC20, SimpleVesting} from '../typechain';
import exec from '../utils/exec';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer, extra1} = await hre.getNamedAccounts();
  const chainId = parseInt(await hre.getChainId());

  const deployResult: DeployResult = await deploy('SimpleVestingAltava2', {
    contract: 'SimpleVesting',
    from: deployer,
    args: [
      '0xdebe620609674F21B1089042527F420372eA98A5', // address _token,
      'SimpleVestingAltava2', // idoName
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const contract: SimpleVesting = await hre.ethers.getContract('SimpleVestingAltava2', deployer);
  const id = await contract.idoId();
  console.log({id});

  if (deployResult.newlyDeployed) {
    await exec('BACKEND_ROLE', contract.grantRole(await contract.BACKEND_ROLE(), extra1));
    await exec('Release time 1', contract.addReleaseInfo(epoch('2022-11-16T00:01:00Z'), 20));
    await exec('Release time 2', contract.addReleaseInfo(epoch('2023-02-14T00:01:00Z'), 40));
    await exec('Release time 3', contract.addReleaseInfo(epoch('2023-05-15T00:01:00Z'), 60));
    await exec('Release time 4', contract.addReleaseInfo(epoch('2023-08-13T00:01:00Z'), 80));
    await exec('Release time 5', contract.addReleaseInfo(epoch('2023-11-11T00:01:00Z'), 100));
  }
  const aa = await contract.getReleaseInfos();
  for (const item of aa) {
    console.log('time', item.time.toString(), 'percent', item.percentage.toString());
  }
  /*await exec('Release time 1', contract.setReleaseInfo(0, epoch('2022-11-16T14:00:00Z'), 20));
  await exec('Release time 2', contract.setReleaseInfo(1, epoch('2023-02-14T00:01:00Z'), 40));
  await exec('Release time 3', contract.setReleaseInfo(2, epoch('2023-05-15T14:01:00Z'), 60));
  await exec('Release time 4', contract.setReleaseInfo(3, epoch('2023-08-13T00:01:00Z'), 80));
  await exec('Release time 5', contract.setReleaseInfo(4, epoch('2023-11-11T00:01:00Z'), 100));*/
};

function epoch(dateStr: string): number {
  return ~~(+new Date(dateStr) / 1000);
}

export default func;
func.id = 'deploy_simple_vesting_altava_2'; // id required to prevent reexecution
func.tags = ['SimpleVestingAltava2'];
