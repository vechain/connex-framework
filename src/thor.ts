import { newAccountVisitor } from './account-visitor'
import { newBlockVisitor } from './block-visitor'
import { newTxVisitor } from './tx-visitor'
import { newFilter } from './filter'
import { newHeadTracker } from './head-tracker'
import { newExplainer } from './explainer'

export function newThor(driver: Connex.Driver): Connex.Thor {
    const headTracker = newHeadTracker(driver)

    const ctx: Context = {
        driver,
        get trackedHead() { return headTracker.head }
    }

    const genesis = JSON.parse(JSON.stringify(driver.genesis))
    return {
        genesis,
        get status() {
            return {
                head: headTracker.head,
                progress: headTracker.progress
            }
        },
        ticker: () => headTracker.ticker(),
        account: addr => {
            return newAccountVisitor(ctx, addr)
        },
        block: revision => {
            return newBlockVisitor(ctx, revision)
        },
        transaction: id => {
            return newTxVisitor(ctx, id)
        },
        filter: kind => {
            return newFilter(ctx, kind)
        },
        explain: () => newExplainer(ctx)
    }
}
