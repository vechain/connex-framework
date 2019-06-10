import { newAccountVisitor } from './account-visitor'
import { newBlockVisitor } from './block-visitor'
import { newTxVisitor } from './tx-visitor'
import { newFilter } from './filter'
import { newHeadPoller } from './head-poller'
import { newExplainer } from './explainer'

export function newThor(
    driver: Connex.Driver,
    genesis: Connex.Thor.Block,
    initialHead?: Connex.Thor.Status['head']
): Connex.Thor {
    const poller = newHeadPoller(driver, genesis.timestamp, initialHead || {
        id: genesis.id,
        number: genesis.number,
        timestamp: genesis.timestamp,
        parentID: genesis.parentID
    })

    const ctx: Context = {
        driver,
        get head() { return poller.head }
    }

    return {
        genesis,
        get status() {
            return {
                head: poller.head,
                progress: poller.progress
            }
        },
        ticker: () => poller.ticker(),
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
