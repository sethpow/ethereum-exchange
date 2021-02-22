// web3 loaded action
    // adding web3 connection inside redux store
export function web3Loaded(connection) {
    return {
        type: 'WEB3_LOADED',
        connection: connection
    }
}

// load account
export function web3AccountLoaded(account) {
    return {
        type: 'WEB3_ACCOUNT_LOADED',
        account: account
    }
}

// load token contract
export function tokenLoaded(contract) {
    return {
        type: 'TOKEN_LOADED',
        contract: contract
    }
}

// load exchange contract
export function exchangeLoaded(contract) {
    return {
        type: 'EXCHANGE_LOADED',
        contract: contract
    }
}

export function cancelledOrdersLoaded(cancelledOrders) {
    return {
        type: 'CANCELLED_ORDERS_LOADED',
        cancelledOrders
    }
}

export function filledOrdersLoaded(filledOrders) {
    return {
        type: 'FILLED_ORDERS_LOADED',
        filledOrders
    }
}

export function allOrdersLoaded(allOrders) {
    return {
        type: 'ALL_ORDERS_LOADED',
        allOrders
    }
}