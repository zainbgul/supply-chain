// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title RoleControl
 * @dev Basic role management: owner, admin, and user.
 */
contract RoleControl {
    address public owner;
    mapping(address => bool) public admins;
    mapping(address => bool) public users;

    event AdminAdded(address indexed account);
    event AdminRemoved(address indexed account);
    event UserAdded(address indexed account);
    event UserRemoved(address indexed account);

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "RoleControl: caller is not the owner");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "RoleControl: caller is not an admin");
        _;
    }
    
    modifier onlyUser() {
        require(users[msg.sender], "RoleControl: caller is not a registered user");
        _;
    }

    function addAdmin(address _account) public onlyOwner {
        admins[_account] = true;
        emit AdminAdded(_account);
    }

    function removeAdmin(address _account) public onlyOwner {
        admins[_account] = false;
        emit AdminRemoved(_account);
    }

    function addUser(address _account) public onlyAdmin {
        users[_account] = true;
        emit UserAdded(_account);
    }

    function removeUser(address _account) public onlyAdmin {
        users[_account] = false;
        emit UserRemoved(_account);
    }
    
    // New helper function for check admin status
    function isAdmin(address _addr) public view returns (bool) {
        return admins[_addr];
    }
}

/**
 * @title SupplyChain
 * @dev Implements a supply chain system using RoleControl for access.
 */
contract SupplyChain is RoleControl {
    uint256 public productCount;

    struct Product {
        uint256 id;
        string name;
        address manufacturer;
        address currentOwner;
        uint256 createdAt;
    }

    struct ProductEvent {
        string description;
        uint256 timestamp;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => ProductEvent[]) public productEvents;

    event ProductAdded(uint256 indexed productId, string name, address indexed manufacturer);
    event OwnershipTransferred(uint256 indexed productId, address indexed previousOwner, address indexed newOwner);
    event ProductEventAdded(uint256 indexed productId, string description);

    function addProduct(string memory _name) public onlyAdmin {
        productCount++;
        products[productCount] = Product({
            id: productCount,
            name: _name,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            createdAt: block.timestamp
        });
        emit ProductAdded(productCount, _name, msg.sender);
    }

    function transferProduct(uint256 _productId, address _newOwner) public {
        require(_productId > 0 && _productId <= productCount, "SupplyChain: Invalid product ID");
        Product storage product = products[_productId];
        require(msg.sender == product.currentOwner, "SupplyChain: caller is not the product owner");
        require(_newOwner != address(0), "SupplyChain: new owner is the zero address");
        
        address previousOwner = product.currentOwner;
        product.currentOwner = _newOwner;
        emit OwnershipTransferred(_productId, previousOwner, _newOwner);
    }

    function addProductEvent(uint256 _productId, string memory _description) public {
        require(_productId > 0 && _productId <= productCount, "SupplyChain: Invalid product ID");
        Product storage product = products[_productId];
        require(msg.sender == product.currentOwner, "SupplyChain: only the current owner can add events");
        
        productEvents[_productId].push(ProductEvent({ description: _description, timestamp: block.timestamp }));
        emit ProductEventAdded(_productId, _description);
    }

    function getProductEvents(uint256 _productId) public view returns (ProductEvent[] memory) {
        require(_productId > 0 && _productId <= productCount, "SupplyChain: Invalid product ID");
        return productEvents[_productId];
    }
}