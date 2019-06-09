import { newAccountVisitor } from './account-visitor'
import { newBlockVisitor } from './block-visitor'
import { newTxVisitor } from './tx-visitor'
import { newFilter } from './filter'
import { newHeadTracker } from './head-tracker'
import { newExplainer } from './explainer'
import * as V from './validator'
import { Driver } from './driver'

export function newThor(
    driver: Driver,
    genesis: Connex.Thor.Block,
    initialHead?: Connex.Thor.Status['head']
): Connex.Thor {
    const headTracker = newHeadTracker(driver, genesis.timestamp, initialHead || {
        id: genesis.id,
        number: genesis.number,
        timestamp: genesis.timestamp,
        parentID: genesis.parentID
    })

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
            V.ensure(V.isAddress(addr), `'addr' expected address type`)
            return newAccountVisitor(driver, addr, () => headTracker.head.id)
        },
        block: revision => {
            if (typeof revision === 'string') {
                V.ensure(V.isBytes32(revision), `'revision' expected bytes32 in hex string`)
            } else if (typeof revision === 'number') {
                V.ensure(V.isUint32(revision), `'revision' expected non-neg 32bit integer`)
            } else if (typeof revision === 'undefined') {
                revision = headTracker.head.id
            } else {
                V.ensure(false, `'revision' has invalid type`)
            }
            return newBlockVisitor(driver, revision)
        },
        transaction: id => {
            V.ensure(V.isBytes32(id), `'id' expected bytes32 in hex string`)
            return newTxVisitor(driver, id, () => headTracker.head.id)
        },
        filter: kind => {
            return newFilter(driver, kind)
        },
        explain: () => newExplainer(driver, () => headTracker.head.id)
    }
}
