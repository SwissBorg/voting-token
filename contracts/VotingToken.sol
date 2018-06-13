pragma solidity 0.4.24;

import "./SafeMath.sol";
import "./Owned.sol";
import "./ERC20.sol";
import "./StandardToken.sol";


contract VotingToken is StandardToken, Owned {
    using SafeMath for uint;

    uint public constant MAX_NUMBER_OF_ALTERNATIVES = 255;
    uint public constant REWARD_RATIO = 100;

    event Mint(address indexed to, uint amount);
    event Reward(address indexed to, uint amount);

    ERC20 private rewardToken;

    bool public opened;
    bool public closed;

    address[] public votingAddresses;
    uint public numberOfAlternatives;

    // ~~~~~ Constructor ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    constructor(
        string _name,
        string _symbol,
        uint8 _decimals,
        ERC20 _rewardToken,
        address[] _votingAddresses
    ) public StandardToken(_name, _symbol, _decimals, 0) {
        require(_votingAddresses.length <= MAX_NUMBER_OF_ALTERNATIVES);

        rewardToken = _rewardToken;

        numberOfAlternatives = _votingAddresses.length;
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
        emit Mint(_to, _amount);
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

        // Transfer Eth to owner and terminate contract
        selfdestruct(owner);
    }

    // ~~~~~ Private Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    function _rewardVote(address _from, address _to, uint _value) private {
        if(_isVotingAddress(_to)) {
            require(opened && !closed);
            uint rewardTokens = _value.div(REWARD_RATIO);
            rewardToken.transfer(_from, rewardTokens);
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
