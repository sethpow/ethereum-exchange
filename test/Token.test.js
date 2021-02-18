import { tokens, EVM_REVERT } from './helpers'

const Token = artifacts.require('./Token')
require('chai').use(require('chai-as-promised')).should()

contract('Token', ( [ deployer, receiver ] ) => {
    let token;
    const name = 'XYN Token'
    const symbol = 'XYN'
    const decimals = '18'
    const totalSupply = tokens(1000000).toString()

    beforeEach(async () => {
        // fetch token from blockchain
        token = await Token.new()
    })

    describe('deployment', () => {
        it('tracks the name', async () => {
            // read token name
            const result = await token.name()
            // check if token name is...
            result.should.equal(name)
        })
        
        it('tracks the symbol', async () => {
            const result = await token.symbol()
            result.should.equal(symbol)
        })
        
        it('tracks the decimals', async () => {
            const result = await token.decimals()
            result.toString().should.equal(decimals)
        })
        
        it('tracks the total supply', async () => {
            const result = await token.totalSupply()
            result.toString().should.equal(totalSupply.toString())
        })

        it('assigns the total supply to the deployer', async () => {
            const result = await token.balanceOf(deployer)
            result.toString().should.equal(totalSupply.toString())
        })
    })

    describe('sending tokens', () => {
        let result
        let amount

        describe('success', async () => {
            beforeEach(async () => {
                // transfer
                amount = tokens(100)
                result = await token.transfer(receiver, amount, { from: deployer })
            })
    
            it('transfers token balances', async () => {
                let balanceOf
                // balances before transfer
                // balanceOf = await token.balanceOf(deployer)
                // // console.log(`Deployer balance before transfer: ${balanceOf.toString()}`);
                // balanceOf = await token.balanceOf(receiver)
                // console.log(`Receiver balance before transfer: ${balanceOf.toString()}`);
                
                // balances after transfer
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999900).toString())
                // console.log(`Deployer balance after transfer: ${balanceOf.toString()}`);
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(100).toString())
                // console.log(`Receiver balance after transfer: ${balanceOf.toString()}`);
            })
    
            it('emits a transfer event', async () => {
                const log = result.logs[0]
                log.event.should.eq('Transfer')
                const event = log.args
                event.from.toString().should.equal(deployer, 'from is correct')
                event.to.toString().should.equal(receiver, 'to is correct')
                event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
        })

        describe('failure', async () => {
            it('rejects insufficient balances', async () => {
                let invalidAmount
                invalidAmount = tokens(100000000) // 100 million; greater than total supply
                await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT)
                
                // attempt transfer when sender has none
                invalidAmount = tokens(10)
                await token.transfer(deployer, invalidAmount, { from: receiver }).should.be.rejectedWith(EVM_REVERT)
            })

            it('rejects invalid recipients', async () => {
                await token.transfer(0x0, amount, { from: deployer }).should.be.rejected
            })

        })

    })

})