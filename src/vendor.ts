import * as R from './rules'
import * as V from 'validator-ts'

export function newVendor(driver: Connex.Driver): Connex.Vendor {
    return {
        sign: (kind) => {
            if (kind === 'tx') {
                return newTxSigningService(driver) as any
            } else if (kind === 'cert') {
                return newCertSigningService(driver) as any
            } else {
                throw new R.BadParameter(`arg0: expected 'tx' or 'cert'`)
            }
        },
        owned: (addr) => {
            addr = R.test(addr, R.address, 'arg0').toLowerCase()
            return driver.isAddressOwned(addr)
        }
    }
}

function newTxSigningService(driver: Connex.Driver): Connex.Vendor.TxSigningService {
    const opts: {
        signer?: string
        gas?: number
        dependsOn?: string
        link?: string
        comment?: string
    } = {}
    let delegateHandler: Connex.Vendor.DelegationHandler | undefined
    return {
        signer(addr) {
            opts.signer = R.test(addr, R.address, 'arg0').toLowerCase()
            return this
        },
        gas(gas) {
            opts.gas = R.test(gas, R.uint64, 'arg0')
            return this
        },
        dependsOn(txid) {
            opts.dependsOn = R.test(txid, R.bytes32, 'arg0').toLowerCase()
            return this
        },
        link(url) {
            opts.link = R.test(url, R.string, 'arg0')
            return this
        },
        comment(text) {
            opts.comment = R.test(text, R.string, 'arg0')
            return this
        },
        delegate(handler) {
            R.ensure(typeof handler === 'function',
                `arg0: expected function`)

            delegateHandler = async unsigned => {
                const obj = await handler(unsigned)
                R.test(obj, {
                    signature: v => R.isHexBytes(v, 65) ? '' : 'expected 65 bytes'
                }, 'delegation-result')
                return obj
            }
            return this
        },
        request(msg) {
            R.test(msg, [clauseScheme], 'arg0')
            const transformedMsg = msg.map(c => {
                return {
                    to: c.to ? c.to.toLowerCase() : null,
                    value: c.value.toString().toLowerCase(),
                    data: (c.data || '0x').toLowerCase(),
                    comment: c.comment,
                    abi: c.abi ? JSON.parse(JSON.stringify(c.abi)) : c.abi
                }
            })

            return (async () => {
                try {
                    const tx = await driver.buildTx(transformedMsg, opts)
                    let delegation: { signature?: string, error?: Error } | undefined
                    if (delegateHandler) {
                        try {
                            const dSig = await delegateHandler({
                                raw: tx.raw,
                                origin: tx.origin
                            })
                            delegation = { signature: dSig.signature }
                        } catch (err) {
                            delegation = { error: err }
                        }
                    }
                    return await tx.sign(delegation)
                } catch (err) {
                    throw new Rejected(err.message)
                }
            })()
        }
    }
}

function newCertSigningService(driver: Connex.Driver): Connex.Vendor.CertSigningService {
    const opts: {
        signer?: string
        link?: string
    } = {}

    return {
        signer(addr) {
            opts.signer = R.test(addr, R.address, 'arg0').toLowerCase()
            return this
        },
        link(url) {
            opts.link = R.test(url, R.string, 'arg0')
            return this
        },
        request(msg) {
            R.test(msg, {
                purpose: v => (v === 'agreement' || v === 'identification') ?
                    '' : `expected 'agreement' or 'identification'`,
                payload: {
                    type: v => v === 'text' ? '' : `expected 'text'`,
                    content: R.string
                }
            }, 'arg0')

            return (async () => {
                try {
                    return await driver.signCert(msg, opts)
                } catch (err) {
                    throw new Rejected(err.message)
                }
            })()
        }
    }
}

class Rejected extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

Rejected.prototype.name = 'Rejected'

const clauseScheme: V.Scheme<Connex.Vendor.TxMessage[number]> = {
    to: V.nullable(R.address),
    value: R.bigInt,
    data: V.optional(R.bytes),
    comment: V.optional(R.string),
    abi: V.optional(v => v instanceof Object ? '' : 'expected object')
}
