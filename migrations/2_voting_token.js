
let VotingToken = artifacts.require("VotingToken");
let StandardToken = artifacts.require("StandardToken");

module.exports = function (deployer) {

	deployer.then(async function () {	
		const rewardToken = await deployer.deploy(StandardToken, "Reward", "XXX", 8, 1e9*1e8);

        await deployer.deploy(
            VotingToken,
            "SwissBorg Referendum 2",
            "RSB2",
            8,
            rewardToken.address,
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
