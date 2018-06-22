
let VotingToken = artifacts.require("VotingToken");
let StandardToken = artifacts.require("StandardToken");

module.exports = function (deployer) {

	deployer.then(async function () {	
		const rewardToken1 = await deployer.deploy(StandardToken, "Reward 1", "XXX1", 8, 1e9*1e8);
		const rewardToken2 = await deployer.deploy(StandardToken, "Reward 2", "XXX2", 8, 1e9*1e8);

        await deployer.deploy(
            VotingToken,
            "SwissBorg Referendum 2",
            "RSB2",
            8,
            rewardToken1.address,
            rewardToken2.address,
            [
                "0x0",
                "0x1",
                "0x2",
                "0x3",
                "0x4",
                "0x5"
            ]
        );

	})
};
