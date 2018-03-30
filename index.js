class Util {

    static I64BIT_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split('');
    
    static hash(input) {

        let hash = 5381;
        let i = input.length - 1;
        if (typeof input == 'string') {
            for (; i > -1; i--)
                hash += (hash << 5) + input.charCodeAt(i);
        } else {
            for (; i > -1; i--)
                hash += (hash << 5) + input[i];
        }
        let value = hash & 0x7FFFFFFF;
        let retValue = '';
        do {
            retValue += Util.I64BIT_TABLE[value & 0x3F];
        }
        while (value >>= 6);
        return retValue;
    }
}

class Transaction{
    constructor(to,from,amount){
        this.to = to;
        this.from = from;
        this.amount = amount;
    }
}

class Block{
    constructor(timeStamp,nonce){
        this.transactions = [];
        this.timeStamp = timeStamp;
        this.nonce = nonce||0;
    }
    hash(){
        return Util.hash(JSON.stringify(transaction)+timeStamp+nonce);    
    }
    addTransaction(transaction){
        this.transactions.push(transaction);
    }
}

class BlockChain{
    constructor(difficulty){
        this.blocks = null;
        this.difficulty = difficulty;
    }
    addBlock(){

    }
}
