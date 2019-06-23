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
            V.validate(val, 'big_int', 'arg0')
            value = val
            return this
        },
        caller(caller) {
            V.validate(caller, 'address', 'arg0')
            opts.caller = caller.toLowerCase()
            return this
        },
        gas(gas) {
            V.validate(gas, 'uint64', 'arg0')
            opts.gas = gas
            return this
        },
        gasPrice(gp) {
            V.validate(gp, 'big_int', 'arg0')
            opts.gasPrice = gp.toString().toLowerCase()
            return this
        },
        cache(ties: string[]) {
            V.validate(ties, ['address'], 'arg0')
            cacheTies = ties.map(t => t.toLowerCase())
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
                    clauses: [clause as any],
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
