import {getNamedAccounts, ethers, deployments} from 'hardhat';
import {ERC20, SimpleVesting} from '../typechain';
import exec from '../utils/exec';

async function main() {
  const {deployer, secondary, tertiary} = await getNamedAccounts();

  //const tfbxToken: ERC20 = await ethers.getContract('TFBXToken', deployer);
  const vesting: SimpleVesting = await ethers.getContract('SimpleVestingAltava2', deployer);

  console.log(deployer, (await vesting.released(deployer)).toString());

  console.log('Release Info', (await vesting.releaseInfos(1)).toString());

  //await exec('Update release info ', vesting.setReleaseInfo(1, 1676383200, 40));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
