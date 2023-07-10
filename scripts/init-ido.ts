import {getNamedAccounts, ethers, deployments} from 'hardhat';
import {ERC20, TokenPublicSale} from '../typechain';
import exec from '../utils/exec';

async function main() {
  const {deployer, secondary, tertiary} = await getNamedAccounts();

  const acmToken: ERC20 = await ethers.getContract('AcmeToken', deployer);
  const skyToken: ERC20 = await ethers.getContract('SkynetToken', deployer);
  const tgsToken: ERC20 = await ethers.getContract('TGSToken', deployer);
  const acmeSale: TokenPublicSale = await ethers.getContract('AcmeSale', deployer);
  const skynetSale: TokenPublicSale = await ethers.getContract('SkynetSale', deployer);

  //await exec('', tegistoSale.setWhitelistEndDate(~~(+new Date('2022-06-29T10:00:00Z') / 1000)));
  //await exec('', acmeSale.setEndDate(~~(+new Date('2022-08-08T22:15:00Z') / 1000)));

  await exec('send acm', acmToken.transfer(acmeSale.address, ethers.utils.parseEther('2500000')));
  await exec('send sky', skyToken.transfer(skynetSale.address, ethers.utils.parseEther('2500000')));
  /*await exec(
    'grant white lister',
    tegistoSale.grantRole(await tegistoSale.WHITELISTER_ROLE(), '0x3cA8b100a278af02E41d07aAdA817860346DBA06')
  );*/
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
