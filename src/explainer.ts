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
            V.ensureAddress(addr, 'arg0')
            opts.caller = addr.toLowerCase()
            return this
        },
        gas(gas) {
            V.ensureUInt(gas, 64, 'arg0')
            opts.gas = gas
            return this
        },
        gasPrice(gp) {
            V.ensureUIntStr(gp, 'arg0')
            opts.gasPrice = gp.toLowerCase()
            return this
        },
        execute(clauses) {
            V.ensureArray(clauses, 'arg0')

            clauses = clauses.map((c, i) => {
                if (c.to) {
                    V.ensureAddress(c.to, `arg0.#${i}.to`)
                }
                V.ensureUIntNumberOrString(c.value, `arg0.#${i}.value`)
                if (c.data) {
                    V.ensureBytes(c.data, `arg0.#${i}.data`)
                }

                return {
                    to: c.to ? c.to.toLowerCase() : null,
                    value: c.value.toString().toLowerCase(),
                    data: (c.data || '0x').toLowerCase()
                }
            })

            return ctx.driver.explain(
                {
                    clauses,
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
