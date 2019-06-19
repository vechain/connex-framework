
export function isDecString(val: string) {
    return typeof val === 'string' && /^[0-9]+$/.test(val)
}

export function isHexString(val: string) {
    return typeof val === 'string' && /^0x[0-9a-f]+$/i.test(val)
}

export function isHexBytes(val: string, n?: number) {
    if (typeof val !== 'string' || !/^0x[0-9a-f]*$/i.test(val)) {
        return false
    }
    return n ? val.length === n * 2 + 2 : val.length % 2 === 0
}

export function isUInt(val: number, bit: number) {
    if (val < 0 || !Number.isInteger(val)) {
        return false
    }
    return bit ? val < 2 ** bit : true
}

export class BadParameter extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
BadParameter.prototype.name = BadParameter.name

export function ensure(b: boolean, msg: string) {
    if (!b) {
        throw new BadParameter(msg)
    }
}

export function ensureUInt(v: number, bit: number, ctx: string) {
    ensure(isUInt(v, bit), bit ?
        `${ctx} expected unsigned ${bit}-bit integer`
        : `${ctx} expected unsigned integer`
    )
}

export function ensureUIntNumberOrString(v: number | string, ctx: string) {
    ensure(typeof v === 'string' ?
        (isDecString(v) || isHexBytes(v)) :
        isUInt(v, 0),
        `${ctx} expected unsigned integer in number or string`)
}

export function ensureUIntStr(v: string, ctx: string) {
    ensure(isDecString(v) || isHexString(v), `${ctx} expected unsigned integer string`)
}

export function ensureAddress(v: string, ctx: string) {
    ensure(isHexBytes(v, 20), `${ctx} expected address`)
}

export function ensureArray(v: any[], ctx: string) {
    ensure(Array.isArray(v), `${ctx} expected array`)
}

export function ensureB32(v: string, ctx: string) {
    ensure(isHexBytes(v, 32), `${ctx} expected bytes32`)
}

export function ensureBytes(v: string, ctx: string) {
    ensure(isHexBytes(v), `${ctx} expected bytes in hex string`)
}

export function ensureObject(v: object, ctx: string) {
    ensure(v instanceof Object, `${ctx} expected object`)
}
