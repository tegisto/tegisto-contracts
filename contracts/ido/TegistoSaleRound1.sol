// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract TegistoSaleRound1 is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

    address public token;
    address public buyCurrency;
    uint256 public startDate;
    uint256 public whitelistEndDate;
    uint256 public endDate;
    uint256 public exchangeRate; // for every 100 tokens, how many buyCurrency
    uint256 public minBuyAmount;
    uint256 public maxBuyAmount;
    uint256 public maxWhitelistedBuyAmount;

    mapping(address => uint256) private _participantToBuyAmount;
    uint256 private _participantCount;
    uint256 private _buyCount;
    uint256 private _totalRaised;

    constructor(
        address _token,
        address _buyCurrency,
        uint256 _startDate,
        uint256 _whitelistEndDate,
        uint256 _endDate,
        uint256 _exchangeRate,
        uint256 _minBuyAmount,
        uint256 _maxBuyAmount,
        uint256 _maxWhitelistedBuyAmount
    ) {
        token = _token;
        buyCurrency = _buyCurrency;
        startDate = _startDate;
        whitelistEndDate = _whitelistEndDate;
        endDate = _endDate;
        exchangeRate = _exchangeRate;
        minBuyAmount = _minBuyAmount;
        maxBuyAmount = _maxBuyAmount;
        maxWhitelistedBuyAmount = _maxWhitelistedBuyAmount;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(WHITELISTER_ROLE, msg.sender);
    }

    //////////  SETTERS ///////////
    function setStartDate(uint256 _startDate) public onlyRole(DEFAULT_ADMIN_ROLE) {
        startDate = _startDate;
    }

    function setWhitelistEndDate(uint256 _whitelistEndDate) public onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelistEndDate = _whitelistEndDate;
    }

    function setEndDate(uint256 _endDate) public onlyRole(DEFAULT_ADMIN_ROLE) {
        endDate = _endDate;
    }

    function setExchangeRate(uint256 _exchangeRate) public onlyRole(DEFAULT_ADMIN_ROLE) {
        exchangeRate = _exchangeRate;
    }

    function setMinBuyAmount(uint256 _minBuyAmount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        minBuyAmount = _minBuyAmount;
    }

    function setMaxBuyAmount(uint256 _maxBuyAmount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        maxBuyAmount = _maxBuyAmount;
    }

    function setMaxWhitelistedBuyAmount(uint256 _maxWhitelistedBuyAmount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        maxWhitelistedBuyAmount = _maxWhitelistedBuyAmount;
    }

    /////////////////////////////////

    /**
     * @param _buyCurrencyAmount (type uint256) amount of buyCurrency to buy tokens
     * @param _signature (type bytes) signature that proves that the caller is whitelisted
     * @dev function to buy token with buyCurrency
     */
    function buyWhitelisted(uint256 _buyCurrencyAmount, bytes memory _signature)
        public
        onlyWhitelisted(_signature)
        nonReentrant
        whenNotPaused
        returns (bool sucess)
    {
        require(block.timestamp >= startDate && block.timestamp <= endDate, "Token sale is not active");
        require(_buyCurrencyAmount >= minBuyAmount, "must be bigger than minBuyAmount");
        uint256 oldBuyAmount = _participantToBuyAmount[msg.sender];
        uint256 totalBuyAmount = oldBuyAmount + _buyCurrencyAmount;
        require(totalBuyAmount <= maxWhitelistedBuyAmount, "total buy amount must be smaller than maxBuyAmount");
        if (oldBuyAmount == 0) {
            _participantCount++;
        }
        _participantToBuyAmount[msg.sender] = totalBuyAmount;
        _buyCount++;
        _totalRaised += _buyCurrencyAmount;
        IERC20(buyCurrency).transferFrom(msg.sender, address(this), _buyCurrencyAmount);
        IERC20(token).transfer(msg.sender, (_buyCurrencyAmount / 100) * exchangeRate);
        return true;
    }

    /**
     * @param _buyCurrencyAmount (type uint256) amount of buyCurrency to buy tokens
     * @dev function to buy token with buyCurrency
     */
    function buy(uint256 _buyCurrencyAmount) public nonReentrant whenNotPaused returns (bool sucess) {
        require(block.timestamp >= whitelistEndDate && block.timestamp <= endDate, "Token sale is not active");
        require(_buyCurrencyAmount >= minBuyAmount, "must be bigger than minBuyAmount");
        uint256 oldBuyAmount = _participantToBuyAmount[msg.sender];
        uint256 totalBuyAmount = oldBuyAmount + _buyCurrencyAmount;
        require(totalBuyAmount <= maxBuyAmount, "total buy amount must be smaller than maxBuyAmount");
        if (oldBuyAmount == 0) {
            _participantCount++;
        }
        _participantToBuyAmount[msg.sender] = totalBuyAmount;
        _buyCount++;
        _totalRaised += _buyCurrencyAmount;
        IERC20(buyCurrency).transferFrom(msg.sender, address(this), _buyCurrencyAmount);
        IERC20(token).transfer(msg.sender, (_buyCurrencyAmount / 100) * exchangeRate);
        return true;
    }

    modifier onlyWhitelisted(bytes memory signature) {
        bytes32 hash = keccak256(abi.encodePacked(this, msg.sender));
        hash = ECDSA.toEthSignedMessageHash(hash); //this adds "\x19Ethereum Signed Message:\n32" to the front of the hash
        address signer = ECDSA.recover(hash, signature);
        require(hasRole(WHITELISTER_ROLE, signer), "You are not whitelisted");
        _;
    }

    function getParticipantCount() public view returns (uint256) {
        return _participantCount;
    }

    function getBuyCount() public view returns (uint256) {
        return _buyCount;
    }

    function getTotalRaised() public view returns (uint256) {
        return _totalRaised;
    }

    function getParticipantBuyAmount(address _participant) public view returns (uint256) {
        return _participantToBuyAmount[_participant];
    }

    /**
     * @param _token (type address) ERC20 token address (can be buyCurrency)
     * @param _amount (type uint256) amount of buyCurrency
     */
    function withdraw(address _token, uint256 _amount) public onlyRole(DEFAULT_ADMIN_ROLE) returns (bool success) {
        if (_token == address(0)) {
            (bool result, ) = msg.sender.call{value: _amount}("");
            return result;
        }
        IERC20(_token).transfer(msg.sender, _amount);
        return true;
    }

    /////////
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
