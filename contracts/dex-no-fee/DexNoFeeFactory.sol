// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.5.16;

import "../dex/interfaces/IDexFactory.sol";
import "./DexNoFeePair.sol";

contract DexNoFeeFactory is IDexFactory {
    bytes32 public constant INIT_CODE_PAIR_HASH = keccak256(abi.encodePacked(type(DexNoFeePair).creationCode));

    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    constructor(address _feeToSetter) public {
        // next line removed because there is no fee
        //feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        // require(msg.sender == feeToSetter, "Dex: FORBIDDEN");
        require(tokenA != tokenB, "Dex: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Dex: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "Dex: PAIR_EXISTS"); // single check is sufficient
        bytes memory bytecode = type(DexNoFeePair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IDexPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "Dex: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "Dex: FORBIDDEN");
        feeToSetter = _feeToSetter;
    }
}
