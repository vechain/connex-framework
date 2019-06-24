
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

export function isBigInt(v: number | string) {
    return typeof v === 'string' ?
        (isDecString(v) || isHexString(v)) :
        isUInt(v, 0)
}

export class BadParameter extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
BadParameter.prototype.name = 'BadParameter'

export function ensure(b: boolean, msg: string) {
    if (!b) {
        throw new BadParameter(msg)
    }
}

type BaseRule =
    'bytes' |
    'bytes8' |
    'bytes32' |
    'uint8' |
    'uint32' |
    'uint64' |
    'bool' |
    'big_int' |
    'hex_string' |
    'address' |
    'string'

export class Optional<T> {
    constructor(readonly rule: T) { }
}
export class Nullable<T> {
    constructor(readonly rule: T) { }
}

export type Scheme<
    T,
    U = T extends object ? Required<T> : T,
    V = U extends object ? { [P in keyof U]: Scheme<U[P]> } : BaseRule
    > = V | Optional<V> | Nullable<V> | ((prop: T) => string)

export function validate<T>(value: T, scheme: Scheme<T>, path: string) {
    if (Array.isArray(scheme)) {
        if (!Array.isArray(value)) {
            throw new BadParameter(`${path} expected array`)
        }
        value.forEach((el, i) => validate(el, scheme[0], `${path}.#${i}`))
    } else if (scheme instanceof Optional) {
        // tslint:disable-next-line:no-unused-expression
        value === undefined || validate<T>(value, scheme.rule, path)
    } else if (scheme instanceof Nullable) {
        // tslint:disable-next-line:no-unused-expression
        value === null || validate<T>(value, scheme.rule, path)
    } else if (scheme instanceof Function) {
        const err = (scheme as any)(value) as string
        if (err) {
            throw new BadParameter(err)
        }
    } else if (scheme instanceof Object) {
        if (!(value instanceof Object)) {
            throw new BadParameter(`${path} expected object`)
        }
        for (const key in scheme) {
            if (scheme.hasOwnProperty(key)) {
                validate<any>(value[key as never], scheme[key] as any, `${path}.${key}`)
            }
        }
    } else { // base type
        const err = validateBaseRule(value, scheme as any)
        if (err && typeof err === 'string') {
            throw new BadParameter(`${path} ${err}`)
        }
    }
}

function validateBaseRule(value: any, rule: BaseRule) {
    switch (rule) {
        case 'bytes':
            return isHexBytes(value) || 'expected bytes in hex string'
        case 'bytes8':
            return isHexBytes(value, 8) || 'expected bytes8'
        case 'bytes32':
            return isHexBytes(value, 32) || 'expected bytes32'
        case 'uint8':
            return isUInt(value, 8) || 'expected 8-bit unsigned integer'
        case 'uint32':
            return isUInt(value, 32) || 'expected 32-bit unsigned integer'
        case 'uint64':
            return isUInt(value, 64) || 'expected 64-bit unsigned integer'
        case 'bool':
            return typeof value === 'boolean' || 'expected boolean'
        case 'big_int':
            return isBigInt(value) || 'expected unsigned integer in number or string'
        case 'hex_string':
            return isHexString(value) || 'expected integer in hex string'
        case 'address':
            return isHexBytes(value, 20) || 'expected address'
        case 'string':
            return typeof value === 'string' || 'expected string'
    }
}
