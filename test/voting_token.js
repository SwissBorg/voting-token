
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
  const votingAddress4 = "0x0000000000000000000000000000000000000003";
  const votingAddress5 = "0x0000000000000000000000000000000000000003";
  const votingAddress6 = "0x0000000000000000000000000000000000000003";
  const totalRewardSupply = 1e15;

  beforeEach(async function () {
    this.votingAddresses = [
        votingAddress1, votingAddress2, votingAddress3, votingAddress4, votingAddress5, votingAddress6
    ];

    this.rewardToken = await StandardToken.new("Reward Token", "XXX", 8, 1e9*1e8);
    this.votingToken = await VotingToken.new(
      "Voting Token",
      "RSB",
      8,
      this.rewardToken.address,
      this.votingAddresses
      );
  
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

    (await this.votingToken.opened()).should.be.equal(false);
    (await this.votingToken.closed()).should.be.equal(false);
    (await this.votingToken.numberOfAlternatives()).should.be.bignumber.equal(6);
  });

  it("should read the list of voting addresses", async function () {
    (await this.votingToken.votingAddresses(0)).should.be.equal(votingAddress1);
    (await this.votingToken.votingAddresses(1)).should.be.equal(votingAddress2);
    (await this.votingToken.votingAddresses(2)).should.be.equal(votingAddress3);
    (await this.votingToken.votingAddresses(3)).should.be.equal(votingAddress3);
    (await this.votingToken.votingAddresses(4)).should.be.equal(votingAddress3);
    (await this.votingToken.votingAddresses(5)).should.be.equal(votingAddress3);
    this.votingToken.votingAddresses(6).should.be.rejectedWith(EVMThrow);
  });

  it("should allow the owner to open the poll, only once", async function () {
    (await this.votingToken.opened()).should.be.equal(false);
    await this.votingToken.open();
    (await this.votingToken.opened()).should.be.equal(true);

    // revert on second open()
    this.votingToken.open().should.be.rejectedWith(EVMRevert);
  });

  it("should revert on anyone else trying to open the poll", async function () {
    this.votingToken.open({from: voter1}).should.be.rejectedWith(EVMRevert);
  });

  it("should allow the owner to close the poll, only once", async function () {
    (await this.votingToken.closed()).should.be.equal(false);
    await this.votingToken.open();
    await this.votingToken.close();
    (await this.votingToken.closed()).should.be.equal(true);

    // revert on second close()
    this.votingToken.close().should.be.rejectedWith(EVMRevert);
  });

  it("should revert on trying to close when no opened", async function () {
    this.votingToken.close().should.be.rejectedWith(EVMRevert);
  });

  it("should revert on anyone else trying to close the poll", async function () {
    await this.votingToken.open();
    this.votingToken.close({from: voter1}).should.be.rejectedWith(EVMRevert);
  });

  it("should allow the owner to mint", async function () {
    await this.votingToken.mint(voter1, 1000);
    (await this.votingToken.totalSupply()).should.be.bignumber.equal(1000);
    (await this.votingToken.balanceOf(voter1)).should.be.bignumber.equal(1000);
  });

  it("should revert on anyone else trying to mint", async function () {
    this.votingToken.mint(voter1, 1000, {from: voter1}).should.be.rejectedWith(EVMRevert);
  });

  it("should revert when mintting in voting period", async function () {
    await this.votingToken.open();
    this.votingToken.mint(voter1, 1000).should.be.rejectedWith(EVMRevert);
  });

  it("should allow the owner to batch-mint", async function () {
    await this.votingToken.batchMint([voter1, voter2], [1000, 2000]);
    (await this.votingToken.totalSupply()).should.be.bignumber.equal(3000);
    (await this.votingToken.balanceOf(voter1)).should.be.bignumber.equal(1000);
    (await this.votingToken.balanceOf(voter2)).should.be.bignumber.equal(2000);
  });

  it("should revert on anyone else trying to batch-mint", async function () {
    this.votingToken.batchMint([voter1, voter2], [1000, 2000], {from: voter1}).should.be.rejectedWith(EVMRevert);
  });

  it("should revert when batch-mintting in voting period", async function () {
    await this.votingToken.open();
    this.votingToken.batchMint([voter1, voter2], [1000, 2000]).should.be.rejectedWith(EVMRevert);
  });

  it("should allow transfer tokens before start time", async function () {
    await this.votingToken.mint(voter1, 1000);
    await this.votingToken.transfer(voter2, 500, {from: voter1});

    (await this.votingToken.balanceOf(voter1)).should.be.bignumber.equal(500);
    (await this.votingToken.balanceOf(voter2)).should.be.bignumber.equal(500);
  });

  it("should revert on transfer to a voting address before start time", async function () {
    await this.votingToken.mint(voter1, 1000);
    this.votingToken.transfer(votingAddress1, 1000, {from: voter1}).should.be.rejectedWith(EVMRevert);
  });

  it("should revert on transfer to a voting address after end time", async function () {
    await this.votingToken.mint(voter1, 1000);

    await this.votingToken.open();
    await this.votingToken.close();

    this.votingToken.transfer(votingAddress1, 1000, {from: voter1}).should.be.rejectedWith(EVMRevert);
  });

  it("should give reward when transferring in voting period", async function () {
    const votingTokens = 1000;
    const expectedReward1 = 10;
    const expectedReward2 = 166666666666;

    await this.votingToken.mint(voter1, votingTokens);
    (await this.rewardToken.balanceOf(this.votingToken.address)).should.be.bignumber.equal(totalRewardSupply);

    await this.votingToken.open();

    await this.votingToken.transfer(votingAddress1, votingTokens, {from: voter1}).should.be.fulfilled;

    (await this.votingToken.balanceOf(voter1)).should.be.bignumber.equal(0);
    (await this.votingToken.balanceOf(votingAddress1)).should.be.bignumber.equal(votingTokens);
    
    (await this.rewardToken.balanceOf(voter1)).should.be.bignumber.equal(expectedReward1);
    (await this.rewardToken.balanceOf(this.votingToken.address)).should.be.bignumber.equal(totalRewardSupply - expectedReward1);
  });

  it("can be destroyed by the owner", async function () {
    const beforeBalance1 = (await this.rewardToken.balanceOf(owner)).toNumber();

    (await this.rewardToken.balanceOf(this.votingToken.address)).should.be.bignumber.equal(totalRewardSupply);

    await this.votingToken.destroy([this.rewardToken.address]).should.be.fulfilled;

    (await this.rewardToken.balanceOf(owner)).should.be.bignumber.equal(beforeBalance1 + totalRewardSupply);
    (await this.rewardToken.balanceOf(this.votingToken.address)).should.be.bignumber.equal(0);
  });

  it("should revert on anyone else trying to destroy", async function () {
    this.votingToken.destroy([this.rewardToken.address], {from: voter1}).should.be.rejectedWith(EVMRevert);
  });
  
});
