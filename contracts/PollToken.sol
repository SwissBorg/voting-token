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

pragma solidity ^0.4.18;

import "./Math.sol";
import "./Owned.sol";
import "./Stoppable.sol";


contract TokenEvents {
    event Burnt(address indexed src, uint256 wad);
    event Minted(address indexed src, uint256 wad);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


contract PollToken is Owned, Stoppable, TokenEvents {
    string public symbol;
    string public name; // Optional token name
    uint8 public decimals = 18; // standard token precision. override to customize

    uint256 public totalSupply;
    uint256 public maxBalance;
    bytes32 public poll;

    mapping(bytes32 => bool) polls;
    mapping(bytes32 => mapping(address => uint256)) balances;
    mapping(bytes32 => mapping(address => mapping(address => uint256))) allowances;
    mapping(bytes32 => address[]) questions;

    modifier canTransfer(address src, address dst) {
        _;
    }

    function PollToken(string name_, string symbol_) public {
        // you can't create logic here, because this contract would be the owner.
        name = name_;
        symbol = symbol_;
        stopped = true;
    }

    function () payable public {
        maxBalance = Math.add(maxBalance, msg.value);
    }

    function stop() public onlyOwner {
        stopped = true;
        maxBalance = this.balance;
    }

    function retrieveBalance() public onlyOwner {
        owner.transfer(this.balance);
    }

    function balanceOf( address who ) public view returns (uint256) {
        return balances[poll][who];
    }

    function getQuestions() public view returns (address[]) {
        return questions[poll];
    }

    function addPoll() public onlyOwner {
        poll = keccak256(block.blockhash(block.number));
    }

    function setPoll(bytes32 poll_) public onlyOwner {
        //we only accept existing poll IDs
        require(polls[poll_]);
        poll = poll_;
    }

    function addQuestion(address question) public {
        questions[poll].push(question);
    }

    function allowance(address owner, address spender ) public view returns (uint256) {
        return allowances[poll][owner][spender];
    }

    function transfer(address dst, uint256 wad) public stoppable returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    function transferFrom(address src, address dst, uint256 wad) public stoppable returns (bool) {
        //TODO: check if memory is the correct place
        address[] memory pollQuestions = questions[poll];
        bool isQuestionDst;
        for (uint16 i = 0; i < pollQuestions.length; ++i) {
            if (pollQuestions[i] == dst) {
                isQuestionDst = true;
            }
        }
        //user etiher transfers their own tokens or they were given an allowance
        if(msg.sender != src) {
            require(allowances[poll][src][msg.sender] >= wad);
            require(isQuestionDst);
        }

        balances[poll][src] = Math.sub(balances[poll][src], wad);
        balances[poll][dst] += Math.add(balances[poll][dst], wad);
        Transfer(src, dst, wad);

        if(isQuestionDst) {
            uint256 portion = (totalSupply * 1000) / wad;
            src.transfer((maxBalance * 1000) / portion);
        }

        return true;
    }

    function approve(address guy, uint256 wad) public stoppable returns (bool) {
        allowances[poll][msg.sender][guy] = wad;
        Approval(msg.sender, guy, wad);
        return true;
    }

    function pull(address src, uint256 wad) public stoppable returns (bool) {
        return transferFrom(src, msg.sender, wad);
    }

    function mint(address dst, uint256 wad) public onlyOwner {
        balances[poll][dst] = Math.add(balances[poll][dst], wad);
        totalSupply = Math.add(totalSupply, wad);
        Minted(dst, wad);
        Transfer(address(0x0), dst, wad);
    }

    function burn(uint256 wad) public {
        balances[poll][msg.sender] = Math.sub(balances[poll][msg.sender], wad);
        totalSupply = Math.sub(totalSupply, wad);
        Burnt(msg.sender, wad);
        Transfer(msg.sender, address(0x0), wad);
    }

    function setName(string name_) public onlyOwner {
        name = name_;
    }
}
