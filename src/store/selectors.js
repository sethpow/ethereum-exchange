import { get, groupBy, maxBy, minBy, reject } from 'lodash'
import { createSelector } from 'reselect'
import moment from 'moment'
import { ETHER_ADDRESS, tokens, ether, GREEN, RED, formatBalance } from '../helpers'

// selectors - select/pull info out of redux, to display
// get - gets the value at path of obj; if the resolved value is undef, the defaultValue is returned in its place

// account selector
    // fetch state.web3.account from state
// const account = state => state.web3.account
const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)  // actual selector; account returns account

// check for web3 connection from state
const web3 = state => get(state, 'web3.connection')
export const web3Selector = createSelector(web3, w => w)

// contracts loaded selectors; make sure token & exchange are loaded
const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)

const token = state => get(state, 'token.contract')
export const tokenSelector = createSelector(token, t => t)

const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el)

const exchange = state => get(state, 'exchange.contract')
export const exchangeSelector = createSelector(exchange, e => e)

// const contractLoaded = state => tokenLoaded(state) && exchangeLoaded(state)
export const contractsLoadedSelector = createSelector(
    tokenLoaded,
    exchangeLoaded,
    (tl, el) => (tl && el)
)

const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
const allOrders = state => get(state, 'exchange.allOrders.data', [])

const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
export const cancelledOrdersSelector = createSelector(cancelledOrders, o => o)

const filledOrdersLoaded = state => get(state, "exchange.filledOrders.loaded", false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

// fill orders selector; list all trades that we can map over
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])
export const filledOrdersSelector = createSelector(
    filledOrders,
    (orders) => {
    // format orders to display
        // sort orders by price ascending
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)

        // decorate orders
        orders = decorateFilledOrders(orders)

        // sort orders by date descending
        orders = orders.sort((a, b) => b.timestamp - a.timestamp)
        return orders
    }
)

const decorateFilledOrders = (orders) => {
    // track prev order to compare history
    let previousOrder = orders[0]

    return (
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateFilledOrder(order, previousOrder)
            previousOrder = order   // update the prev order once its decorated
            return order
        })
    )
}

const decorateOrder = (order) => {
    let etherAmount
    let tokenAmount

    if(order.tokenGive === ETHER_ADDRESS){ // it is ethereum
        etherAmount = order.amountGive
        tokenAmount = order.amountGet
    } else {
        etherAmount = order.amountGet
        tokenAmount = order.amountGive
    }

    // calculate token price (5 decimal places) on order
    const precision = 100000
    let tokenPrice = (etherAmount / tokenAmount)
    tokenPrice = Math.round(tokenPrice * precision) / precision

    return ({
        ...order,
        etherAmount: ether(etherAmount),
        tokenAmount: tokens(tokenAmount),
        tokenPrice,
        formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D')
    })
}

const decorateFilledOrder = (order, previousOrder) => {
    // text color based on pricing
    return ({
        ...order,
        tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
    })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
    // evaluate token price

    // show green if only 1 order exists
    if(previousOrder.id === orderId){
        return GREEN
    }

    // show green price if order price higher than previous order
    // show red price if order price lower than previous order
    if(previousOrder.tokenPrice <= tokenPrice){
        return GREEN
    } else {
        return RED
    }
}


const openOrders = state => {
    const all = allOrders(state)
    const filled = filledOrders(state)
    const cancelled = cancelledOrders(state)

    const openOrders = reject(all, (order) => {
        const orderFilled = filled.some((o) => o.id === order.id)
        const orderCancelled = cancelled.some((o) => o.id === order.id)
        return(orderFilled, orderCancelled)
    })
    return openOrders
}


const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)

export const orderBookSelector = createSelector(
    openOrders,
    (orders) => {
        // decorate orders
        orders = decorateOrderBookOrders(orders)
        // separate into buy/sell orders
        orders = groupBy(orders, 'orderType')
        // fetch buy orders
        const buyOrders = get(orders, 'buy', [])
        // sort buy token price
        orders = {
            ...orders,
            buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
        }
        // fetch sell orders
        const sellOrders = get(orders, 'sell', [])
        // sort sell token price
        orders = {
            ...orders,
            sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
        }

        return orders
    }
)

const decorateOrderBookOrders = (orders) => {
    return (
        orders.map((order) => {
            order = decorateOrder(order)
            // decorate order book order
            order = decorateOrderBookOrder(order)

            return(order)
        })

    )
}

const decorateOrderBookOrder = (order) => {
    const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'

    return ({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED),
        orderFillAction: orderType === 'buy' ? 'sell' : 'buy'
    })
}

export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

export const myFilledOrdersSelector = createSelector(
    // our account
    account,
    filledOrders,
    (account, orders) => {
        // find our orders
        orders = orders.filter((o) => o.user === account || o.userFill === account)
        // sort by date ascending
        orders = orders.sort((a,b) => a.timestamp - b.timestamp)
        // decorate orders
        orders = decorateMyFilledOrders(orders, account)

        return orders
    }
)

