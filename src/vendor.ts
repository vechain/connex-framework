import * as V from './validator'

export function newVendor(driver: Connex.Driver): Connex.Vendor {
    return {
        sign: (kind) => {
            if (kind === 'tx') {
                return newTxSigningService(driver) as any
            } else if (kind === 'cert') {
                return newCertSigningService(driver) as any
            } else {
                throw new V.BadParameter(`arg0 expected 'tx' or 'cert'`)
            }
        },
        owned: (addr) => {
            V.validate(addr, 'address', 'arg0')
            return driver.isAddressOwned(addr.toLowerCase())
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
        delegateHandler?: Connex.Vendor.SigningService.DelegationHandler
    } = {}
    return {
        signer(addr) {
            V.validate(addr, 'address', 'arg0')
            opts.signer = addr.toLowerCase()
            return this
        },
        gas(gas) {
            V.validate(gas, 'uint64', 'arg0')
            opts.gas = gas
            return this
        },
        dependsOn(txid) {
            V.validate(txid, 'bytes32', 'arg0')
            opts.dependsOn = txid.toLowerCase()
            return this
        },
        link(url) {
            V.validate(url, 'string', 'arg0')
            opts.link = url
            return this
        },
        comment(text) {
            V.validate(text, 'string', 'arg0')
            opts.comment = text
            return this
        },
        delegate(handler) {
            V.ensure(typeof handler === 'function',
                `arg0 expected function`)

            opts.delegateHandler = async unsigned => {
                const obj = await handler(unsigned)
                V.validate(obj, {
                    signature: v => V.isHexBytes(v, 65) ? '' : 'expected 65 bytes'
                }, 'delegation result')
                return obj
            }
            return this
        },
        request(msg) {
            V.validate(msg, [clauseScheme], 'arg0')
            msg = msg.map(c => {
                return {
                    to: c.to ? c.to.toLowerCase() : null,
                    value: c.value.toString().toLowerCase(),
                    data: (c.data || '0x').toLowerCase(),
                    comment: c.comment
                }
            })

            return (async () => {
                try {
                    return await driver.signTx(msg, opts)
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
            V.validate(addr, 'address', 'arg0')
            opts.signer = addr.toLowerCase()
            return this
        },
        link(url) {
            V.validate(url, 'string', 'arg0')
            opts.link = url
            return this
        },
        request(msg) {
            V.validate(msg, {
                purpose: v => (v === 'agreement' || v === 'identification') ?
                    '' : `expected 'agreement' or 'identification'`,
                payload: {
                    type: v => v === 'text' ? '' : `expected 'text'`,
                    content: 'string'
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

const clauseScheme: V.Scheme<Connex.Vendor.SigningService.TxMessage[number]> = {
    to: new V.Nullable('address'),
    value: 'big_int',
    data: new V.Optional('bytes'),
    comment: new V.Optional('string')
}
