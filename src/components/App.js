import React, { Component } from 'react'
import './App.css'
import Navbar from './Navbar'
import Content from './Content'
import Error from './Error'
import { connect } from 'react-redux'
import { loadWeb3, loadAccount, loadToken, loadExchange } from '../store/interactions'
import { contractsLoadedSelector } from '../store/selectors'

class App extends Component {
    componentWillMount(){
        this.loadBlockchainData(this.props.dispatch);
    }

    async loadBlockchainData(dispatch) {
        const web3 = await loadWeb3(dispatch)                           // setup web3
        await web3.eth.net.getNetworkType()                             // findout what network connected to
        const networkId = await web3.eth.net.getId()                    // use as key to fetch out address
        await loadAccount(web3, dispatch)                               // fetch accounts
        const token = await loadToken(web3, networkId, dispatch)        // load the token; fetch token from blockchain using ABI
        // require that contracts are loaded before app is usable
        if(!token){
            window.alert('Token smart contract not deployed to the current network. Please select another network with Metamask.')
            return
        }
        const exchange = await loadExchange(web3, networkId, dispatch)  // load the exchange
        if(!exchange){
            window.alert('Exchange smart contract not deployed to the current network. Please select another network with Metamask.')
            return
        }
    }

    render() {
        return (
            <div>
                <Navbar/>
                {/* Will only load if smart contracts are loaded; using contractLoaded selector */}
                { this.props.contractLoaded ? <Content/> : <Error/> }
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        // check for loaded contracts
        contractLoaded: contractsLoadedSelector(state)
    }
}

// connect - connects App to redux; receives info inside props
export default connect(mapStateToProps)(App);