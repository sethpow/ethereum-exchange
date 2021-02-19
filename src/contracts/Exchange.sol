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
    [X] Withdraw Ether
    [X] Deposit tokens
    [X] Withdraw tokens
    [X] Check balances
    [X] Make order(s)
    [X] Cancel order(s)
    [X] Fill order(s)
    [X] Charge fees
*/

contract Exchange {
    using SafeMath for uint;

    // Variables
    address public feeAccount;  // account that receives exchange fees
    uint256 public feePercent;  // fee percentage
    // keep track of amount of ether inside the tokens mapping
    address constant ETHER = address(0);    // store Ether in tokens mapping with blank address
    // keep track of # of orders
    uint256 public orderCount;

    // *** MAPPINGS ***
    // all tokens deposited => user address who deposited tokens themselves => user balance
    mapping(address => mapping(address => uint256)) public tokens;
    // Way to store the order; store on blockchain in a mapping
    mapping(uint256 => _Order) public orders;
    // way to track cancelled orders
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    // trigger event anytime order is made
    event Order(
        uint256     id,
        address     user,
        address     tokenGet,
        uint256     amountGet,
        address     tokenGive,
        uint256     amountGive,
        uint256     timestamp
    );
    event Cancel(
        uint256     id,
        address     user,
        address     tokenGet,
        uint256     amountGet,
        address     tokenGive,
        uint256     amountGive,
        uint256     timestamp
    );
    event Trade(
        uint256     id,
        address     user,       // user who created order
        address     tokenGet,
        uint256     amountGet,
        address     tokenGive,
        uint256     amountGive,
        address     userFill,   // user who filled order
        uint256     timestamp
    );


    // *** ORDER ***
    // Way to model the order
    struct _Order {
        uint256     id;
        address     user;
        address     tokenGet;
        uint256     amountGet;
        address     tokenGive;
        uint256     amountGive;
        uint256     timestamp;
    }
    // Way to store the order; store on blockchain in a mapping
        // (see above 'orders' mapping)
    // Add the order to storage/retrieve the order
        // (see 'makeOrder' fn below)


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

    function withdrawEther(uint256 _amount) public {
        // sufficient balance; make sure user has enough
        require(tokens[ETHER][msg.sender] >= _amount);
        // reduce ether amount
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        // send ether back to user
        msg.sender.transfer(_amount);
        // Withdraw event
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
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

    function withdrawToken(address _token, uint256 _amount) public {
        // failure cases
        require(_token != ETHER);
        require(tokens[_token][msg.sender] >= _amount);

        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        // transfer to user from smart contract
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns (uint256){
        return tokens[_token][_user];
    }

    // Add the order to storage/retrieve the order
    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
        orderCount = orderCount.add(1);
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            now
        );
        // trigger event anytime order is made
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    }
    
    function cancelOrder(uint256 _id) public {
        // fetch order from mapping
        // _Order type var (_order) fetched from orders mapping by _id; fetch out of storage from the blockchain with the mapping
        _Order storage _order = orders[_id];

        // make sure order user is same as 'user' calling this fn; must be "my" order
        require(address(_order.user) == msg.sender);

        // must be a valid order; must exist
        require(_order.id == _id);

        // order stays in original mapping; create new mapping for cancelled orders
            // if an order is in orderCancelled mapping, it cannot be fetched
        orderCancelled[_id] = true;

        // trigger event anytime order is made
        emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
    }

    function fillOrder(uint256 _id) public {
        // filling a valid order
        require(_id > 0 && _id <= orderCount);

        // ensure order is not cancelled
        require(!orderFilled[_id]);
        require(!orderCancelled[_id]);

        // fetch order from storage
        _Order storage _order = orders[_id];

        // execute trade, charge fees, emit trade event FN
        _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);

        // mark order as filled
        orderFilled[_order.id] = true;
    }

    function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
        // the fee is paid by the user that fills the order, aka msg.sender
            // deducted from _amountGet
        uint256 _feeAmount = _amountGive.mul(feePercent).div(100);

        // execute trade
            // msg.sender   person filling order
            // _user        person who created order
        // charge fees
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
        // charge fees
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);
        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);

        // emit trade event;  user created order                                    user filled order
        emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
    }

}