import { newEventVisitor } from './event-visitor'
import { newMethod } from './method'
import * as V from './validator'
import { Driver } from './driver'

export function newAccountVisitor(
    driver: Driver,
    addr: string,
    headId: () => string
): Connex.Thor.AccountVisitor {
    return {
        get address() { return addr },
        get: () => {

            return driver.getAccount(addr, headId())
        },
        getCode: () => {
            return driver.getCode(addr, headId())
        },
        getStorage: key => {
            V.ensure(V.isBytes32(key), `'key' expected bytes32 in hex string`)
            return driver.getStorage(addr, key, headId())
        },
        method: jsonABI => {
            return newMethod(driver, addr, jsonABI, headId)
        },
        event: jsonABI => {
            return newEventVisitor(driver, jsonABI, addr)
        }
    }
}
