import { newEventVisitor } from './event-visitor'
import { newMethod } from './method'
import { abi } from '@vechain/abi'
import * as V from './validator'

export function newAccountVisitor(
    ctx: Context,
    addr: string
): Connex.Thor.AccountVisitor {
    return {
        get address() { return addr },
        get: () => {
            return ctx.driver.getAccount(addr, ctx.trackedHead.id)
        },
        getCode: () => {
            return ctx.driver.getCode(addr, ctx.trackedHead.id)
        },
        getStorage: key => {
            V.ensure(V.isBytes32(key),
                `arg0 expected bytes32`)
            return ctx.driver.getStorage(addr, key.toLowerCase(), ctx.trackedHead.id)
        },
        method: jsonABI => {
            let coder
            try {
                coder = new abi.Function(JSON.parse(JSON.stringify(jsonABI)))
            } catch (err) {
                throw new V.BadParameter(`arg0 is invalid: ${err.message}`)
            }
            return newMethod(ctx, addr, coder)
        },
        event: jsonABI => {
            let coder
            try {
                coder = new abi.Event(JSON.parse(JSON.stringify(jsonABI)))
            } catch (err) {
                throw new V.BadParameter(`arg0 is invalid: ${err.message}`)
            }
            return newEventVisitor(ctx, addr, coder)
        }
    }
}
