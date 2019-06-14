import { abi } from '@vechain/abi'
import * as V from './validator'
import { decodeRevertReason } from './revert-reason'

export function newMethod(
    ctx: Context,
    addr: string,
    coder: abi.Function
): Connex.Thor.Method {

    let value: string | number = 0
    const opts: {
        caller?: string
        gas?: number
        gasPrice?: string
    } = {}

    let cacheTies: string[] | undefined

    return {
        value(val) {
            V.ensure(typeof val === 'string' ?
                (V.isHexString(val) || V.isDecString(val)) : (Number.isSafeInteger(val) && val >= 0),
                'arg0 expected non-neg safe integer or hex/dec string')

            value = val
            return this
        },
        caller(caller) {
            V.ensure(V.isAddress(caller),
                `arg0 expected address`)
            opts.caller = caller.toLowerCase()
            return this
        },
        gas(gas) {
            V.ensure(gas >= 0 && Number.isSafeInteger(gas),
                `arg0 expected non-neg safe integer`)
            opts.gas = gas
            return this
        },
        gasPrice(gp) {
            V.ensure(V.isDecString(gp) || V.isHexString(gp),
                `arg0 expected integer in hex/dec string`)
            opts.gasPrice = gp.toLowerCase()
            return this
        },
        cache(ties: string[]) {
            V.ensure(Array.isArray(ties),
                `arg0 expected array`)
            cacheTies = ties.map((t, i) => {
                V.ensure(V.isAddress(t),
                    `arg0.#${i} expected address`)
                return t.toLowerCase()
            })
            return this
        },
        asClause: (...args) => {
            const inputsLen = (coder.definition.inputs || []).length
            V.ensure(inputsLen === args.length, `args count expected ${inputsLen}`)
            try {
                const data = coder.encode(...args)
                return {
                    to: addr,
                    value: value.toString().toLowerCase(),
                    data
                }
            } catch (err) {
                throw new V.BadParameter(`args can not be encoded: ${err.message}`)
            }
        },
        call(...args) {
            const clause = this.asClause(...args)
            return ctx.driver.explain(
                {
                    clauses: [clause],
                    ...opts
                },
                ctx.trackedHead.id,
                cacheTies
            )
                .then(outputs => outputs[0])
                .then(output => {
                    if (output.reverted) {
                        const revertReason = decodeRevertReason(output.data)
                        return { ...output, decoded: { revertReason } }
                    } else {
                        const decoded = coder.decode(output.data)
                        return { ...output, decoded }
                    }
                })
        }
    }
}
