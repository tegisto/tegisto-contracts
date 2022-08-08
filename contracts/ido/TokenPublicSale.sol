// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract TokenPublicSale is ReentrancyGuard, AccessControl, Pausable {
    event TokenReleased(address indexed participant, uint256 amount);

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

    bytes32 public immutable idoId;
    address public token;
    address public buyCurrency;
    uint256 public startDate;
    uint256 public whitelistEndDate;
    uint256 public endDate;
    uint256 public exchangeRate; // for every 100 tokens, how many buyCurrency
    uint256 public minBuyAmount;
    uint256 public maxBuyAmount;
    uint256 public maxWhitelistedBuyAmount;
    uint256 public releaseDuration;
    uint256 public releaseInterval;

    mapping(address => uint256) private _participantToBuyAmount;
    mapping(address => uint256) private _releasedAmounts;
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
        uint256 _maxWhitelistedBuyAmount,
        uint256 _releaseDuration,
        uint256 _releaseInterval,
        bytes32 _idoId
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
        releaseDuration = _releaseDuration;
        releaseInterval = _releaseInterval;
        idoId = _idoId;
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

    function setReleaseDuration(uint256 _releaseDuration) public onlyRole(DEFAULT_ADMIN_ROLE) {
        releaseDuration = _releaseDuration;
    }

    function setReleaseInterval(uint256 _releaseInterval) public onlyRole(DEFAULT_ADMIN_ROLE) {
        releaseInterval = _releaseInterval;
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
        _buy(_buyCurrencyAmount, startDate, maxWhitelistedBuyAmount);
        return true;
    }

    /**
     * @param _buyCurrencyAmount (type uint256) amount of buyCurrency to buy tokens
     * @dev function to buy token with buyCurrency
     */
    function buy(uint256 _buyCurrencyAmount) public nonReentrant whenNotPaused returns (bool sucess) {
        _buy(_buyCurrencyAmount, whitelistEndDate, maxBuyAmount);
        return true;
    }

    function _buy(
        uint256 _buyCurrencyAmount,
        uint256 _startDate,
        uint256 _maxBuyAmount
    ) internal {
        require(block.timestamp >= _startDate && block.timestamp <= endDate, "Token sale is not active");
        require(_buyCurrencyAmount >= minBuyAmount, "must be bigger than minBuyAmount");
        uint256 oldBuyAmount = _participantToBuyAmount[msg.sender];
        uint256 totalBuyAmount = oldBuyAmount + _buyCurrencyAmount;
        require(totalBuyAmount <= _maxBuyAmount, "total buy amount must be smaller than maxBuyAmount");
        if (oldBuyAmount == 0) {
            _participantCount++;
        }
        _participantToBuyAmount[msg.sender] = totalBuyAmount;
        _buyCount++;
        _totalRaised += _buyCurrencyAmount;
        IERC20(buyCurrency).transferFrom(msg.sender, address(this), _buyCurrencyAmount);
        uint256 unlocked = (_buyCurrencyAmount * exchangeRate * 10) / 10000; //10% of the new token
        IERC20(token).transfer(msg.sender, unlocked);
    }

    modifier onlyWhitelisted(bytes memory signature) {
        bytes32 hash = keccak256(abi.encodePacked(idoId, msg.sender));
        hash = ECDSA.toEthSignedMessageHash(hash); //this adds "\x19Ethereum Signed Message:\n32" to the front of the hash
        address signer = ECDSA.recover(hash, signature);
        require(hasRole(WHITELISTER_ROLE, signer), "You are not whitelisted");
        _;
    }

    function release() public virtual {
        uint256 releasable = getParticipantUnclaimedAmount(msg.sender);
        require(releasable > 0, "No releasable amount");

        _releasedAmounts[msg.sender] += releasable;
        emit TokenReleased(msg.sender, releasable);
        IERC20(token).transfer(msg.sender, releasable);
    }

    function releaseAmount(uint256 amount) public virtual {
        uint256 releasable = getParticipantUnclaimedAmount(msg.sender);
        require(releasable > 0, "No releasable amount");
        require(amount > 0, "amount > 0");
        require(amount <= releasable, "amount <= releasable");

        _releasedAmounts[msg.sender] += amount;
        emit TokenReleased(msg.sender, amount);
        IERC20(token).transfer(msg.sender, amount);
    }

    function _getUnlocked(uint256 totalAllocation, uint64 timestamp) internal view returns (uint256) {
        if (timestamp < endDate) {
            return 0;
        } else if (timestamp > (endDate + releaseDuration)) {
            return totalAllocation;
        } else {
            uint256 elapsedFromStart = timestamp - endDate;
            uint256 vestingCount = releaseDuration / releaseInterval;
            uint256 vestingAmount = totalAllocation / vestingCount;
            uint256 passedIntervalCount = elapsedFromStart / releaseInterval;
            return passedIntervalCount * vestingAmount;
        }
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

    function getParticipantTotalTokenAmount(address participant) public view returns (uint256) {
        return (_participantToBuyAmount[participant] * exchangeRate) / 100;
    }

    function getParticipantUnlockedAmount(address participant, uint64 timestamp) public view returns (uint256) {
        uint256 _buyCurrencyAmount = _participantToBuyAmount[participant];
        uint256 unlocked = (_buyCurrencyAmount * exchangeRate * 10) / 10000;
        uint256 totalLocked = (_buyCurrencyAmount * exchangeRate * 90) / 10000;
        return _getUnlocked(totalLocked, timestamp) + unlocked;
    }

    function getParticipantUnclaimedAmount(address participant) public view returns (uint256) {
        uint256 totalLocked = (_participantToBuyAmount[participant] * exchangeRate * 90) / 10000;
        return _getUnlocked(totalLocked, uint64(block.timestamp)) - _releasedAmounts[participant];
    }

    /**
     * @param _token (type address) ERC20 token address (can be buyCurrency)
     * @param _amount (type uint256) amount of buyCurrency
     */
    function withdraw(
        address to,
        address _token,
        uint256 _amount
    ) public onlyRole(DEFAULT_ADMIN_ROLE) returns (bool success) {
        if (_token == address(0)) {
            (bool result, ) = to.call{value: _amount}("");
            return result;
        }
        IERC20(_token).transfer(to, _amount);
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
