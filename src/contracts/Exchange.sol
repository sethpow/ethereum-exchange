// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Token.sol";

/* Handles all behavior of decentralized exchange
        deposit & withdraw funds
        manage orders - make & cancel
        handle trades; charge fees
*/

/*  TODO:
    [X] Set the fee account (account where fees go when trades are issued)
    [X] Deposit Ether
    [ ] Withdraw Ether
    [X] Deposit tokens
    [ ] Withdraw tokens
    [ ] Check balances
    [ ] Make order(s)
    [ ] Cancel order(s)
    [ ] Fill order(s)
    [ ] Charge fees
*/

contract Exchange {
    using SafeMath for uint;

    // Variables
    address public feeAccount;  // account that receives exchange fees
    uint256 public feePercent;  // fee percentage
    // keep track of amount of ether inside the tokens mapping
    address constant ETHER = address(0);    // store Ether in tokens mapping with blank address

    // all tokens deposited => user address who deposited tokens themselves => user balance
    mapping(address => mapping(address => uint256)) public tokens;

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);

    constructor(address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // send Ether back to user if they send it to smart contract
    function() external {
        revert();
    }

    function depositEther() payable public {
        // how much ether each person has; deposit event happened
            //                                      sender          ether amount
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);

        // send ether to exchange; keep track of balance
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    //                      which token?    how much?
    function depositToken(address _token, uint256 _amount) public {
        // dont allow Ether deposits
        require(_token != ETHER);

        // send tokens to this contract
        // if true, continue; if not, transfer does not happen
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        
        // track balance; manage deposits - update balance
            // token address, user address, update amount
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);

        // emit event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }
    
}