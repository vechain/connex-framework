import { newThor } from './thor'
import { Driver } from './driver'
import { newVendor } from './vendor'

export function newConnex(driver: Driver, genesis: Connex.Thor.Block, initialHead?: Connex.Thor.Status['head']): Connex {
    return {
        thor: newThor(driver, genesis, initialHead),
        vendor: newVendor(driver),
        version: ''
    }
}

export { Driver }
