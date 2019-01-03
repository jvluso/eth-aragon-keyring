const EventEmitter = require('events').EventEmitter
const initAragonJS = require('./aragonjs-wrapper');

const ethUtil = require('ethereumjs-util')

const FIELDS = [
  'nonce',
  'gasPrice',
  'gasLimit',
  'to',
  'value',
  'data',
]

// Options:
const type = 'Aragon Key'

class AragonKeyring extends EventEmitter {

  /* PUBLIC METHODS */

  constructor (opts = {}) {
    super()
    this.type = type
    this.deserialize(opts)
  }

  serialize () {
    return Promise.resolve({
      ens: this.ens,
      dao: this.dao,
      forwardingAddress: this.forwardingAddress,
      parentAddress: this.parentAddress
    })
  }

  deserialize (opts = {}) {
    this.opts = opts || {}
    this.ens = opts.ens
    this.dao = opts.dao
    this.forwardingAddress = opts.forwardingAddress
    this.parentAddress = opts.parentAddress

    return Promise.resolve([])
  }

  addAccounts (numberOfAccounts = 1) {
    throw new Error('Not supported')
  }

  getAccounts () {
    return Promise.resolve([this.forwardingAddress])
  }

  // the provider needs to be injected somewhere, as does some way of passing the transaction to the final signer
  setProvider (subProvider, providerSignTransaction) {
    this.subProvider = subProvider
    this.providerSignTransaction = providerSignTransaction
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction (address, tx) {

    const serialized = { from: address }
    FIELDS.forEach((field) => {
      const value = ethUtil.bufferToHex(tx[field])
      serialized[field] = ethUtil.bufferToHex(tx[field])
    })
    delete serialized.gasLimit;
    return this._getWallet()
    .then((wrapper) =>{
      return this.wrapper.calculateTransactionPath(
        this.parentAddress,
        this.forwardingAddress,
        "execute",
        [serialized.to,serialized.value,serialized.data])
    })
    .then(result => {
      var newTx = result[0]
      delete newTx.nonce
      if(typeof newTx.value == 'undefined') newTx.value="0x"
      if(typeof newTx.gasPrice == 'undefined') newTx.gasPrice=serialized.gasPrice
      this.providerSignTransaction(newTx,this.parentAddress)
    })
  }


  signMessage (withAccount, data) {
    throw new Error('Not supported')
  }


  signPersonalMessage (withAccount, msgHex) {
    const message = "0x" + ethUtil.keccak(msgHex).toString('hex')
    return this._getWallet()
    .then((wrapper) =>{
      return this.wrapper.calculateTransactionPath(
        this.parentAddress,
        this.forwardingAddress,
        "presignHash",
        [message])
    })
    .then(result => {
      var newTx = result[0]
      delete newTx.nonce
      if(typeof newTx.value == 'undefined') newTx.value="0x"
      if(typeof newTx.gasPrice == 'undefined') newTx.gasPrice="0xee6b2800"
      this.providerSignTransaction(newTx,this.parentAddress)
    })
  }


  signTypedData (withAccount, typedData) {
    throw new Error('Not supported')
  }


  newGethSignMessage (withAccount, msgHex) {
    throw new Error('Not supported')
  }

  exportAccount (address) {
    throw new Error('Not supported')
  }


  /* PRIVATE METHODS */


  _getWallet () {
    if(!this.subProvider){
      throw new Error('supProvider not provided')
    }
    if(this.wrapper){
      return (Promise.resolve(this.wrapper))
    }
    return initAragonJS(this.dao, this.ens, {
      accounts: this.accounts,
      provider: this.subProvider
    })
    .then((initializedWrapper) => {
      this.wrapper = initializedWrapper
      return this.wrapper
    })
  }
}

AragonKeyring.type = type
module.exports = AragonKeyring
