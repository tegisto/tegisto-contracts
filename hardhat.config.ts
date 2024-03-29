import 'dotenv/config';
import './utils/decrypt-env-vars';

import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import 'solidity-coverage';
import 'hardhat-deploy-tenderly';
import {accounts, addForkConfiguration} from './utils/network';
import {task} from 'hardhat/config';

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

task('named-accounts', 'Prints the named accounts', async (taskArgs, hre) => {
  const accounts = await hre.getNamedAccounts();
  console.log(accounts);
});

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.5.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
          evmVersion: 'istanbul',
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 12,
    secondary: 13,
    tertiary: 14,
    extra1: 15,
    extra2: 16,
    extra3: 17,
    user1: 3,
    user2: 4,
    user3: 5,
  },
  networks: addForkConfiguration({
    hardhat: {
      initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
      saveDeployments: true,
    },
    localhost: {
      url: 'http://localhost:8545',
      accounts: accounts(),
    },
    eth_mainnet: {
      url: 'https://rpc.ankr.com/eth',
      chainId: 1,
      accounts: accounts('eth_mainnet'),
    },
    eth_rinkeby: {
      url: 'https://rpc.ankr.com/eth_rinkeby',
      chainId: 4,
      accounts: accounts('eth_rinkeby'),
    },
    eth_goerli: {
      url: 'https://rpc.ankr.com/eth_goerli',
      chainId: 5,
      accounts: accounts('eth_goerli'),
    },
    celo_mainnet: {
      url: 'https://forno.celo.org',
      chainId: 42220,
      accounts: accounts('celo_mainnet'),
    },
    celo_alfajores: {
      url: 'https://alfajores-forno.celo-testnet.org',
      chainId: 44787,
      accounts: accounts('celo_alfajores'),
    },
    bsc_testnet: {
      url: 'https://data-seed-prebsc-1-s3.binance.org:8545',
      chainId: 97,
      accounts: accounts('bsc_testnet'),
    },
    bsc_mainnet: {
      url: 'https://bsc-dataseed.binance.org/',
      chainId: 56,
      accounts: accounts('bsc_mainnet'),
    },
    kava_mainnet: {
      url: 'https://evm.kava.io/',
      chainId: 2222,
      accounts: accounts('kava_mainnet'),
    },
  }),
  paths: {
    sources: 'contracts',
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 0,
  },
  external: process.env.HARDHAT_FORK
    ? {
        deployments: {
          // process.env.HARDHAT_FORK will specify the network that the fork is made from.
          // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
          hardhat: ['deployments/' + process.env.HARDHAT_FORK],
          localhost: ['deployments/' + process.env.HARDHAT_FORK],
        },
      }
    : undefined,

  tenderly: {
    project: 'template-ethereum-contracts',
    username: process.env.TENDERLY_USERNAME as string,
  },
};

export default config;
