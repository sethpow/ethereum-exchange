import Web3 from 'web3'
import {
    web3Loaded,
    web3AccountLoaded,
    tokenLoaded,
    exchangeLoaded,
    cancelledOrdersLoaded,
    filledOrdersLoaded,
    allOrdersLoaded,
    orderCancelling,
    orderCancelled
} from './actions'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'

// create middleware that shows actions that are triggered anytime something happens in dApp
    // dispatch - trigger an action and dispatch it with redux
        // whenever dispatch is called, it will be injected inside one of the reducers created
        // the reducer will handle that action and update state

// handle all blockchain interactions
export const loadWeb3 = async (dispatch) => {
    if(typeof window.ethereum!=='undefined'){
      const web3 = new Web3(window.ethereum)
      dispatch(web3Loaded(web3))
      return web3
    } else {
      window.alert('Please install MetaMask')
      window.location.assign("https://metamask.io/")
    }
}

export const loadAccount = async (web3, dispatch) => {
    const accounts = await web3.eth.getAccounts()   // fetch accounts
    const account = await accounts[0]
    if(typeof account !== 'undefined'){
      dispatch(web3AccountLoaded(account))
      return account
    } else {
      window.alert('Please login with MetaMask')
      return null
    }
}

export const loadToken = async (web3, networkId, dispatch) => {
    try {
      const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
      dispatch(tokenLoaded(token))
      return token
    } catch (error) {
      console.log('Contract not deployed to the current network. Please select another network with Metamask.')
      return null
    }
}

export const loadExchange = async (web3, networkId, dispatch) => {
    try {
      const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
      dispatch(exchangeLoaded(exchange))
      return exchange
    } catch (error) {
      console.log('Contract not deployed to the current network. Please select another network with Metamask.')
      return null
    }
}

export const loadAllOrders = async (exchange, dispatch) => {
// stash all fetched orders in redux store
    // fetch cancelled orders with the "Cancel" event stream
    const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest' })
    // format cancelled orders
    const cancelledOrders = cancelStream.map((event) => event.returnValues)
    // add cancelled orders to redux store
    dispatch(cancelledOrdersLoaded(cancelledOrders))

    // fetch filled orders with the "Trade" event stream
    const tradeStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest' })
    // format filled orders
    const filledOrders = tradeStream.map((event) => event.returnValues)
    // add filled orders to redux store
    dispatch(filledOrdersLoaded(filledOrders))
    
    // fetch all orders with the "Order" event stream
    const orderStream = await exchange.getPastEvents('Order', { fromBlock: 0, toBlock: 'latest' })
    // format order stream
    const allOrders = orderStream.map((event) => event.returnValues)
    // add filled orders to redux store
    dispatch(allOrdersLoaded(allOrders))
}

// cancel order on X onClick
    // redux dispatch, exchange smart contract provided by web3
export const cancelOrder = (dispatch, exchange, order, account) => {
    // copy of contract; allows for calling functions
        // exchange contract, cancelOrder method, send metadata (from account that is connected to blockchain)
    exchange.methods.cancelOrder(order.id).send({ from: account })
    // using event ommitter; waiting for event to fire/return "something"
    .on('transactionHash', (hash) => {      // wait for tx hash to come back from blockchain before triggering redux action that order is cancelling
        // dispatch redux action
        // show spinner while cancelling; wait for event to come back from blockchain before updating app to show cancelled order
        dispatch(orderCancelling())
    })
    .on('error', (error) => {
        console.log(error);
        window.alert('There was an error...');
    })
}

// subscribe to smart contract event    require redux dispatch and exchange contract
export const subscribeToEvents = async (exchange, dispatch) => {
    exchange.events.Cancel({}, (error, event) => {
        dispatch(orderCancelled(event.returnValues))
        // take that cancelled order and put in redux state
    })
}