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

let utils = require('./utils')
let ERC20Token = artifacts.require('ERC20Token')
let VotingToken = artifacts.require('VotingToken')

contract('VotingToken', async (accounts) => {
  let vt = undefined; // VotingToken
  let rt = undefined; // RewardToken as a ERC20Token
  let firstChoiceAddress = undefined;
  let secondChoiceAddress = undefined;
  let blankVoteAddress = undefined;
  let rewardWallet = undefined;


  before(async () => {
    rt = await ERC20Token.deployed();
    vt = await VotingToken.deployed();
    firstChoiceAddress = await vt.choices.call().firstChoiceAddress;
    // secondChoiceAddress = await vt.choices.call(1);
    // blankVoteAddress = await vt.choices.call(2);
    // rewardWallet = await vt.reward.call(1);

    console.log(`Nicoas ${firstChoiceAddress}, ${secondChoiceAddress}, ${blankVoteAddress}, ${rewardWallet}`)
  })

  it('is created open', async () => {
    // assert.ok(await vt.open())
  })

});
