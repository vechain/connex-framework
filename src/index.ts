import '@vechain/connex'
import './connex.driver'
import { newThor } from './thor'
import { newVendor } from './vendor'
import { version as connexVersion } from '@vechain/connex/package.json'

export class Framework implements Connex {
    public readonly version = connexVersion
    public readonly thor: Connex.Thor
    public readonly vendor: Connex.Vendor

    constructor(driver: Connex.Driver) {
        this.thor = newThor(driver)
        this.vendor = newVendor(driver)
    }
}
