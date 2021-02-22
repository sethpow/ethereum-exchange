import Web3 from 'web3'
import {
    web3Loaded,
    web3AccountLoaded,
    tokenLoaded,
    exchangeLoaded,
    cancelledOrdersLoaded,
    filledOrdersLoaded,
    allOrdersLoaded
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