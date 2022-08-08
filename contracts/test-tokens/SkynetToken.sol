// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract SkynetToken is ERC20, ERC20Burnable {
    constructor() ERC20("SkynetToken", "SKY") {
        _mint(msg.sender, 1_000_000_000 * 10**decimals());
    }
}
