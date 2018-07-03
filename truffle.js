require('babel-register')({
  ignore: /node_modules\/(?!openzeppelin-solidity\/test\/helpers)/
})
require('babel-polyfill')

module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "5777"
    },
    local: {  // locahost private chain
      host: 'localhost',
      port: 8545,
      network_id: '*'
    }
  },

  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
