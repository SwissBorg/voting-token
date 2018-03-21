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

let VotingToken = artifacts.require("VotingToken");
let ERC20Token =  artifacts.require("ERC20Token");

module.exports = (deployer) => {

	deployer.then(async () => {	
		await deployer.deploy(ERC20Token, "CHSB", "SwissBorg", 1e9*1e8)

		await deployer.deploy(
				VotingToken, "RSB1", "SwissBorg Referendum 1", 1e9*1e8,
				"What should the SwissBorg investment platform be?",
				"Mobile App", "Web App",
				web3.personal.newAccount(), // mobile choice
				web3.personal.newAccount(), // web choice
				web3.personal.newAccount(), // blank vote
				ERC20Token.address,
				web3.personal.newAccount()) // reward wallet
	})
};
