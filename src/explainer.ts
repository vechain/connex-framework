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
            V.ensure(V.isAddress(addr),
                `arg0 expected address`)
            opts.caller = addr.toLowerCase()
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
        execute(clauses) {
            V.ensure(Array.isArray(clauses),
                `arg0 expected array`)

            clauses = clauses.map((c, i) => {
                V.ensure(c.to === null || V.isAddress(c.to),
                    `arg0.#${i}.to expected null or address`)
                V.ensure(typeof c.value === 'string' ?
                    (V.isHexString(c.value) || V.isDecString(c.value)) :
                    (Number.isSafeInteger(c.value) && c.value >= 0),
                    `arg0.#${i}.value expected non-neg safe integer or hex/dec string`)
                V.ensure(!c.data || V.isHexBytes(c.data),
                    `arg0.#${i}.data expected bytes hex string`)

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
