import * as V from './validator'

export function newVendor(driver: Connex.Driver): Connex.Vendor {
    return {
        sign: (kind: 'tx' | 'cert') => {
            if (kind === 'tx') {
                return newTxSigningService(driver) as any
            } else if (kind === 'cert') {
                return newCertSigningService(driver) as any
            } else {
                throw new V.BadParameter('unsupported message kind')
            }
        },
        owned: (addr) => {
            V.ensure(V.isAddress(addr), 'expected address type')
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
            V.ensure(V.isAddress(addr), `'signer' expected address type`)
            opts.signer = addr
            return this
        },
        gas(gas) {
            V.ensure(gas >= 0 && Number.isSafeInteger(gas), `'gas' expected non-neg safe integer`)
            opts.gas = gas
            return this
        },
        dependsOn(txid) {
            V.ensure(V.isBytes32(txid), `'dependsOn' expected bytes32 in hex string`)
            opts.dependsOn = txid
            return this
        },
        link(url) {
            V.ensure(typeof url === 'string', `'link' expected string`)
            opts.link = url
            return this
        },
        comment(text) {
            V.ensure(typeof text === 'string', `'comment' expected string`)
            opts.comment = text
            return this
        },
        delegate(handler) {
            V.ensure(typeof handler === 'function', `'handler' expected function`)
            opts.delegateHandler = handler
            return this
        },
        request(msg) {
            V.ensure(Array.isArray(msg), 'expected array')
            msg = msg.map((c, i) => {
                c = { ...c }
                c.to = c.to || null
                c.value = c.value || 0
                c.data = c.data || '0x'
                c.comment = c.comment || ''

                V.ensure(!c.to || V.isAddress(c.to), `'#${i}.to' expected null or address type`)
                V.ensure(typeof c.value === 'string' ?
                    (/^0x[0-9a-f]+$/i.test(c.value) || /^[0-9]+$/.test(c.value))
                    : Number.isSafeInteger(c.value),
                    `'#${i}.value' expected non-negative safe integer or integer in hex|dec string`)
                V.ensure(/^0x([0-9a-f][0-9a-f])*$/i.test(c.data),
                    `'#${i}.data' expected bytes in hex`)
                V.ensure(typeof c.comment === 'string', `'#${i}.comment' expected string`)
                return c
            })

            return (async () => {
                try {
                    const r = await driver.signTx(msg, opts)
                    if (opts.delegateHandler && r.unsignedTx) {
                        const obj = await opts.delegateHandler(r.unsignedTx)
                        V.ensure(obj instanceof Object, `'delegate handler' expected returns object`)
                        V.ensure(V.isHexBytes(obj.signature) && obj.signature.length === 132,
                            `'delegate handler' expected returns valid signature`)
                        return await r.doSign(obj.signature)
                    }
                    return await r.doSign()
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
            V.ensure(V.isAddress(addr), `'signer' expected address type`)
            opts.signer = addr
            return this
        },
        link(url) {
            V.ensure(typeof url === 'string', `'link' expected string`)
            opts.link = url
            return this
        },
        request(msg) {
            V.ensure(typeof msg === 'object', 'expected object')
            V.ensure(msg.purpose === 'agreement' || msg.purpose === 'identification',
                `'purpose' expected 'agreement' or 'identification'`)
            V.ensure(typeof msg.payload === 'object', `'payload' expected object`)
            V.ensure(msg.payload.type === 'text', `'payload.type' unsupported`)
            V.ensure(typeof msg.payload.content === 'string', `'payload.content' expected string`)

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
