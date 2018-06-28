pragma solidity 0.4.24;

import "./SafeMath.sol";
import "./Owned.sol";
import "./ERC20.sol";
import "./StandardToken.sol";

/**
 * @title SwissBorg Referendum 2
 * @dev Hardcoded version with exactly 6 voting addresses.
 */
contract VotingToken is StandardToken, Owned {
    using SafeMath for uint;

    uint public constant numberOfAlternatives = 6;

    event Reward(address indexed to, uint amount);
    event Result(address indexed votingAddress, uint amount);

    ERC20 private rewardToken;

    bool public opened;
    bool public closed;

    address[numberOfAlternatives] public votingAddresses;

    // ~~~~~ Constructor ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    constructor(
        string _name,
        string _symbol,
        uint8 _decimals,
        ERC20 _rewardToken,
        address[numberOfAlternatives] _votingAddresses
    ) public StandardToken(_name, _symbol, _decimals, 0) {
        require(_votingAddresses.length == numberOfAlternatives);
        rewardToken = _rewardToken;
        votingAddresses = _votingAddresses;
    }

    // ~~~~~ Public Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    function transfer(address _to, uint _value) public returns (bool) {
        require(super.transfer(_to, _value));
        _rewardVote(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool) {
        require(super.transferFrom(_from, _to, _value));
        _rewardVote(_from, _to, _value);
        return true;
    }

    // Refuse ETH
    function () public payable {
        revert();
    }

    // ~~~~~ Admin Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Only before voting starts
    function mint(address _to, uint _amount) onlyOwner external returns (bool) {
        require(!opened);
        totalSupply = totalSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    function open() onlyOwner external {
        require(!opened);
        opened = true;
    }

    function close() onlyOwner external {
        require(opened && !closed);
        closed = true;
    }

    /**
     * @notice Terminate contract and refund to owner
     */
    function destroy(address[] tokens) onlyOwner external {

        // Transfer tokens to owner
        for (uint i = 0; i < tokens.length; i++) {
            ERC20 token = ERC20(tokens[i]);
            uint balance = token.balanceOf(this);
            token.transfer(owner, balance);
        }

        for (uint j = 0; j < numberOfAlternatives; j++) {
            address votingAddress = votingAddresses[j];
            uint votes = balances[votingAddress];
            emit Result(votingAddress, votes);
        }

        // Transfer Eth to owner and terminate contract
        selfdestruct(owner);
    }

    // ~~~~~ Private Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    function _rewardVote(address _from, address _to, uint _value) private {
        if(_isVotingAddress(_to)) {
            require(opened && !closed);
            uint rewardTokens1 = _value.div(100);
            require(rewardToken.transfer(_from, rewardTokens1));
            emit Reward(_from, _value);
        }
    }

    function _isVotingAddress(address votingAddress) private view returns (bool) {
        for (uint i = 0; i < numberOfAlternatives; i++) {
            if (votingAddresses[i] == votingAddress) return true;
        }
        return false;
    }

}
