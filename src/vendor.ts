import * as V from './validator'

export function newVendor(driver: Connex.Driver): Connex.Vendor {
    return {
        sign: (kind: 'tx' | 'cert') => {
            if (kind === 'tx') {
                return newTxSigningService(driver) as any
            } else if (kind === 'cert') {
                return newCertSigningService(driver) as any
            } else {
                throw new V.BadParameter(`arg0 expected 'tx' or 'cert'`)
            }
        },
        owned: (addr) => {
            V.ensureAddress(addr, 'arg0')
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
            V.ensureAddress(addr, 'arg0')
            opts.signer = addr.toLowerCase()
            return this
        },
        gas(gas) {
            V.ensureUInt(gas, 64, 'arg0')
            opts.gas = gas
            return this
        },
        dependsOn(txid) {
            V.ensureB32(txid, 'arg0')
            opts.dependsOn = txid.toLowerCase()
            return this
        },
        link(url) {
            V.ensure(typeof url === 'string',
                `arg0 expected string`)
            opts.link = url
            return this
        },
        comment(text) {
            V.ensure(typeof text === 'string',
                `arg0 expected string`)
            opts.comment = text
            return this
        },
        delegate(handler) {
            V.ensure(typeof handler === 'function',
                `arg0 expected function`)

            opts.delegateHandler = async unsigned => {
                const obj = await handler(unsigned)
                V.ensure(obj instanceof Object,
                    'delegation result: expected object')
                V.ensure(V.isHexBytes(obj.signature) && obj.signature.length === 132,
                    'delegator signature: expected 65 bytes')
                return obj
            }
            return this
        },
        request(msg) {
            V.ensureArray(msg, 'arg0')
            msg = msg.map((c, i) => {
                if (c.to) {
                    V.ensureAddress(c.to, `arg0.#${i}.to`)
                }
                V.ensureUIntNumberOrString(c.value, `arg0.#${i}.value`)
                if (c.data) {
                    V.ensureBytes(c.data, `arg0.#${i}.data`)
                }

                V.ensure(c.comment === undefined || typeof c.comment === 'string', `arg0.#${i}.comment expected string`)
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
            V.ensureAddress(addr, 'arg0')
            opts.signer = addr.toLowerCase()
            return this
        },
        link(url) {
            V.ensure(typeof url === 'string',
                `arg0 expected string`)
            opts.link = url
            return this
        },
        request(msg) {
            V.ensureObject(msg, 'arg0')
            V.ensure(msg.purpose === 'agreement' || msg.purpose === 'identification',
                `arg0.purpose expected 'agreement' or 'identification'`)
            V.ensureObject(msg.payload, 'arg0.payload')
            V.ensure(msg.payload.type === 'text',
                `arg0.payload.type unsupported`)
            V.ensure(typeof msg.payload.content === 'string',
                `arg0.payload.content expected string`)

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

Rejected.prototype.name = Rejected.name
