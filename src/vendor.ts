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
            V.ensure(V.isAddress(addr),
                'arg0 expected address')
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
            V.ensure(V.isAddress(addr),
                `arg0 expected address`)
            opts.signer = addr.toLowerCase()
            return this
        },
        gas(gas) {
            V.ensure(gas >= 0 && Number.isSafeInteger(gas),
                `arg0 expected non-neg safe integer`)
            opts.gas = gas
            return this
        },
        dependsOn(txid) {
            V.ensure(V.isBytes32(txid),
                `arg0 expected bytes32`)
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
                    'unexpected delegation result')
                V.ensure(V.isHexBytes(obj.signature) && obj.signature.length === 132,
                    'invalid delegator signature')
                return obj
            }
            return this
        },
        request(msg) {
            V.ensure(Array.isArray(msg),
                'arg0 expected array')
            msg = msg.map((c, i) => {
                V.ensure(c.to === null || V.isAddress(c.to),
                    `arg0.#${i}.to expected null or address`)
                V.ensure(typeof c.value === 'string' ?
                    (V.isHexString(c.value) || V.isDecString(c.value)) :
                    (Number.isSafeInteger(c.value) && c.value >= 0),
                    `arg0.#${i}.value expected non-neg safe integer or hex/dec string`)
                V.ensure(!c.data || V.isHexBytes(c.data),
                    `arg0.#${i}.data expected bytes hex string`)

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
            V.ensure(V.isAddress(addr),
                `arg0 expected address`)
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
            V.ensure(typeof msg === 'object',
                'arg0 expected object')
            V.ensure(msg.purpose === 'agreement' || msg.purpose === 'identification',
                `arg0.purpose expected 'agreement' or 'identification'`)
            V.ensure(typeof msg.payload === 'object',
                `arg0.payload expected object`)
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
