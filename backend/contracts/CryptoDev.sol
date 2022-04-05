// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {

  bool public presaleStarted;
  
  uint256 public presaleEnded;
  
  uint256 public maxTokenIds = 20;
  
  uint256 public tokenIds;

  uint256 public _price = 0.01 ether;
  
  string baseTokenURI;

  bool _paused;

  IWhitelist whitelist;

  modifier onlyWhenNotPaused() {
    require(!_paused, "Contract currently paused!");
    _;
  }

  constructor (string memory _baseTokenURI, address _whitelistContract) ERC721("Crypto Devs", "CD") {
    whitelist = IWhitelist(_whitelistContract);
    baseTokenURI = _baseTokenURI;
  }

  function startPresale() public onlyOwner {
    presaleStarted = true;
    presaleEnded = block.timestamp + 15 minutes;
  }

  function presaleMint() public payable onlyWhenNotPaused {
    require(presaleStarted && block.timestamp < presaleEnded, "Presale ended");
    require(whitelist.whitelistAddresses(msg.sender), "You are not on the whitelist");
    require(tokenIds < maxTokenIds, "Exceeded the limit");
    require(msg.value >= _price, "Ether sent is not correct");
    
    tokenIds += 1;
    
    _safeMint(msg.sender, tokenIds); 
  }

  function mint() public payable onlyWhenNotPaused {
    require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended");
    require(tokenIds < maxTokenIds, "Exceeded the limit");
    require(msg.value >= _price, "Ether sent is not correct");

    tokenIds += 1;

    _safeMint(msg.sender, tokenIds);
  }

  function _baseURI() internal view override returns (string memory) {
    return baseTokenURI;
  }

  function setPaused(bool val) public onlyOwner {
    _paused = val;
  }

  function withdraw() public onlyOwner {
    address _owner = owner();
    uint256 amount = address(this).balance; // address of the smart contract.
    (bool sent, ) = _owner.call{value: amount}("");
    require(sent, "Failed to send ether");
  }

  receive() external payable {}

  fallback() external payable {}
}
