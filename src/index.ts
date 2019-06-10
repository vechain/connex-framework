import { newThor } from './thor'
import { newVendor } from './vendor'
import { Driver } from './driver'
import { version as connexVersion } from '@vechain/connex/package.json'

export class ConnexImpl implements Connex {
    public readonly version = connexVersion
    public readonly thor: Connex.Thor
    public readonly vendor: Connex.Vendor

    constructor(
        driver: Driver,
        genesis: Connex.Thor.Block,
        initialHead?: Connex.Thor.Status['head']
    ) {
        this.thor = newThor(driver, genesis, initialHead)
        this.vendor = newVendor(driver)
    }
}

export { Driver }
