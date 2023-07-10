import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';
import {ERC20, SimpleVesting} from '../typechain';
import exec from '../utils/exec';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, log} = hre.deployments;
  const {deployer, extra1} = await hre.getNamedAccounts();
  const chainId = parseInt(await hre.getChainId());

  const acmToken: ERC20 = await hre.ethers.getContract('AcmeToken', deployer);

  const deployResult: DeployResult = await deploy('SimpleVestingAcme', {
    contract: 'SimpleVesting',
    from: deployer,
    args: [
      acmToken.address, // address _token,
      'SimpleVestingAcme', // idoName
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const contract: SimpleVesting = await hre.ethers.getContract('SimpleVestingAcme', deployer);
  const id = await contract.idoId();
  console.log({id});
  await exec('BACKEND_ROLE', contract.grantRole(await contract.BACKEND_ROLE(), extra1));

  if (deployResult.newlyDeployed || true) {
    await exec('Release time 1', contract.addReleaseInfo(epoch('2022-09-02T12:00:00Z'), 50));
    await exec('Release time 2', contract.addReleaseInfo(epoch('2022-09-02T12:30:00Z'), 80));
    await exec('Release time 3', contract.addReleaseInfo(epoch('2022-09-02T13:00:00Z'), 100));
    await exec('send token', acmToken.transfer(contract.address, parseEther('200')));
  }
};

function epoch(dateStr: string): number {
  return ~~(+new Date(dateStr) / 1000);
}

export default func;
func.id = 'deploy_simple_vesting_acm'; // id required to prevent reexecution
func.tags = ['SimpleVestingAcme'];
