import { Context } from './context'
import * as V from './validator'

export function newTxVisitor(
    ctx: Context,
    id: string
): Connex.Thor.TransactionVisitor {
    V.ensure(V.isBytes32(id), `'id' expected bytes32 in hex string`)

    return {
        get id() {
            return id
        },
        get: () => ctx.driver.getTransaction(id, ctx.head.id),
        getReceipt: () => ctx.driver.getReceipt(id, ctx.head.id)
    }
}
