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
Util.I64BIT_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split('');

//一笔交易
class Transaction {
    constructor(to, from, amount, timeStamp) {
        this.to = to;
        this.from = from;
        this.amount = amount;
        this.timeStamp = timeStamp;
    }
}
//区块，一个区块可包含多个交易
class Block {
    constructor(timeStamp, transactions) {
        this.transactions = transactions;
        this.timeStamp = timeStamp;
        this.nonce = 0;
    }
    caculateHash() {
        return Util.hash(JSON.stringify(this.transactions) + this.timeStamp + this.nonce);
    }
}
//区块链
class BlockChain {
    constructor(difficulty) {
        this.lastBlock = null;
        this.difficulty = difficulty || 0;
        this.transactions = [];
        this.store = [];
        this.workers = [];
        this.working = false;
    }
    //添加交易
    addTransaction(transaction) {
        //挖矿中，新的交易存储到队列，等待下一次挖矿
        if (!this.working) {
            this.transactions.push(transaction);
        } else {
            this.store.push(transaction);
        }
    }
    //挖矿
    mine(miner, callback) {
        //当前已经有矿工在挖矿
        if (this.working) {
            this.workers.push({
                miner: miner,
                callback: callback
            });
            return;
        }
        let self = this;
        self.working = true;
        //将存储的交易取出来
        self.store.forEach(function(item) {
            self.transactions.push(item);
        });
        self.store = [];
        //新建一个区块，待挖矿
        let block = new Block(Date.now(), self.transactions);
        let hash = block.caculateHash();
        if (self.lastBlock) {
            block.preHash = self.lastBlock.hash;
        }
        let begin = Date.now();
        let timer = setInterval(function() {
            let tmp = hash.substring(0, self.difficulty);
            let flag = true;
            for (let i = 0; i < self.difficulty; i++) {
                if (tmp[i] != tmp[0]) {
                    flag = false;
                }
            }
            console.log(hash);
            if (!flag) {
                //大于10分钟，视为无效区块
                if (Date.now() - begin > 10 * 60 * 1000) {
                    console.log('bad block');
                    nextMine(self);
                    callback && callback();
                }
                block.nonce++;
                hash = block.caculateHash();
            } else { //挖矿成功
                document.write('<h4>add'+':'+hash+'</h4>');
                block.preBlock = self.lastBlock;
                self.lastBlock = block;
                block.hash = hash;
                self.transactions = [new Transaction(miner, null, 10, Date.now())]
                nextMine(self);
                callback && callback();
            }
        }, 10);

        function nextMine(chain) {
            chain.working = false;
            clearInterval(timer);
            //在众多矿工中选取一个矿工，这里是随机选一个，实际环境中，会利用一些算法选取计算能力最强的一个矿工
            let opt = chain.workers[(chain.workers.length * Math.random()) >> 0];
            chain.workers = [];
            opt && chain.mine(opt.miner, opt.callback);
        }
    }
    //获取矿工收益
    getBalance(miner) {
        let block = this.lastBlock;
        let amount = 0;
        while (block) {
            let transactions = block.transactions;
            transactions.forEach(function(item) {
                if (item.to == miner) {
                    amount += item.amount;
                }
            })
            block = block.preBlock;
        }
        console.log(miner, 'has', amount);
        return amount;
    }
    //检测数据链是否被更改过
    isValidChain(){
        let block = this.lastBlock;
        while(block){
            let preBlock = block.preBlock;
            if(block.caculateHash() != block.hash){
                return false;
            }
            if(preBlock && preBlock.caculateHash() != block.preHash){
                return false
            }
            block = preBlock;
        }
        return true;
    }
}

let blockChain = new BlockChain(6);

blockChain.addTransaction(new Transaction('路人A', '张三', 100, Date.now()));

blockChain.mine('lisong');

blockChain.addTransaction(new Transaction('路人B', '张三', 100, Date.now()));

blockChain.mine('lisong', function() {
    blockChain.getBalance('lisong');
});

let blockChain1 = new BlockChain(2);

let tr = new Transaction('路人A', '张三', 100, Date.now())

blockChain1.addTransaction(tr);

blockChain1.mine('lisong',function(){
    // tr.to = 'lsong'; //更改交易检测时将会返回false
    console.log(blockChain1.isValidChain());
});