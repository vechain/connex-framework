import { Driver } from './driver'
import * as V from './validator'

export function newVendor(driver: Driver): Connex.Vendor {
    const addrTracker = newOwnedAddressesTracker(driver)
    return {
        sign: (kind: 'tx' | 'cert') => {
            return (kind === 'tx' ? newTxSigningService(driver) : newCertSigningService(driver)) as any
        },
        owned: (addr) => {
            return addrTracker.addresses.indexOf(addr) >= 0
        }
    }
}

function newOwnedAddressesTracker(driver: Driver) {
    let addresses = [] as string[]
    (async () => {
        for (; ;) {
            try {
                addresses = await driver.pullOwnedAddresses()
            // tslint:disable-next-line:no-empty
            } catch {
            }
        }
    })()

    return {
        get addresses() { return addresses }
    }
}

function newTxSigningService(driver: Driver): Connex.Vendor.TxSigningService {
    const opts: {
        signer?: string
        gas?: number
        dependsOn?: string
        link?: string
        comment?: string
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
        async request(msg) {
            V.ensure(Array.isArray(msg), 'expected array')
            msg = msg.map((c, i) => {
                c = { ...c }
                c.to = c.to || null
                c.value = c.value || 0
                c.data = c.data || '0x'
                c.comment = c.comment || ''

                V.ensure(!c.to || V.isAddress(c.to), `'#${i}.to' expected null or address type`)
                V.ensure(typeof c.value === 'string' ?
                    (/^0x[0-9a-f]+$/i.test(c.value) || /^[1-9][0-9]+$/.test(c.value))
                    : Number.isSafeInteger(c.value),
                    `'#${i}.value' expected non-negative safe integer or integer in hex|dec string`)
                V.ensure(/^0x([0-9a-f][0-9a-f])*$/i.test(c.data),
                    `'#${i}.data' expected bytes in hex`)
                V.ensure(typeof c.comment === 'string', `'#${i}.comment' expected string`)
                return c
            })
            const r = await driver.buildTx(msg, opts)
            return r.sign()
        }
    }
}

function newCertSigningService(driver: Driver): Connex.Vendor.CertSigningService {
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
            return driver.signCert(msg, opts)
        }
    }
}
