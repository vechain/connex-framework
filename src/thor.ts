import { newAccountVisitor } from './account-visitor'
import { newBlockVisitor } from './block-visitor'
import { newTxVisitor } from './tx-visitor'
import { newFilter } from './filter'
import { newHeadTracker } from './head-tracker'
import { newExplainer } from './explainer'
import * as V from './validator'

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
            V.validate(addr, 'address', 'arg0')
            return newAccountVisitor(ctx, addr.toLowerCase())
        },
        block: revision => {
            if (typeof revision === 'undefined') {
                revision = ctx.trackedHead.id
            } else {
                V.ensure(typeof revision === 'string' ? V.isHexBytes(revision, 32) : V.isUInt(revision, 32),
                    'arg0 expected bytes32 or unsigned 32-bit integer')
            }
            return newBlockVisitor(ctx, typeof revision === 'string' ? revision.toLowerCase() : revision)
        },
        transaction: id => {
            V.validate(id, 'bytes32', 'arg0')
            return newTxVisitor(ctx, id.toLowerCase())
        },
        filter: kind => {
            V.ensure(kind === 'event' || kind === 'transfer',
                `arg0 expected 'event' or 'transfer'`)
            return newFilter(ctx, kind)
        },
        explain: () => newExplainer(ctx)
    }
}
