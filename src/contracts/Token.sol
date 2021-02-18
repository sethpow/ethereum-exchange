// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Token {
    using SafeMath for uint;

    // Variables
    string public name = "XYN Token";
    string public symbol = "XYN";
    uint256 public decimals = 18;
    uint256 public totalSupply ;
    // track balances
    mapping (address => uint256) public balanceOf;

    // allowance; how many tokens exchange can spend
    //      user approval
    //                  exchange address; places user approval exists
    mapping(address => mapping(address => uint256)) public allowance;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() public {
        totalSupply = 1000000 * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    // send tokens
    function transfer(address _to, uint256 _value) public returns (bool success){
        require(balanceOf[msg.sender] >= _value);
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function _transfer(address _from, address _to, uint256 _value) internal {
        require(_to != address(0));
        balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
    }

    // Approve tokens
    function approve(address _spender, uint256 _value) public returns (bool success){
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    // Transfer from fn; allow exchange to spend tokens/make trade
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success){
        // safeguard against insufficient amounts
        require(_value <= balanceOf[_from]);    // be less/equal than value of from account; spender needs enough tokens to complete tx
        require(_value <= allowance[_from][msg.sender]);    // value must be less/equal than approved amount for the exchange

        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        _transfer(_from, _to, _value);
        return true;
    }

}