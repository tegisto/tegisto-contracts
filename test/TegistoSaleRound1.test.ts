import {expect} from './chai-setup';
import {ethers, deployments, getNamedAccounts, getUnnamedAccounts} from 'hardhat';
import {TegistoSaleRound1, FakeFeedback, FakeTegisto} from '../typechain';
import {setupUsers} from './utils';

async function setup() {
  console.log('fixture start ------');
  await deployments.fixture(['FakeFeedback', 'FakeTegisto', 'TegistoSaleRound1']);

  const contracts = {
    tegistoSaleRound1: <TegistoSaleRound1>await ethers.getContract('TegistoSaleRound1'),
    fakeFeedback: <FakeFeedback>await ethers.getContract('FakeFeedback'),
    fakeTegisto: <FakeTegisto>await ethers.getContract('FakeTegisto'),
  };
  //const users = await setupUsers(await getUnnamedAccounts(), contracts);
  return {
    ...contracts,
    //users,
  };
}

describe('TegistoSaleRound1', function () {
  it('BuyTest', async function () {
    const {tegistoSaleRound1, fakeFeedback, fakeTegisto} = await setup();

    const {deployer, secondary} = await getNamedAccounts();
    console.log('deployer = ', deployer);
    console.log('secondary = ', secondary);
    console.log('contract = ', tegistoSaleRound1.address);

    const signature =
      '0x3e04b5d828be56214547877afa740525815a0c52ea9df0a02766c2f4db09114350fdf5109564dc3dbf6cefbe27fddcf57ef952c1de6130272b10a66a2159dbce1c';

    console.log('deployer (FFB) = ', (await fakeFeedback.balanceOf(deployer)).toString());
    await fakeFeedback.connect(await ethers.getSigner(deployer)).transfer(secondary, 1000);
    console.log('secondary (FFB) = ', (await fakeFeedback.balanceOf(secondary)).toString());

    await fakeTegisto.connect(await ethers.getSigner(deployer)).transfer(tegistoSaleRound1.address, 1000);

    /*console.log('message = ');
    console.log(await tegistoSaleRound1.connect(await ethers.getSigner(secondary)).getMessage());
    console.log('hash = ');
    console.log(await tegistoSaleRound1.connect(await ethers.getSigner(secondary)).getHash());
    console.log('eth hash = ');
    console.log(await tegistoSaleRound1.connect(await ethers.getSigner(secondary)).getEthSignedMessageHash());*/

    await tegistoSaleRound1.connect(await ethers.getSigner(deployer)).setMinBuyAmount(100);
    console.log('minBuyAmount = ', await tegistoSaleRound1.minBuyAmount());
    await fakeFeedback.connect(await ethers.getSigner(secondary)).approve(tegistoSaleRound1.address, 100);
    await tegistoSaleRound1.connect(await ethers.getSigner(secondary)).buy(100, signature);
    console.log('assssssssss');

    console.log('secondary (TGS) = ', (await fakeTegisto.balanceOf(secondary)).toString());
    expect(await fakeTegisto.balanceOf(secondary)).to.eq(200);
  });
});
