import { newThor } from './thor'
import { newVendor } from './vendor'
import { Driver } from './driver'
import { version as connexVersion } from '@vechain/connex/package.json'

export function newConnex(
    driver: Driver,
    genesis: Connex.Thor.Block,
    initialHead?: Connex.Thor.Status['head']
): Connex {
    return {
        thor: newThor(driver, genesis, initialHead),
        vendor: newVendor(driver),
        version: connexVersion
    }
}

export { Driver }
