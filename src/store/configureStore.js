import { createStore, applyMiddleware, compose } from 'redux'
import { createLogger } from 'redux-logger'
import rootReducer from './reducers.js'

const loggerMiddleware = createLogger()
const middleware = []   // any middleware added

// wire up redux devtools to connect to dApp
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

// configure redux store
// add middleware; create the store that is attached to dApp
export default function configureStore(preloadedState) {
    return createStore(
        rootReducer,
        preloadedState,
        composeEnhancers(applyMiddleware(...middleware, loggerMiddleware))
    )
}