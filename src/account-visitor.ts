import { newEventVisitor } from './event-visitor'
import { newMethod } from './method'
import * as V from './validator'

export function newAccountVisitor(
    ctx: Context,
    addr: string
): Connex.Thor.AccountVisitor {
    V.ensure(V.isAddress(addr), `'addr' expected address type`)

    return {
        get address() { return addr },
        get: () => {
            return ctx.driver.getAccount(addr, ctx.trackedHead.id)
        },
        getCode: () => {
            return ctx.driver.getCode(addr, ctx.trackedHead.id)
        },
        getStorage: key => {
            V.ensure(V.isBytes32(key), `'key' expected bytes32 in hex string`)
            return ctx.driver.getStorage(addr, key, ctx.trackedHead.id)
        },
        method: jsonABI => {
            return newMethod(ctx, addr, jsonABI)
        },
        event: jsonABI => {
            return newEventVisitor(ctx, jsonABI, addr)
        }
    }
}
