// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract FakeTegisto is ERC20, ERC20Burnable {
    constructor() ERC20("FakeTegisto", "FAKETGS") {
        _mint(msg.sender, 2_000_000_000 * 10**decimals());
    }
}
