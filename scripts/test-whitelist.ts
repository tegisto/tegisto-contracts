import {getNamedAccounts, ethers, deployments} from 'hardhat';
import {FakeFeedback, FakeTegisto, TegistoSaleRound1} from '../typechain';
import exec from '../utils/exec';

async function main() {
  const {deployer, secondary, tertiary, extra1} = await getNamedAccounts();

  await deployments.fixture();

  const ffbToken: FakeFeedback = await ethers.getContract('FakeFeedback', deployer);
  const tgsToken: FakeTegisto = await ethers.getContract('FakeTegisto', deployer);
  const tegistoSale: TegistoSaleRound1 = await ethers.getContract('TegistoSaleRound1', deployer);

  console.log('FakeFeedback: ', ffbToken.address);
  console.log('FakeTegisto: ', tgsToken.address);

  console.log(deployer);

  console.log('FFB', await ffbToken.balanceOf(deployer));
  console.log('TGS', await tgsToken.balanceOf(deployer));

  await exec('approve', ffbToken.approve(tegistoSale.address, ethers.utils.parseEther('250000')));

  await exec('send', tgsToken.transfer(tegistoSale.address, ethers.utils.parseEther('500000')));

  const idoId = await tegistoSale.idoId();
  console.log({idoId});
  const signer = await ethers.getNamedSigner('extra1');
  console.log({signer: signer.address});
  const hash = ethers.utils.solidityKeccak256(['bytes32', 'address'], [idoId, deployer]);
  const messageHashBytes = ethers.utils.arrayify(hash);
  const signature = await signer.signMessage(messageHashBytes);

  console.log(await tegistoSale.hasRole(await tegistoSale.WHITELISTER_ROLE(), extra1));

  await exec('send', tegistoSale.buyWhitelisted(ethers.utils.parseEther('50000'), signature));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
