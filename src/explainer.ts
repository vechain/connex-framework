import * as V from './validator'
import { Context } from './context'

export function newExplainer(ctx: Context): Connex.Thor.Explainer {
    const opts: {
        caller?: string
        gas?: number
        gasPrice?: string
    } = {}
    return {
        caller(addr) {
            V.ensure(V.isAddress(addr), `'addr' expected address type`)
            opts.caller = addr
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
        execute(clauses) {
            V.ensure(Array.isArray(clauses), `'clauses' expected array`)
            clauses = clauses.map((c, i) => {
                V.ensure(c.to === null || V.isAddress(c.to), `'clauses#${i}.to' expected null or address`)
                if (typeof c.value === 'number') {
                    V.ensure(Number.isSafeInteger(c.value) && c.value >= 0,
                        `'clauses#${i}.value' expected non-neg safe integer`)
                } else {
                    V.ensure(V.isHexString(c.value) || V.isDecString(c.value),
                        `'clauses#${i}.value' expected integer in hex/dec string`)
                }
                V.ensure(!c.data || V.isHexBytes(c.data), `'clauses#${i}.data' expected bytes in hex string`)
                return {
                    to: c.to,
                    value: c.value.toString(),
                    data: c.data || ''
                }
            })

            return ctx.driver.explain(
                {
                    clauses,
                    ...opts
                },
                ctx.head.id)
        }
    }
}
