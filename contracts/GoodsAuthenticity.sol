// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "base64-sol/base64.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

error GoodsAuthenticity__QueryFor_NonExistentGood();

contract GoodsAuthenticity is ERC721Enumerable {
  struct Good {
    string name;
    string category;
    address[] ownerHistory;
  }

  uint256 private s_goodCounter;
  mapping(uint256 => Good) private s_goodInfo;

  event GoodChanged(
    uint256 indexed goodId,
    address owner,
    string name,
    string category
  );

  constructor() ERC721("GoodsAuthenticity", "GL") {
    s_goodCounter = 0;
  }

  function mintGood(string memory name, string memory category) public {
    uint256 goodId = s_goodCounter;
    s_goodInfo[goodId] = Good(name, category, new address[](1));
    _safeMint(msg.sender, goodId);
    s_goodCounter = s_goodCounter + 1;
  }

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 goodId,
    uint256 batchSize
  ) internal virtual override {
    if (s_goodInfo[goodId].ownerHistory[0] == address(0)) {
      s_goodInfo[goodId].ownerHistory[0] = to;
    } else {
      s_goodInfo[goodId].ownerHistory.push(to);
    }
    emit GoodChanged(
      goodId,
      to,
      s_goodInfo[goodId].name,
      s_goodInfo[goodId].category
    );
    super._afterTokenTransfer(from, to, goodId, batchSize);
  }

  function _baseURI() internal pure override returns (string memory) {
    return "data:application/json;base64,";
  }

  function tokenURI(
    uint256 goodId
  ) public view virtual override returns (string memory) {
    if (!_exists(goodId)) {
      revert GoodsAuthenticity__QueryFor_NonExistentGood();
    }
    return
      string(
        abi.encodePacked(
          _baseURI(),
          Base64.encode(
            bytes(
              abi.encodePacked(
                '{"name":"',
                s_goodInfo[goodId].name,
                '", "category":"',
                s_goodInfo[goodId].category,
                '", "owner":"',
                Strings.toHexString(uint256(uint160(ownerOf(goodId))), 20),
                '"}'
              )
            )
          )
        )
      );
  }

  function getGoodOwnerHistory(
    uint256 goodId
  ) public view returns (address[] memory) {
    if (!_exists(goodId)) {
      revert GoodsAuthenticity__QueryFor_NonExistentGood();
    }
    return s_goodInfo[goodId].ownerHistory;
  }

  function getGoodName(uint256 goodId) public view returns (string memory) {
    if (!_exists(goodId)) {
      revert GoodsAuthenticity__QueryFor_NonExistentGood();
    }
    return s_goodInfo[goodId].name;
  }

  function getGoodCategory(uint256 goodId) public view returns (string memory) {
    if (!_exists(goodId)) {
      revert GoodsAuthenticity__QueryFor_NonExistentGood();
    }
    return s_goodInfo[goodId].category;
  }

  function getGoodsByOwner(
    address owner
  ) public view returns (uint256[] memory) {
    uint256 balance = balanceOf(owner);
    uint256[] memory goodByOwner = new uint256[](balance);
    for (uint256 goodIndex = 0; goodIndex < balance; goodIndex++) {
      goodByOwner[goodIndex] = tokenOfOwnerByIndex(owner, goodIndex);
    }
    return goodByOwner;
  }
}
