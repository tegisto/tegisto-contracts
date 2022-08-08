import {getNamedAccounts, ethers, deployments} from 'hardhat';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {TegistoSaleRound1} from '../typechain';
import exec from '../utils/exec';
import csvReader from 'csv-reader';
import fs from 'fs';

async function main() {
  const {deployer, extra1} = await getNamedAccounts();

  console.log({extra1});

  const idoContract: TegistoSaleRound1 = await ethers.getContract('TegistoSaleRound1', deployer);
  const id = await idoContract.idoId();
  console.log(id);

  return new Promise<void>((resolve, reject) => {
    const inputStream = fs.createReadStream('Tegisto.csv', 'utf8');

    const accounts: string[] = [];
    inputStream
      .pipe(new csvReader({parseNumbers: true, parseBooleans: true, trim: true}))
      .on('data', function (row: string[]) {
        if (row.length > 1 && row[1].startsWith('0x')) {
          accounts.push(row[1]);
        }
      })
      .on('end', async function () {
        await generateSignatures(id, accounts, await ethers.getNamedSigner('extra1'));
        resolve();
      })
      .on('error', function (err) {
        console.log(err);
        reject(err);
      });
  });
}

async function generateSignatures(idoId: string, accounts: string[], signer: SignerWithAddress) {
  const wihiteList: {[key: string]: string} = {};
  for (let i = 0; i < accounts.length; i++) {
    //var message = contractAddress.substr(2) + accounts[i].substr(2);
    //var hash = web3.utils.sha3(message, {encoding: 'hex'})
    const hash = ethers.utils.solidityKeccak256(['bytes32', 'address'], [idoId, accounts[i]]);
    const messageHashBytes = ethers.utils.arrayify(hash);
    const sig = await signer.signMessage(messageHashBytes);
    wihiteList[accounts[i]] = sig;
  }

  fs.writeFileSync('whitelist.json', JSON.stringify(wihiteList));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
