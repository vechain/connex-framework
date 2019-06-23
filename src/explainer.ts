import * as V from './validator'
import { decodeRevertReason } from './revert-reason'

export function newExplainer(ctx: Context): Connex.Thor.Explainer {
    const opts: {
        caller?: string
        gas?: number
        gasPrice?: string
    } = {}

    return {
        caller(addr) {
            V.validate(addr, 'address', 'arg0')
            opts.caller = addr.toLowerCase()
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
        execute(clauses) {
            V.validate(clauses, [clauseScheme], 'arg0')

            const transformedClauses = clauses.map(c => {
                return {
                    to: c.to ? c.to.toLowerCase() : null,
                    value: c.value.toString().toLowerCase(),
                    data: (c.data || '0x').toLowerCase()
                }
            })

            return ctx.driver.explain(
                {
                    clauses: transformedClauses,
                    ...opts
                },
                ctx.trackedHead.id)
                .then(outputs => {
                    return outputs.map(o => {
                        if (o.reverted) {
                            const revertReason = decodeRevertReason(o.data)
                            return { ...o, decoded: { revertReason } }
                        }
                        return o
                    })
                })
        }
    }
}

const clauseScheme: V.Scheme<Connex.Thor.Clause> = {
    to: new V.Nullable('address'),
    value: 'big_int',
    data: new V.Optional('bytes')
}
