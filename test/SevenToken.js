const SevenToken = artifacts.require("../contracts/SevenToken.sol");
contract("SevenToken", function (accounts) {
  let tokenInstance;
  it("initializes the contract with the correct values", async function () {
    let tokenInstance = await SevenToken.deployed();
    let name = await tokenInstance.name();
    assert.equal(name, "Seven", "has the correct name");
    let symbol = await tokenInstance.symbol();
    assert.equal(symbol, "7", "has the correct symbol");
    let standard = await tokenInstance.standard();
    assert.equal(standard, "Seven Token v.Alpha", "has the correct standard");
  });

  it("allocates the initial supply upon deployment", async function () {
    let tokenInstance = await SevenToken.deployed();
    let totalSupply = await tokenInstance.totalSupply();
    assert.equal(
      totalSupply.toNumber(),
      10000000,
      "sets the total supply to 10,000,000"
    );
    let adminBalance = await tokenInstance.balanceOf(accounts[0]);
    assert.equal(
      adminBalance.toNumber(),
      10000000,
      "it allocates the initial supply to the admin account"
    );
  });

  it("transfers token ownership", async function () {
    let tokenInstance = await SevenToken.deployed();
    tokenInstance.transfer
      .call(accounts[1], 9999999999999)
      .then(assert.fail)
      .catch(function (error) {
        assert(error.message, "error message must contain revert");
      });

    let success = await tokenInstance.transfer.call(accounts[1], 2500000, {
      from: accounts[0],
    });
    assert.equal(success, true, "it returns true");
    let receipt = await tokenInstance.transfer(accounts[1], 2500000, {
      from: accounts[0],
    });
    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(
      receipt.logs[0].event,
      "Transfer",
      'should be the "Transfer" event'
    );
    assert.equal(
      receipt.logs[0].args._from,
      accounts[0],
      "logs the account the tokens are transferred from"
    );
    assert.equal(
      receipt.logs[0].args._to,
      accounts[1],
      "logs the account the tokens are transferred to"
    );
    assert.equal(
      receipt.logs[0].args._value,
      2500000,
      "logs the transfer amount"
    );
    let balanceAccount1 = await tokenInstance.balanceOf(accounts[1]);
    assert.equal(
      balanceAccount1.toNumber(),
      2500000,
      "adds the amount to the receiving account"
    );
    let balanceAccount0 = await tokenInstance.balanceOf(accounts[0]);
    assert.equal(
      balanceAccount0.toNumber(),
      7500000,
      "deducts the amount from the sending account"
    );
  });

  it("approves tokens for delegated transfer", async function () {
    let tokenInstance = await SevenToken.deployed();
    let success = await tokenInstance.approve.call(accounts[1], 1000);
    assert.equal(success, true, "it returns true");

    let receipt = await tokenInstance.approve(accounts[1], 1000, {
      from: accounts[0],
    });
    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(
      receipt.logs[0].event,
      "Approval",
      'should be the "Approval" event'
    );
    assert.equal(
      receipt.logs[0].args._owner,
      accounts[0],
      "logs the account the tokens are authorized by"
    );
    assert.equal(
      receipt.logs[0].args._owner,
      accounts[0],
      "logs the account the tokens are authorized by"
    );
    assert.equal(
      receipt.logs[0].args._spender,
      accounts[1],
      "logs the account the tokens are authorized to"
    );
    assert.equal(receipt.logs[0].args._value, 1000, "logs the transfer amount");
    let allowance = await tokenInstance.allowance(accounts[0], accounts[1]);
    assert.equal(
      allowance.toNumber(),
      1000,
      "stores the allowance for delegated trasnfer"
    );
  });

  it("handles delegated token transfers", async function () {
    let tokenInstance = await SevenToken.deployed();
    let fromAccount = accounts[2];
    let toAccount = accounts[3];
    let spendingAccount = accounts[4];
    let receipt1 = await tokenInstance.transfer(fromAccount, 1000, {
      from: accounts[0],
    });
    let receipt2 = await tokenInstance.approve(spendingAccount, 100, {
      from: fromAccount,
    });
    tokenInstance
      .transferFrom(fromAccount, toAccount, 99999, { from: spendingAccount })
      .then(assert.fail)
      .catch(function (error) {
        assert(error.message, "cannot transfer value larger than balance");
      });
    tokenInstance
      .transferFrom(fromAccount, toAccount, 200, { from: spendingAccount })
      .then(assert.fail)
      .catch(function (error) {
        assert(
          error.message,
          "cannot transfer value larger than approved amount"
        );
      });
    let success1 = await tokenInstance.transferFrom.call(
      fromAccount,
      toAccount,
      100,
      { from: spendingAccount }
    );
    assert.equal(success1, true);
    let receipt3 = await tokenInstance.transferFrom(
      fromAccount,
      toAccount,
      100,
      { from: spendingAccount }
    );
    assert.equal(receipt3.logs.length, 1, "triggers one event");
    assert.equal(
      receipt3.logs[0].event,
      "Transfer",
      'should be the "Transfer" event'
    );
    assert.equal(
      receipt3.logs[0].args._from,
      fromAccount,
      "logs the account the tokens are transferred from"
    );
    assert.equal(
      receipt3.logs[0].args._to,
      toAccount,
      "logs the account the tokens are transferred to"
    );
    assert.equal(receipt3.logs[0].args._value, 100, "logs the transfer amount");

    let balance = await tokenInstance.balanceOf(fromAccount);
    assert.equal(
      balance.toNumber(),
      900,
      "deducts the amount from the sending account"
    );

    let balance1 = await tokenInstance.balanceOf(toAccount);
    assert.equal(
      balance1.toNumber(),
      100,
      "adds the amount from the receiving account"
    );
    let allowance = await tokenInstance.allowance(fromAccount, spendingAccount);
    assert.equal(
      allowance.toNumber(),
      0,
      "deducts the amount from the allowance"
    );
  });
});
