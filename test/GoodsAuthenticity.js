const {
  loadFixture
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect, assert } = require("chai");

describe("GoodsAuthenticity", function () {
  const category = "Ferrari";
  const name = "F150";
  const eventGoodName = "GoodChanged";
  const eventTransferName = "Transfer";

  async function deploy() {
    const [owner, user1, user2] = await ethers.getSigners();
    const GoodsAuthenticity = await ethers.getContractFactory(
      "GoodsAuthenticity"
    );
    const goodsAuthenticity = await GoodsAuthenticity.deploy();
    return { goodsAuthenticity, owner, user1, user2 };
  }

  async function mintGood(goodsAuthenticity) {
    const txResponse = await goodsAuthenticity.mintGood(name, category);
    return (txReceipt = await txResponse.wait());
  }

  async function transferGood(goodsAuthenticity, from, to, goodId) {
    const txResponse = await goodsAuthenticity.safeTransferFrom(
      from,
      to,
      goodId
    );
    return (txReceipt = await txResponse.wait());
  }

  describe("Mint new good", function () {
    it("Should set the right name", async function () {
      const { goodsAuthenticity } = await loadFixture(deploy);
      const txReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txReceipt.logs.find((event) => event.eventName === eventTransferName)
          .args[2]
      );
      expect(await goodsAuthenticity.getGoodName(goodId)).to.equal(name);
    });

    it("Should set the right category", async function () {
      const { goodsAuthenticity } = await loadFixture(deploy);
      const txReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txReceipt.logs.find((event) => event.eventName === eventTransferName)
          .args[2]
      );
      expect(await goodsAuthenticity.getGoodCategory(goodId)).to.equal(
        category
      );
    });

    it("Should set the creator to the owner history", async function () {
      const { goodsAuthenticity, owner } = await loadFixture(deploy);
      const txReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txReceipt.logs.find((event) => event.eventName === eventTransferName)
          .args[2]
      );
      expect(
        (await goodsAuthenticity.getGoodOwnerHistory(goodId))[0]
      ).to.equals(owner.address);
    });

    it("Should set the owner to the goods by owner list", async function () {
      const { goodsAuthenticity, owner } = await loadFixture(deploy);
      const txReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txReceipt.logs.find((event) => event.eventName === eventTransferName)
          .args[2]
      );
      const txReceipt2 = await mintGood(goodsAuthenticity);
      const goodId2 = parseInt(
        txReceipt2.logs.find((event) => event.eventName === eventTransferName)
          .args[2]
      );
      expect(
        (await goodsAuthenticity.getGoodsByOwner(owner.address))[0]
      ).to.equals(goodId);
      expect(
        (await goodsAuthenticity.getGoodsByOwner(owner.address))[1]
      ).to.equals(goodId2);
    });

    it("Should emit an event with the good data", async function () {
      const { goodsAuthenticity, owner } = await loadFixture(deploy);
      const txReceipt = await mintGood(goodsAuthenticity);
      assert(txReceipt);

      const eventLog = txReceipt.logs.find(
        (event) => event.eventName === eventGoodName
      );
      assert(eventLog);

      const eventArgs = eventLog.args;
      expect(eventArgs[1]).to.equals(owner.address);
      expect(eventArgs[2].toString()).to.equals(name);
      expect(eventArgs[3].toString()).to.equals(category);
    });

    it("Should set the right tokenURI", async function () {
      const { goodsAuthenticity, owner } = await loadFixture(deploy);
      const txReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txReceipt.logs.find((event) => event.eventName === eventTransferName)
          .args[2]
      );
      const tokenURI = await goodsAuthenticity.tokenURI(goodId);
      const tokenURIObject = JSON.parse(
        atob(tokenURI.replace("data:application/json;base64,", ""))
      );

      expect(tokenURIObject.name).to.equals(name);
      expect(tokenURIObject.category).to.equals(category);
      expect(ethers.getAddress(tokenURIObject.owner)).to.equals(owner.address);
    });
  });

  describe("Transfer a good", function () {
    it("Should set the last owner to the owner history", async function () {
      const { goodsAuthenticity, owner, user1 } = await loadFixture(deploy);
      const txMintReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txMintReceipt.logs.find(
          (event) => event.eventName === eventTransferName
        ).args[2]
      );
      await transferGood(goodsAuthenticity, owner, user1, goodId);
      expect(
        (await goodsAuthenticity.getGoodOwnerHistory(goodId))[0]
      ).to.equals(owner.address);
    });

    it("Should set the new owner to the owner history", async function () {
      const { goodsAuthenticity, owner, user1 } = await loadFixture(deploy);
      const txMintReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txMintReceipt.logs.find(
          (event) => event.eventName === eventTransferName
        ).args[2]
      );
      await transferGood(goodsAuthenticity, owner, user1, goodId);
      expect(
        (await goodsAuthenticity.getGoodOwnerHistory(goodId))[1]
      ).to.equals(user1.address);
    });

    it("Should set the owner to the goods by owner list", async function () {
      const { goodsAuthenticity, owner, user1 } = await loadFixture(deploy);
      const txReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txReceipt.logs.find((event) => event.eventName === eventTransferName)
          .args[2]
      );
      await transferGood(goodsAuthenticity, owner, user1, goodId);
      expect(
        (await goodsAuthenticity.getGoodsByOwner(user1.address))[0]
      ).to.equals(goodId);
    });

    it("Should set the right tokenURI", async function () {
      const { goodsAuthenticity, owner, user1 } = await loadFixture(deploy);
      const txReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txReceipt.logs.find((event) => event.eventName === eventTransferName)
          .args[2]
      );
      await transferGood(goodsAuthenticity, owner, user1, goodId);
      const tokenURI = await goodsAuthenticity.tokenURI(goodId);
      const tokenURIObject = JSON.parse(
        atob(tokenURI.replace("data:application/json;base64,", ""))
      );
      expect(tokenURIObject.name).to.equals(name);
      expect(tokenURIObject.category).to.equals(category);
      expect(ethers.getAddress(tokenURIObject.owner)).to.equals(user1.address);
    });

    it("Should emit an event with the good data", async function () {
      const { goodsAuthenticity, owner, user1 } = await loadFixture(deploy);
      const txMintReceipt = await mintGood(goodsAuthenticity);
      const goodId = parseInt(
        txMintReceipt.logs.find(
          (event) => event.eventName === eventTransferName
        ).args[2]
      );
      const txTransferReceipt = await transferGood(
        goodsAuthenticity,
        owner,
        user1,
        goodId
      );
      assert(txTransferReceipt);

      const eventLog = txTransferReceipt.logs.find(
        (event) => event.eventName === eventGoodName
      );
      assert(eventLog);

      const eventArgs = eventLog.args;
      expect(eventArgs[1]).to.equals(user1.address);
      expect(eventArgs[2].toString()).to.equals(name);
      expect(eventArgs[3].toString()).to.equals(category);
    });
  });

  describe("Return an error if the good does not exist", function () {
    it("When requesting the tokenURI", async function () {
      const { goodsAuthenticity } = await loadFixture(deploy);
      expect(goodsAuthenticity.tokenURI(1)).to.be.revertedWith(
        "GoodsAuthenticity__QueryFor_NonExistentGood"
      );
    });

    it("When requesting the tokenURI", async function () {
      const { goodsAuthenticity } = await loadFixture(deploy);
      expect(goodsAuthenticity.getGoodOwnerHistory(1)).to.be.revertedWith(
        "GoodsAuthenticity__QueryFor_NonExistentGood"
      );
    });

    it("When requesting the tokenURI", async function () {
      const { goodsAuthenticity } = await loadFixture(deploy);
      expect(goodsAuthenticity.getGoodName(1)).to.be.revertedWith(
        "GoodsAuthenticity__QueryFor_NonExistentGood"
      );
    });

    it("When requesting the tokenURI", async function () {
      const { goodsAuthenticity } = await loadFixture(deploy);
      expect(goodsAuthenticity.getGoodCategory(1)).to.be.revertedWith(
        "GoodsAuthenticity__QueryFor_NonExistentGood"
      );
    });
  });
});
