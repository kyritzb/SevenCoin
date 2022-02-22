const SevenToken = artifacts.require("../contracts/SevenToken.sol");

module.exports = async function (deployer) {
  await deployer.deploy(SevenToken, 10000000);
};
