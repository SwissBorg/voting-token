
import {advanceBlock, latestTime, increaseTimeTo, duration} from './helpers/utils';

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const EVMThrow = 'invalid opcode';
const EVMRevert = 'revert';

const StandardToken = artifacts.require("StandardToken");
const VotingToken = artifacts.require("VotingToken");

contract("VotingToken", function (accounts) {
  const owner = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const votingAddress1 = "0x0000000000000000000000000000000000000001";
  const votingAddress2 = "0x0000000000000000000000000000000000000002";
  const votingAddress3 = "0x0000000000000000000000000000000000000003";
  const totalRewardSupply = 1e6;

  before(async () => {
    // advance to the next block to correctly read time in the solidity "now"
    await advanceBlock()
  });

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime = this.startTime + duration.weeks(1);
    this.afterStartTime = this.startTime + duration.minutes(10);
    this.afterEndTime = this.endTime + duration.minutes(10);
    this.votingAddresses = [votingAddress1, votingAddress2, votingAddress3];

    this.rewardToken = await StandardToken.new("Reward Token", "CHSB", 8, 1e9*1e8);
    this.votingToken = await VotingToken.new("Voting Token", "RSB", 8, this.startTime, this.endTime, this.rewardToken.address, this.votingAddresses);
  
    // give reward token to the voting contract
    this.rewardToken.transfer(this.votingToken.address, totalRewardSupply);
  });

  it("should create with correct parameters", async function () {
    this.votingToken.should.exist;

    (await this.votingToken.name()).should.be.equal("Voting Token");
    (await this.votingToken.symbol()).should.be.equal("RSB");
    (await this.votingToken.decimals()).should.be.bignumber.equal(8);
    (await this.votingToken.totalSupply()).should.be.bignumber.equal(0);

    (await this.votingToken.owner()).should.be.equal(owner);

    (await this.votingToken.startTime()).should.be.bignumber.equal(this.startTime);
    (await this.votingToken.endTime()).should.be.bignumber.equal(this.endTime);
    (await this.votingToken.hasStarted()).should.be.equal(false);
    (await this.votingToken.hasEnded()).should.be.equal(false);
    (await this.votingToken.numberOfAlternatives()).should.be.bignumber.equal(3);
  });

  it("should read the list of voting addresses", async function () {
    (await this.votingToken.votingAddresses(0)).should.be.equal(votingAddress1);
    (await this.votingToken.votingAddresses(1)).should.be.equal(votingAddress2);
    (await this.votingToken.votingAddresses(2)).should.be.equal(votingAddress3);
    this.votingToken.votingAddresses(3).should.be.rejectedWith(EVMThrow);
  });

  it("should allow the owner to mint", async function () {
    await this.votingToken.mint(voter1, 1000, 10);
    (await this.votingToken.totalSupply()).should.be.bignumber.equal(1000);
    (await this.votingToken.balanceOf(voter1)).should.be.bignumber.equal(1000);
  });

  it("should revert on anyone else trying to mint", async function () {
    this.votingToken.mint(voter1, 1000, 10, {from: voter1}).should.be.rejectedWith(EVMRevert);
  });

  it("should revert when mintting in voting period", async function () {
    await increaseTimeTo(this.afterStartTime);
    this.votingToken.mint(voter1, 1000, 10).should.be.rejectedWith(EVMRevert);
  });

  it("should allow transfer tokens before start time", async function () {
    await this.votingToken.mint(voter1, 1000, 10);
    await this.votingToken.transfer(voter2, 500, {from: voter1});

    (await this.votingToken.balanceOf(voter1)).should.be.bignumber.equal(500);
    (await this.votingToken.balanceOf(voter2)).should.be.bignumber.equal(500);
  });

  it("should revert on transfer to a voting address before start time", async function () {
    await this.votingToken.mint(voter1, 1000, 10);
    this.votingToken.transfer(votingAddress1, 1000, {from: voter1}).should.be.rejectedWith(EVMRevert);
  });

  it("should revert on transfer to a voting address after end time", async function () {
    await this.votingToken.mint(voter1, 1000, 10);

    await increaseTimeTo(this.afterEndTime);

    this.votingToken.transfer(votingAddress1, 1000, {from: voter1}).should.be.rejectedWith(EVMRevert);
  });

  it("should give reward when transfering in voting period", async function () {
    const votingTokens = 1000;
    const expectedReward = 100;
    
    await this.votingToken.mint(voter1, votingTokens, 10);
    (await this.rewardToken.balanceOf(this.votingToken.address)).should.be.bignumber.equal(totalRewardSupply);

    await increaseTimeTo(this.afterStartTime);

    await this.votingToken.transfer(votingAddress1, votingTokens, {from: voter1}).should.be.fulfilled;

    (await this.votingToken.balanceOf(voter1)).should.be.bignumber.equal(0);
    (await this.votingToken.balanceOf(votingAddress1)).should.be.bignumber.equal(votingTokens);
    
    (await this.rewardToken.balanceOf(voter1)).should.be.bignumber.equal(expectedReward);
    (await this.rewardToken.balanceOf(this.votingToken.address)).should.be.bignumber.equal(totalRewardSupply - expectedReward);
  });

  it("should expose hasStarted() and hasEnded() functions", async function () {
    (await this.votingToken.hasStarted()).should.be.equal(false);
    (await this.votingToken.hasEnded()).should.be.equal(false);

    await increaseTimeTo(this.afterStartTime);

    (await this.votingToken.hasStarted()).should.be.equal(true);
    (await this.votingToken.hasEnded()).should.be.equal(false);

    await increaseTimeTo(this.afterEndTime);

    (await this.votingToken.hasStarted()).should.be.equal(true);
    (await this.votingToken.hasEnded()).should.be.equal(true);
  });

  it("can be destroyed by the owner", async function () {
    const beforeBalance = (await this.rewardToken.balanceOf(owner)).toNumber();

    (await this.rewardToken.balanceOf(this.votingToken.address)).should.be.bignumber.equal(totalRewardSupply);

    await this.votingToken.destroy([this.rewardToken.address]).should.be.fulfilled;

    (await this.rewardToken.balanceOf(owner)).should.be.bignumber.equal(beforeBalance + totalRewardSupply);
    (await this.rewardToken.balanceOf(this.votingToken.address)).should.be.bignumber.equal(0);
  });

  it("should revert on anyone else trying to destroy", async function () {
    this.votingToken.destroy([this.rewardToken.address], {from: voter1}).should.be.rejectedWith(EVMRevert);
  });
  
});
