// preloads data when the smart contract is loaded
    // script to run in truffle's script runner
    // truffle exec scripts/seed-exchange.js
const Token = artifacts.require("Token")
const Exchange = artifacts.require("Exchange")

// Utils
// ether token deposit address
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000';
const ether = (n) => {
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
}
// same as ether
const tokens = (n) => ether(n)
const wait = (seconds) => {
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}


module.exports = async function( callback ) {
    try {
        // fetch all accounts from wallet - unlocked
        const accounts = await web3.eth.getAccounts();

        // fetch the deployed token
        const token = await Token.deployed();
        console.log('Token fetched', token.address);

        // fetch the deployed exchange
        const exchange = await Exchange.deployed();
        console.log('Exchange fetched', exchange.address);

        // give tokens to account[1]
        const sender = accounts[0];
        const receiver = accounts[1];
        let amount = web3.utils.toWei('10000', 'ether'); // 10,000 tokens

        await token.transfer( receiver, amount, { from: sender } );
        console.log(`### Transferred ${amount} tokens ###   From: ${sender}   To: ${receiver}`);

        // setup/create exchange users
        const user1 = accounts[0];
        const user2 = accounts[1];

        // user1 deposits Ether
        amount = 1;
        await exchange.depositEther({ from: user1, value: ether(amount) });
        console.log(`### Deposited ${amount} Ether ###   From: ${user1}`);

        // user2 approves tokens
        amount = 10000;
        await token.approve(exchange.address, tokens(amount), { from: user2 });
        console.log(`### Approved ${amount} tokens ###   From: ${user2}`);

        // user2 deposits tokens
        await exchange.depositToken(token.address, tokens(amount), { from: user2 });
        console.log(`### Deposited ${amount} tokens ###   From: ${user2}`);

        /////////////////////////////////////////////////////////////////////////////////
        // Seed a cancel order
        //
        
        // user1 makes order to get tokens
        let result;
        let orderId;
        result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), { from: user1 });
        console.log(`### Made order ###   From: ${user1}`);
        
        // user1 cancels order
        orderId = result.logs[0].args.id;
        await exchange.cancelOrder(orderId, { from: user1 });
        console.log(`### Cancelled order ###   From: ${user1}`);
        

        /////////////////////////////////////////////////////////////////////////////////
        // Seed filled order
        //

        // user1 makes order
        result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), { from: user1 });
        console.log(`### Made order ###   From: ${user1}`);

        // user2 fills order
        orderId = result.logs[0].args.id;
        await exchange.fillOrder(orderId, { from: user2 });
        console.log(`### Filled order ###   From: ${user1}   By: ${user2}`);

        // wait 1 second
        await wait(1);


        // user1 makes another order
        result = await exchange.makeOrder(token.address, tokens(50), ETHER_ADDRESS, ether(0.01), { from: user1 });
        console.log(`### Made order ###   From: ${user1}`);

        // user2 fills another order
        orderId = result.logs[0].args.id;
        await exchange.fillOrder(orderId, { from: user2 });
        console.log(`### Filled order ###   From: ${user1}   By: ${user2}`);

        // wait 1 second
        await wait(1);
        
        
        // user1 makes final order
        result = await exchange.makeOrder(token.address, tokens(200), ETHER_ADDRESS, ether(0.15), { from: user1 });
        console.log(`### Made order ###   From: ${user1}`);

        // user2 fills another order
        orderId = result.logs[0].args.id;
        await exchange.fillOrder(orderId, { from: user2 });
        console.log(`### Filled order ###   From: ${user1}   By: ${user2}`);

        // wait 1 second
        await wait(1);


        /////////////////////////////////////////////////////////////////////////////////
        // Seed open order
        //
        
        // user1 makes 10 orders
        for (let i = 1; i <= 10; i++) {
            result = await exchange.makeOrder(token.address, tokens(10 * i), ETHER_ADDRESS, ether(0.01), { from: user1 });
            console.log(`### Made order ###   From: ${user1}`);

            await wait(1);
        }
        
        // user2 makes 10 orders
        for (let i = 1; i <= 10; i++) {
            result = await exchange.makeOrder(ETHER_ADDRESS, ether(0.01), token.address, tokens(10 * i), { from: user2 });
            console.log(`### Made order ###   From: ${user2}`);

            await wait(1);
        }
        


    } catch (error) {
        console.log(error);
    }

    // must call the callback anytime the script is finished
    callback()
}