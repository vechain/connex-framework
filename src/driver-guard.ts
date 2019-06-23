import * as V from './validator'

export function newDriverGuard(driver: Connex.Driver): Connex.Driver {
    const genesis = driver.genesis
    test(genesis, blockScheme, 'genesis')

    return {
        genesis,
        getHead() {
            return test(driver.getHead(), headScheme, 'getHead()')
        },
        getBlock(revision) {
            return driver.getBlock(revision)
                .then(b => b ? test(b, blockScheme, 'getBlock()') : b)
        },
        getTransaction(id, head) {
            return driver.getTransaction(id, head)
                .then(tx => tx ? test(tx, txScheme, 'getTransaction()') : tx)
        },
        getReceipt(id, head) {
            return driver.getReceipt(id, head)
                .then(r => r ? test(r, receiptScheme, 'getReceipt()') : r)
        },
        getAccount(addr: string, revision: string): Promise<Connex.Thor.Account> {
            return driver.getAccount(addr, revision)
                .then(a => test(a, {
                    balance: 'hex_string',
                    energy: 'hex_string',
                    hasCode: 'bool'
                }, 'getAccount()'))
        },
        getCode(addr: string, revision: string): Promise<Connex.Thor.Code> {
            return driver.getCode(addr, revision)
                .then(c => test(c, {
                    code: 'bytes'
                }, 'getCode()'))
        },
        getStorage(addr: string, key: string, revision: string) {
            return driver.getStorage(addr, key, revision)
                .then(s => test(s, {
                    value: 'bytes32'
                }, 'getStorage'))
        },
        explain(arg, revision) {
            return driver.explain(arg, revision)
                .then(r => test(r, [vmOutputScheme], 'explain()'))
        },
        filterEventLogs(arg) {
            return driver.filterEventLogs(arg)
                .then(r => test(r, [eventWithMetaScheme], 'filterEventLogs()'))
        },
        filterTransferLogs(arg) {
            return driver.filterTransferLogs(arg)
                .then(r => test(r, [transferWithMetaScheme], 'filterTransferLogs()'))
        },
        signTx(msg, options) {
            return driver.signTx(msg, options)
                .then(r => test(r, {
                    txid: 'bytes32',
                    signer: 'address'
                }, 'signTx()'))
        },
        signCert(msg, options) {
            return driver.signCert(msg, options)
                .then(r => test(r, {
                    annex: {
                        domain: 'string',
                        timestamp: 'uint64',
                        signer: 'address'
                    },
                    signature: v => V.isHexBytes(v, 65) ? '' : 'expected 65 bytes'
                }, 'signCert()'))
        },
        isAddressOwned(addr) {
            return test(driver.isAddressOwned(addr), 'bool', 'isAddressOwned()')
        }
    }
}

const headScheme: V.Scheme<Connex.Thor.Status['head']> = {
    id: 'bytes32',
    number: 'uint32',
    timestamp: 'uint64',
    parentID: 'bytes32'
}

const blockScheme: V.Scheme<Connex.Thor.Block> = {
    id: 'bytes32',
    number: 'uint32',
    size: 'uint32',
    parentID: 'bytes32',
    timestamp: 'uint64',
    gasLimit: 'uint64',
    beneficiary: 'address',
    gasUsed: 'uint64',
    totalScore: 'uint64',
    txsRoot: 'bytes32',
    txsFeatures: new V.Optional('uint32'),
    stateRoot: 'bytes32',
    receiptsRoot: 'bytes32',
    signer: 'address',
    isTrunk: 'bool',
    transactions: ['bytes32']
}

const txScheme: V.Scheme<Connex.Thor.Transaction> = {
    id: 'bytes32',
    chainTag: 'uint8',
    blockRef: 'bytes8',
    expiration: 'uint32',
    gasPriceCoef: 'uint8',
    gas: 'uint64',
    origin: 'address',
    delegator: new V.Optional('address'),
    nonce: 'hex_string',
    dependsOn: new V.Nullable('bytes32'),
    size: 'uint32',
    clauses: [{
        to: new V.Nullable('address'),
        value: 'hex_string',
        data: 'bytes'
    }],
    meta: {
        blockID: 'bytes32',
        blockNumber: 'uint32',
        blockTimestamp: 'uint64'
    }
}

const logMetaScheme: V.Scheme<Connex.Thor.LogMeta> = {
    blockID: 'bytes32',
    blockNumber: 'uint32',
    blockTimestamp: 'uint64',
    txID: 'bytes32',
    txOrigin: 'address',
    clauseIndex: 'uint32'
}

const eventScheme: V.Scheme<Connex.Thor.Event> = {
    address: 'address',
    topics: ['bytes32'],
    data: 'bytes',
    meta: v => '',
    decoded: v => ''
}
const eventWithMetaScheme: V.Scheme<Connex.Thor.Event> = {
    ...eventScheme,
    meta: logMetaScheme
}

const transferScheme: V.Scheme<Connex.Thor.Transfer> = {
    sender: 'address',
    recipient: 'address',
    amount: 'hex_string',
    meta: v => '',
}

const transferWithMetaScheme: V.Scheme<Connex.Thor.Transfer> = {
    ...transferScheme,
    meta: logMetaScheme
}

const receiptScheme: V.Scheme<Connex.Thor.Receipt> = {
    gasUsed: 'uint64',
    gasPayer: 'address',
    paid: 'hex_string',
    reward: 'hex_string',
    reverted: 'bool',
    outputs: [{
        contractAddress: new V.Nullable('address'),
        events: [eventScheme],
        transfers: [transferScheme]
    }],
    meta: {
        blockID: 'bytes32',
        blockNumber: 'uint32',
        blockTimestamp: 'uint64',
        txID: 'bytes32',
        txOrigin: 'address'
    }
}

const vmOutputScheme: V.Scheme<Connex.Thor.VMOutput> = {
    data: 'bytes',
    vmError: 'string',
    gasUsed: 'uint64',
    reverted: 'bool',
    events: [{
        address: 'address',
        topics: ['bytes32'],
        data: 'bytes',
        meta: v => '',
        decoded: v => ''
    }],
    transfers: [{
        sender: 'address',
        recipient: 'address',
        amount: 'hex_string',
        meta: v => '',
    }],
    decoded: v => ''
}

function test<T>(obj: T, scheme: V.Scheme<T>, path: string) {
    try {
        V.validate<T>(obj, scheme, path)
    } catch (err) {
        // tslint:disable-next-line:no-console
        console.warn(`Connex-Driver[MALFORMED RESPONSE]: ${err.message}`)
    }
    return obj
}
