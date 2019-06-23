import '@vechain/connex'
import './connex.driver'
import { newThor } from './thor'
import { newVendor } from './vendor'
import { version as connexVersion } from '@vechain/connex/package.json'
import { newDriverGuard } from './driver-guard'

export class Framework implements Connex {
    public readonly version = connexVersion
    public readonly thor: Connex.Thor
    public readonly vendor: Connex.Vendor

    /**
     * constructor
     * @param driver the driver instance
     * @param production if set true to, driver guard will be disabled. Driver guard is useful in develop mode.
     */
    constructor(driver: Connex.Driver, production?: boolean) {
        if (!production) {
            driver = newDriverGuard(driver)
        }
        this.thor = newThor(driver)
        this.vendor = newVendor(driver)
    }
}
