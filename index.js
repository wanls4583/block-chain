class Util {
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
        while (value >>= 1);
        return retValue;
    }
}
Util.I64BIT_TABLE='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split('');

class Transaction{
    constructor(to,from,amount,timeStamp){
        this.to = to;
        this.from = from;
        this.amount = amount;
        this.timeStamp = timeStamp;
    }
}

class Block{
    constructor(timeStamp,transactions){
    	this.transactions = transactions;
        this.timeStamp = timeStamp;
        this.nonce = 0;
    }
    caculateHash(){
        return Util.hash(JSON.stringify(this.transactions)+this.timeStamp+this.nonce);
    }
}

class BlockChain{
    constructor(difficulty){
        this.lastBlock = null;
        this.difficulty = difficulty||0;
        this.transactions = [];
        this.store = [];
        this.workers = [];
        this.working = false;
    }
    getLastBlock(){
    	return this.lastBlock;
    }
    addTransaction(transaction){
        if(!this.working){
            this.transactions.push(transaction);
        }else{
            this.store.push(transaction);
        }
    }
    //挖矿
    mine(miner,callback){
        //当前已经有矿工在挖矿
        if(this.working){
            this.workers.push({
                miner: miner,
                callback: callback
            });
            return;
        }
    	let self = this;
        self.working = true;
        self.store.forEach(function(item){
            self.transactions.push(item);
        });
        self.store = [];
        let block = new Block(Date.now(),self.transactions);
    	let hash = block.caculateHash();
    	if(self.lastBlock){
	    	block.preHash = self.lastBlock.hash;
    	}
    	let begin = Date.now();
        return new Promise(function(resolve){
        	let timer = setInterval(function(){
        		let tmp = hash.substring(0,self.difficulty);
        		let flag = true;
        		for(let i=0; i<self.difficulty; i++){
        			if(tmp[i]!=tmp[0]){
        				flag = false;
        			}
        		}
        		// console.log(hash,hash.substring(0,self.difficulty),tmp);
        		if(!flag){
    	    		//大于10分钟，视为无效区块
                    if(Date.now()-begin > 10*60*1000){
    	    			console.log('bad block');
                        callback && callback();
                        nextMine(self);
    	    		}
    	    		block.nonce++;
    	    		hash = block.caculateHash();
    	    	}else{
        			console.log('add',hash);
                    block.preBlock = self.lastBlock;
                    self.lastBlock = block;
                    block.hash = hash;
                    self.transactions = [new Transaction(miner,null,10,Date.now())]
                    callback && callback();
                    nextMine(self);
    	    	}
        	},10);
            function nextMine(chain){
                chain.working = false;
                clearInterval(timer);
                //在众多矿工中选取一个矿工
                let opt = chain.workers[(chain.workers.length*Math.random())>>0];
                chain.workers = [];
                opt && chain.mine(opt.miner,opt.callback);
                resolve();
            }
        })
    }
    //获取矿工收益
    getBalance(miner){
        let block = this.lastBlock;
        let amount = 0;
        while(block){
            let transactions = block.transactions;
            transactions.forEach(function(item){
                if(item.to == miner){
                    amount += item.amount;
                }
            })
            block = block.preBlock;
        }
        console.log(miner,'has',amount);
        return amount;
    }
}

let blockChain = new BlockChain(6);

blockChain.addTransaction(new Transaction('路人A','张三',100,Date.now()));

blockChain.mine('lisong');

blockChain.addTransaction(new Transaction('路人B','张三',100,Date.now()));

blockChain.mine('lisong',function(){
    blockChain.getBalance('lisong');
});