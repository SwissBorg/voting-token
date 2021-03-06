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

const utils = require("./utils")
let ERC20Token = artifacts.require("ERC20Token")
let VotingToken = artifacts.require("VotingToken")

contract("VotingToken", async (accounts) => {
  let vt = undefined; // VotingToken
  let rt = undefined; // RewardToken as a ERC20Token
  let firstPropAddress = undefined;
  let secondPropAddress = undefined;
  let blankVoteAddress = undefined;

  const owner = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const voter3 = accounts[3];
  const voter4 = accounts[4];
  
  before(async () => {
    rt = await ERC20Token.deployed();
    vt = await VotingToken.deployed();
    let props = await vt.props.call();
    firstPropAddress = props[0];
    secondPropAddress = props[1];
    blankVoteAddress = props[2];
  

    await rt.transfer(VotingToken.address, 1000*1e8);

    //console.log(`Nicolas (owner_${firstPropAddress}, 2_${secondPropAddress}, 3_${blankVoteAddress}`)
  })

  it("is created open", async () => {
    expect(await vt.open()).to.be.true;
  })

  const transferAmount = new web3.BigNumber(100*1e8);

  it("allow transfers", async () => {
    const balance1 = await vt.balanceOf(owner);

    await vt.transfer(voter1, transferAmount);

    expect(balance1.sub(transferAmount)).to.deep.equal(await vt.balanceOf(owner));
    expect(transferAmount).to.deep.equal(await vt.balanceOf(voter1));
  })

  const voteAmount = 250*1e8;

  it("accepts votes for the first prop", async () => {
    // Give voter his voting tokens
    await vt.transfer(voter2, voteAmount);
   
    // Voter2 votes for the first prop
    await vt.transfer(firstPropAddress, voteAmount, {from: voter2});
    expect((await vt.getResults()).map(i=>i.toNumber())).to.deep.equal([voteAmount, 0, 0]);
    expect((await vt.balanceOf(voter2)).toNumber()).to.equal(0);
    expect((await rt.balanceOf(voter2)).toNumber()).to.equal(voteAmount/100);
  }) 

  it("accepts votes for the second prop", async () => { 
    // Give voter his voting tokens
    await vt.transfer(voter3, voteAmount);

    // Then, voter3 votes for the second prop
    await vt.transfer(secondPropAddress, voteAmount, {from: voter3});
    expect((await vt.getResults()).map(i=>i.toNumber())).to.deep.equal([voteAmount, voteAmount, 0]);
    expect((await vt.balanceOf(voter3)).toNumber()).to.equal(0);
    expect((await rt.balanceOf(voter3)).toNumber()).to.equal(voteAmount/100);
  })

  it("accepts blank votes", async () => {
    // Give voter his voting tokens
    await vt.transfer(voter4, voteAmount);

    // Then, voter4 cast a blank vote
    await vt.transfer(blankVoteAddress, voteAmount, {from: voter4});
    expect((await vt.getResults()).map(i=>i.toNumber())).to.deep.equal([voteAmount, voteAmount, voteAmount]);
    expect((await vt.balanceOf(voter4)).toNumber()).to.equal(0);
    expect((await rt.balanceOf(voter4)).toNumber()).to.equal(voteAmount/100);
  })

  it("can be closed", async () => {

    let contractBalance = await rt.balanceOf(VotingToken.address);
    let ownerBalance = await rt.balanceOf(owner)

    await vt.close()

    expect((await vt.getResults()).map(i=>i.toNumber())).to.deep.equal([voteAmount, voteAmount, voteAmount]);
    expect(await vt.open()).to.be.false;

    expect(await rt.balanceOf(owner)).to.deep.equal(ownerBalance.plus(contractBalance));
  })

  it("no more accept votes once closed", async () => {
    await utils.expectThrow(
      vt.transfer(firstPropAddress, voteAmount, {from: voter1})
    );
  }) 

});



