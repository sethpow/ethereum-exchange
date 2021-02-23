export const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000"
export const DECIMALS = (10 ** 18)

export const GREEN = 'success'
export const RED = 'danger'

// convert ether
export const ether = (wei) => {
    if(wei){
        return(wei/DECIMALS)
    }
}

// tokens and ether have same decimal resolution
export const tokens = ether


export const formatBalance = (balance) => {
    balance = ether(balance)
    balance = Math.round(balance * 100) / 100
    return balance
}