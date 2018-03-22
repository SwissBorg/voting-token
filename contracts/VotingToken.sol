// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./Owned.sol";
import "./ERC20Interface.sol";


contract VotingToken is ERC20Interface, Owned {
    using SafeMath for uint;


    // ------------------------------------------------------------------------
    // ERC 20 fields
    // ------------------------------------------------------------------------
    string public symbol;
    string public name;
    uint8 public decimals;
    uint public totalSupply;

    mapping(address => uint) balances;
    mapping(address => mapping(address => uint)) allowed;

    // ------------------------------------------------------------------------
    // Fields required for the referendum
    // ------------------------------------------------------------------------
    Description public description;
    Choices public choices;
    Reward public reward;
    bool public open;
    
    struct Description {
        string question;
        string firstChoice;
        string secondChoice;
    }

    struct Choices {
        address firstChoiceAddress;
        address secondChoiceAddress;
        address blankVoteAddress;
    }

    struct Reward {
        address tokenAddress;
        address refundWalletAddress; 
    }

    event VoteRewarded(address indexed to, uint amount);
    event Finish(string question, 
        string firstChoice, uint firstChoiceCount, 
        string secondChoice, uint secondChoiceCount, uint blankVoteCount);


    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    function VotingToken(
        string _symbol, string _name, uint _totalSupply, 
        string _question, string _firstChoice, string _secondChoice,
        address _firstChoiceAddress, address _secondChoiceAddress, address _blankVoteAddress,
        address _tokenAddress) public {

        symbol = _symbol;
        name = _name;
        decimals = 8;
        totalSupply = _totalSupply;
        balances[owner] = _totalSupply;
        Transfer(address(0), owner, totalSupply);

        description = Description(_question, _firstChoice, _secondChoice);
        choices = Choices(_firstChoiceAddress, _secondChoiceAddress, _blankVoteAddress);
        reward = Reward(_tokenAddress, owner);
        open = true;
    }

    function close() public onlyOwner returns (bool success) {
        require(open);
        open = false;
        Finish(description.question, 
            description.firstChoice, balanceOf(choices.firstChoiceAddress), 
            description.firstChoice, balanceOf(choices.secondChoiceAddress), 
            balanceOf(choices.blankVoteAddress));

        ERC20Interface rewardToken = ERC20Interface(reward.tokenAddress);
        uint leftBalance = rewardToken.balanceOf(owner);
        rewardToken.transfer(reward.refundWalletAddress, leftBalance);

        return true;
    }

    function updateRefundWalletAddress(address _wallet) public onlyOwner returns (bool success) {
        reward.refundWalletAddress = _wallet;
        return true;
    }

    function getResults() public view returns (uint firstChoiceCount, uint secondChoiceCount, uint blankVoteCount) {
        return (
            balanceOf(choices.firstChoiceAddress), 
            balanceOf(choices.secondChoiceAddress), 
            balanceOf(choices.blankVoteAddress));
    }

    function totalSupply() public constant returns (uint) {
        return totalSupply - balances[address(0)];
    }

    function balanceOf(address _tokenOwner) public constant returns (uint balance) {
        return balances[_tokenOwner];
    }

    function rewardVote(address _from, address _to, uint _tokens) private {
        if(_to == choices.firstChoiceAddress || 
           _to == choices.secondChoiceAddress || 
           _to == choices.blankVoteAddress) {
            ERC20Interface rewardToken = ERC20Interface(reward.tokenAddress);
            uint rewardTokens = _tokens.div(100);
            rewardToken.transfer(_from, rewardTokens);
            VoteRewarded(_from, _tokens);
        }
    }

    // ------------------------------------------------------------------------
    // Transfer the balance from token owner's account to `to` account
    // - Owner's account must have sufficient balance to transfer
    // - 0 value transfers are allowed
    // ------------------------------------------------------------------------
    function transfer(address to, uint tokens) public returns (bool success) {
        return transferFrom(msg.sender, to, tokens);
    }

    // ------------------------------------------------------------------------
    // Transfer `tokens` from the `from` account to the `to` account
    // 
    // The calling account must already have sufficient tokens approve(...)-d
    // for spending from the `from` account and
    // - From account must have sufficient balance to transfer
    // - Spender must have sufficient allowance to transfer
    // - 0 value transfers are allowed
    // ------------------------------------------------------------------------
    function transferFrom(address from, address to, uint tokens) public returns (bool success) {
        require(open);
        balances[from] = balances[from].sub(tokens);
        if(from != msg.sender) {
            allowed[from][msg.sender] = allowed[from][msg.sender].sub(tokens);
        }
        balances[to] = balances[to].add(tokens);
        Transfer(from, to, tokens);
        rewardVote(from, to, tokens);
        return true;
    }

    // ------------------------------------------------------------------------
    // Token owner can approve for `spender` to transferFrom(...) `tokens`
    // from the token owner's account
    //
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md
    // recommends that there are no checks for the approval double-spend attack
    // as this should be implemented in user interfaces 
    // ------------------------------------------------------------------------
    function approve(address spender, uint tokens) public returns (bool success) {
        require(open);
        allowed[msg.sender][spender] = tokens;
        Approval(msg.sender, spender, tokens);
        return true;
    }

    // ------------------------------------------------------------------------
    // Returns the amount of tokens approved by the owner that can be
    // transferred to the spender's account
    // ------------------------------------------------------------------------
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining) {
        return allowed[tokenOwner][spender];
    }

    // ------------------------------------------------------------------------
    // Don't accept ETH
    // ------------------------------------------------------------------------
    function () public payable {
        revert();
    }
}
