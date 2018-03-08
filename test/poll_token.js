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
let PollToken = artifacts.require('PollToken')

contract('PollToken', function (accounts) {
  let pt = undefined;
  let questions = [
    web3.personal.newAccount(),
    web3.personal.newAccount(),
    web3.personal.newAccount(),
    web3.personal.newAccount()
  ]

  before(async () => {
    pt = await PollToken.deployed();
  })

  it('is created stopped', async () => {
    assert.ok(await pt.stopped())
  })

  it('can add a poll', async () => {
    await pt.addPoll()
    assert.notEqual(await pt.poll(), '0x0000000000000000000000000000000000000000000000000000000000000000')
  })

  it('can not be started by a non owner', async () => {
    await utils.assertThrowsAsynchronously(() => pt.start({from: accounts[1]}))
  })

  it('can be started by the owner', async () => {
    await pt.start({from: accounts[0]})
  })

  it('can mint tokens for a chosen address', async () => {
    await pt.mint(accounts[1], 1e6)
    await pt.mint(accounts[2], 1e7)
    await pt.mint(accounts[3], 1e8)
    await pt.mint(accounts[4], 1e9)
    await pt.mint(accounts[5], 1e10)
    assert.equal((await pt.balanceOf(accounts[1])).toNumber(), 1e6)
    assert.equal((await pt.balanceOf(accounts[2])).toNumber(), 1e7)
    assert.equal((await pt.balanceOf(accounts[3])).toNumber(), 1e8)
    assert.equal((await pt.balanceOf(accounts[4])).toNumber(), 1e9)
    assert.equal((await pt.balanceOf(accounts[5])).toNumber(), 1e10)
  });

  it('can receive ETH', async () => {
    web3.eth.sendTransaction({from: accounts[0], to: pt.address, value: 2e6})
    web3.eth.sendTransaction({from: accounts[1], to: pt.address, value: 2e6})
    web3.eth.sendTransaction({from: accounts[2], to: pt.address, value: 2e6})
    web3.eth.sendTransaction({from: accounts[3], to: pt.address, value: 2e6})
    web3.eth.sendTransaction({from: accounts[4], to: pt.address, value: 2e6})
    web3.eth.sendTransaction({from: accounts[5], to: pt.address, value: 2e6})

    assert.equal((await web3.eth.getBalance(pt.address)).toNumber(), 1.2e7)
  })

  it('records the maximum balance for computing distribution', async () => {
    assert.equal((await pt.maxBalance()).toNumber(), 1.2e7)
  })

  it('transfers tokens to anyone', async () => {
    await pt.transfer(accounts[0], 5e5, {from: accounts[1]})
    assert.equal((await pt.balanceOf(accounts[1])).toNumber(), 5e5)
    assert.equal((await pt.balanceOf(accounts[0])).toNumber(), 5e5)
    //verify that no ETH has been sent out of the contract
    assert.equal((await web3.eth.getBalance(pt.address)).toNumber(), 1.2e7)
  })

  it('allows the creation of question addresses', async () => {
    let additions = []
    questions.forEach(async question => await pt.addQuestion(question))
    let addedQuestions = await pt.getQuestions()
    addedQuestions.forEach((q, i) => {
      assert.equal(q, questions[i])
    })
  })

  it('informs you of your payout without you sending any funds', async () => {
    let wad = 5e5
    let portion = (await pt.totalSupply()).times(1000).dividedBy(wad)
    let distribution = (await pt.maxBalance()).times(1000).dividedBy(portion)
    assert.equal((await pt.getPayoutAmount(wad)).toNumber(), parseInt(distribution.toNumber()))
  })

  it('disrtibutes a portion of the funds when tokens are sent to a question', async () => {
    let balance = await web3.eth.getBalance(accounts[1])
    let cost = undefined
    await pt.transfer(questions[0], 5e5, {from: accounts[1]})
      .then(txr => {
        return Promise.all([web3.eth.getTransaction(txr.tx), txr.receipt])
      })
      .then(res => {
        let tx = res[0]
        let txr = res[1]

        cost = tx.gasPrice.times(txr.gasUsed)
        return true
      })

    let portion = (await pt.totalSupply()).times(1000).dividedBy(5e5)
    let distribution = (await pt.maxBalance()).times(1000).dividedBy(portion)

    let newBalance = (await web3.eth.getBalance(accounts[1])).add(cost).minus(balance)
    assert.equal(newBalance.toNumber(), parseInt(distribution.toNumber()))
  })

  it('allows the owner to get the remainder of the reward', async () => {
    let balance = await web3.eth.getBalance(accounts[0])
    let reward = await web3.eth.getBalance(pt.address)
    let cost = undefined
    await pt.retrieveBalance({from: accounts[0]})
      .then(txr => {
        return Promise.all([web3.eth.getTransaction(txr.tx), txr.receipt])
      })
      .then(res => {
        let tx = res[0]
        let txr = res[1]

        cost = tx.gasPrice.times(txr.gasUsed)
        return true
      })

    let newBalance = (await web3.eth.getBalance(accounts[0])).add(cost).minus(balance)
    assert.equal(newBalance.toNumber(), reward.toNumber())
  })


});
