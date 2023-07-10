// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract SimpleVesting is Context, AccessControl {
    event TokenReleased(address indexed account, uint256 amount);

    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");
    bytes32 public immutable idoId;

    address public token;

    struct ReleaseInfo {
        uint128 time;
        uint128 percentage;
    }
    ReleaseInfo[] public releaseInfos;
    mapping(address => uint256) public released;

    constructor(address tokenAddress, string memory idoName) {
        require(tokenAddress != address(0), "invalid token address");
        token = tokenAddress;
        idoId = keccak256(abi.encode(idoName));
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BACKEND_ROLE, msg.sender);
    }

    /*********** VIEW FUNCTIONS ************/
    function getReleaseInfosLength() public view returns (uint256) {
        return releaseInfos.length;
    }

    function getReleaseInfos() public view returns (ReleaseInfo[] memory) {
        return releaseInfos;
    }

    function getSignerAcc(
        address account,
        uint256 totalAmount,
        bytes memory signature
    ) public view returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(idoId, account, totalAmount));
        hash = ECDSA.toEthSignedMessageHash(hash); //this adds "\x19Ethereum Signed Message:\n32" to the front of the hash
        address signer = ECDSA.recover(hash, signature);
        return signer;
    }

    function getParticipantUnlockedAmount(uint256 totalAmount) public view returns (uint256) {
        for (uint256 i = releaseInfos.length; i > 0; i--) {
            if (releaseInfos[i - 1].time <= block.timestamp) {
                return (totalAmount * releaseInfos[i - 1].percentage) / 100;
            }
        }
        return 0;
    }

    function getNextReleaseInfo() public view returns (ReleaseInfo memory) {
        for (uint256 i = 0; i < releaseInfos.length; i++) {
            if (releaseInfos[i].time > block.timestamp) {
                return releaseInfos[i];
            }
        }
        return ReleaseInfo(0, 0);
    }

    function getParticipantClaimInfo(address participant, uint256 totalAmount)
        public
        view
        returns (uint256 unclaimed, uint256 claimed)
    {
        return (getParticipantUnclaimedAmount(participant, totalAmount), released[participant]);
    }

    function getParticipantUnclaimedAmount(address participant, uint256 totalAmount) public view returns (uint256) {
        uint256 releasedAmount = released[participant];
        uint256 unlocked = getParticipantUnlockedAmount(totalAmount);
        if (unlocked < releasedAmount) {
            return 0;
        }
        return unlocked - releasedAmount;
    }

    /************ MUTATIVE FUNCTIONS **************/

    function setReleaseInfo(
        uint256 index,
        uint128 time,
        uint128 percentage
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        releaseInfos[index] = ReleaseInfo(time, percentage);
    }

    function addReleaseInfo(uint128 time, uint128 percentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        releaseInfos.push(ReleaseInfo(time, percentage));
    }

    function release(uint256 totalAmount, bytes memory signature) external onlyWhitelisted(totalAmount, signature) {
        uint256 releasable = getParticipantUnclaimedAmount(msg.sender, totalAmount);
        require(releasable > 0, "No releasable amount");

        released[msg.sender] += releasable;
        emit TokenReleased(msg.sender, releasable);
        SafeERC20.safeTransfer(IERC20(token), msg.sender, releasable);
    }

    function releaseAmount(
        uint256 totalAmount,
        uint256 amount,
        bytes memory signature
    ) external onlyWhitelisted(totalAmount, signature) {
        uint256 releasable = getParticipantUnclaimedAmount(msg.sender, totalAmount);
        require(releasable > 0, "No releasable amount");
        require(amount > 0, "amount > 0");
        require(amount <= releasable, "amount <= releasable");

        released[msg.sender] += amount;
        emit TokenReleased(msg.sender, amount);
        IERC20(token).transfer(msg.sender, amount);
    }

    modifier onlyWhitelisted(uint256 totalAmount, bytes memory signature) {
        bytes32 hash = keccak256(abi.encodePacked(idoId, msg.sender, totalAmount));
        hash = ECDSA.toEthSignedMessageHash(hash); //this adds "\x19Ethereum Signed Message:\n32" to the front of the hash
        address signer = ECDSA.recover(hash, signature);
        require(hasRole(BACKEND_ROLE, signer), "You are not whitelisted");
        _;
    }
}
