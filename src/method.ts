import { abi } from '@vechain/abi'
import * as V from './validator'
import { Context } from './context'

export function newMethod(
    ctx: Context,
    addr: string,
    jsonABI: object
): Connex.Thor.Method {
    const coder = (() => {
        try {
            return new abi.Function(JSON.parse(JSON.stringify(jsonABI)))
        } catch (err) {
            throw new V.BadParameter(`'abi' is invalid: ${err.message}`)
        }
    })()

    let value: string | number = 0
    const opts: {
        caller?: string
        gas?: number
        gasPrice?: string
    } = {}

    let cacheTies: string[] | undefined

    return {
        value(val) {
            if (typeof val === 'number') {
                V.ensure(Number.isSafeInteger(val) && val >= 0,
                    `'value' expected non-neg safe integer`)
            } else {
                V.ensure(V.isHexString(val) || V.isDecString(val),
                    `'value' expected integer in hex/dec string`)
            }
            value = val
            return this
        },
        caller(caller) {
            V.ensure(V.isAddress(caller), `'caller' expected address type`)
            opts.caller = caller
            return this
        },
        gas(gas) {
            V.ensure(gas >= 0 && Number.isSafeInteger(gas), `'gas' expected non-neg safe integer`)
            opts.gas = gas
            return this
        },
        gasPrice(gp) {
            V.ensure(V.isDecString(gp) || V.isHexString(gp), `'gasPrice' expected integer in hex/dec string`)
            opts.gasPrice = gp
            return this
        },
        cache(ties: string[]) {
            V.ensure(Array.isArray(ties), `'ties' expected array`)
            ties.forEach((t, i) => {
                V.ensure(V.isAddress(t), `'ties.#${i}' expected address type`)
            })
            cacheTies = ties
            return this
        },
        asClause: (...args) => {
            const inputsLen = (coder.definition.inputs || []).length
            V.ensure(inputsLen === args.length, `'args' count expected ${inputsLen}`)
            try {
                const data = coder.encode(...args)
                return {
                    to: addr,
                    value: value.toString(),
                    data
                }
            } catch (err) {
                throw new V.BadParameter(`'args' can not be encoded: ${err.message}`)
            }
        },
        call(...args) {
            return ctx.driver.explain(
                {
                    clauses: [this.asClause(...args)],
                    ...opts
                },
                ctx.head.id,
                cacheTies)
                .then(outputs => outputs[0])
                .then(output => {
                    if (output.reverted) {
                        return output
                    } else {
                        const decoded = coder.decode(output.data) as any
                        return { ...output, decoded }
                    }
                })
        }
    }
}
