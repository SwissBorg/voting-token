
let VotingToken = artifacts.require("VotingToken");
let StandardToken = artifacts.require("StandardToken");

module.exports = function (deployer) {

	deployer.then(async function () {	
		await deployer.deploy(StandardToken, "SwissBorg", "CHSB", 8, 1e9*1e8);

        await deployer.deploy(
            VotingToken,
            "SwissBorg Referendum 2",
            "RSB2",
            8,
            2524608000, // 2050-01-01
            2556144000, // 2051-01-01
            StandardToken.address,
            ["0x00faE685f2B2cd105ce7ca8dF0ab4c7FceAeAD69"]
        );

	})
};
