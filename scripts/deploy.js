const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

async function main() {
  const goodsAuthenticity = await ethers.deployContract("GoodsAuthenticity");
  await goodsAuthenticity.waitForDeployment();
  console.log(`GoodsAuthenticity deployed to ${goodsAuthenticity.target}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(goodsAuthenticity.target);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
