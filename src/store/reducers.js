import { combineReducers } from 'redux';
// redux reducers

// handle all web3 actions when blockchain is loaded
function web3(state = {}, action) {
    switch (action.type) {
        // when action comes in, will handle WEB3_LOADED; update state, and give back connection key with actual web3 connection
        case 'WEB3_LOADED':
            return {...state, connection: action.connection} // update state
        case 'WEB3_ACCOUNT_LOADED':
            return {...state, account: action.account}
        default:
            return state;
    }
}

// handle token loading
function token(state = {}, action) {
    switch (action.type) {
        case 'TOKEN_LOADED':
            return {...state, loaded: true, contract: action.contract}
        default:
            return state;
    }
}

// handle exchange loading
function exchange(state = {}, action) {
    switch (action.type) {
        case 'EXCHANGE_LOADED':
            return {...state, loaded: true, contract: action.contract}
        case 'CANCELLED_ORDERS_LOADED':
            return {...state, cancelledOrders: { loaded: true, data: action.cancelledOrders }}
        case 'FILLED_ORDERS_LOADED':
            return {...state, filledOrders: { loaded: true, data: action.filledOrders }}
        case 'ALL_ORDERS_LOADED':
            return {...state, allOrders: { loaded: true, data: action.allOrders }}
        default:
            return state;
    }
}

// root reducer to combine all reducers
const rootReducer = combineReducers({
    // return all reducers
    web3: web3,
    token: token,
    exchange: exchange
})

export default rootReducer;