const decorateMyFilledOrders = (orders, account) => {
    return (
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateMyFilledOrder(order, account)
            return(order)
        })
    )
}

const decorateMyFilledOrder = (order, account) => {
    const myOrder = order.user === account

    let orderType
    if(myOrder){
        orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
    } else {
        orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy'
    }

    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED),
        orderSign: (orderType === 'buy' ? '+' : '-')
    })
}

export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)

export const myOpenOrdersSelector = createSelector(
    account,
    openOrders,
    (account, orders) => {
        // filter orders created by current acc
        orders = orders.filter((o) => o.user === account)
        // decorate orders - add display attributes
        orders = decorateMyOpenOrders(orders)
        // sort orders by date descending
        orders = orders.sort((a,b) => b.timestamp - a.timestamp)

        return orders
    }
)

const decorateMyOpenOrders = (orders, account) => {
    return(
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateMyOpenOrder(order, account)

            return(order)
        })
    )
}

const decorateMyOpenOrder = (order, account) => {
    let orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'

    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED)
    })
}

// selector to fill in price chart
export const priceChartLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)
// selector formats price chart
export const priceChartSelector = createSelector(
    filledOrders,
    (orders) => {
        // select all orders; sort by timestamp
        orders = orders.sort((a,b) => a.timestamp = b.timestamp)
        // decorate orders - add display attributes
        orders = orders.map((o) => decorateOrder(o))

        // get last 2 orders for final price and price change
        let secondLastOrder, lastOrder
        // takes last 2 items out of array and assigns
        [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)

        // get last order price
        const lastPrice = get(lastOrder, 'tokenPrice', 0)

        // get second last order price
        const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

        return({
            lastPrice,
            lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
            series: [{
                // pass in orders
                data: buildGraphData(orders)
            }]
        })
    }
)

const buildGraphData = (orders) => {
    // group orders by hour for the graph; each candle is an hour
    orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())   // convert timestamp to unix timestamp
    
    // get each hour where data exists
    const hours = Object.keys(orders)
        // build graph series
    const graphData = hours.map((hour) => {
        // fetch all the orders from current hour
        const group = orders[hour]
        // calculate price values - open, high, low, close
        const open = group[0]                   // first order
        const high = maxBy(group, 'tokenPrice') // high price
        const low = minBy(group, 'tokenPrice')  // low price
        const close = group[group.length - 1]   // last order

        return({
            x: new Date(hour),
            // open, high, low, and close prices
            y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
        })
    })

    return graphData
}

// dig into exchange; see if orderCancelling flag is ther; if not, default to false
const orderCancelling = state => get(state, 'exchange.orderCancelling', false)
export const orderCancellingSelector = createSelector(orderCancelling, status => status)

const orderFilling = state => get(state, 'exchange.orderFilling', false)
export const orderFillingSelector =  createSelector(orderFilling, status => status)

// Balances
const balancesLoading = state => get(state, 'exchange.balancesLoading', true)
export const balancesLoadingSelector = createSelector(balancesLoading, status => status)

const etherBalance = state => get(state, 'web3.balance', 0)
export const etherBalanceSelector = createSelector(
    etherBalance,
    (balance) => {
        return formatBalance(balance)
    }
)

const tokenBalance = state => get(state, 'token.balance', 0)
export const tokenBalanceSelector = createSelector(
    tokenBalance,
    (balance) => {
        return formatBalance(balance)
    }
)

const exchangeEtherBalance = state => get(state, 'exchange.etherBalance', 0)
export const exchangeEtherBalanceSelector = createSelector(
    exchangeEtherBalance,
    (balance) => {
        return formatBalance(balance)
    }
)

const exchangeTokenBalance = state => get(state, 'exchange.tokenBalance', 0)
export const exchangeTokenBalanceSelector = createSelector(
    exchangeTokenBalance,
    (balance) => {
        return formatBalance(balance)
    }
)

// etherDepositAmount selector
const etherDepositAmount = state => get(state, 'exchange.etherDepositAmount', null)
export const etherDepositAmountSelector = createSelector(etherDepositAmount, amount => amount)

// etherWithdrawAmount selector
const etherWithdrawAmount = state => get(state, 'exchange.etherWithdrawAmount', null)
export const etherWithdrawAmountSelector = createSelector(etherWithdrawAmount, amount => amount)

// tokenDepositAmount selector
const tokenDepositAmount = state => get(state, 'exchange.tokenDepositAmount', null)
export const tokenDepositAmountSelector = createSelector(tokenDepositAmount, amount => amount)

// tokenWithdrawAmount selector
const tokenWithdrawAmount = state => get(state, 'exchange.tokenWithdrawAmount', null)
export const tokenWithdrawAmountSelector = createSelector(tokenWithdrawAmount, amount => amount)



const buyOrder = state => get(state, 'exchange.buyOrder', {})
export const buyOrderSelector = createSelector(buyOrder, order => order)

const sellOrder = state => get(state, 'exchange.sellOrder', {})
export const sellOrderSelector = createSelector(sellOrder, order => order)