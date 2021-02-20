import React from 'react';
import ReactDOM from 'react-dom';

// used with redux
import { Provider } from 'react-redux'
import configureStore from './store/configureStore.js'

import 'bootstrap/dist/css/bootstrap.css'

import App from './components/App';

// attach redux store to dApp
const store = configureStore()

ReactDOM.render(
    // create redux provider; expose redux store to app
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);