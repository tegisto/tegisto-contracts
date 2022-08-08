// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract TGSToken is ERC20, ERC20Burnable, ERC20Permit {
    constructor() ERC20("Tegisto", "TGS") ERC20Permit("Tegisto") {
        address owner = 0x9C60bF87F2a31f3A7cC0F40F6282408E8F5551c3;
        _mint(owner, 9_000_000_000 * 10**decimals());
    }
}
