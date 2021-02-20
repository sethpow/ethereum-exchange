import { get } from 'lodash'
import { createSelector } from 'reselect'
import moment from 'moment'
import { ETHER_ADDRESS, tokens, ether, GREEN, RED } from '../helpers'

// selectors - select/pull info out of redux, to display
// get - gets the value at path of obj; if the resolved value is undef, the defaultValue is returned in its place

// account selector
    // fetch state.web3.account from state
// const account = state => state.web3.account
const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)  // actual selector; account returns account


// contracts loaded selectors; make sure token & exchange are loaded
const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)

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