import { Driver } from './driver'

export function newHeadTracker(driver: Driver, genesisTs: number, initialHead: Connex.Thor.Status['head']) {
    let head = { ...initialHead }
    let tickerResolvers: Array<() => void> = [];

    (async () => {
        for (; ;) {
            try {
                head = await driver.pullHead()
                const tickerResolversCopy = tickerResolvers
                tickerResolvers = []
                tickerResolversCopy.forEach(r => r())
            // tslint:disable-next-line:no-empty
            } catch (err) {
            }
        }
    })()

    return {
        get head() { return head },
        get progress() {
            const nowTsMs = Date.now()
            const headTsMs = head.timestamp * 1000
            if (nowTsMs - headTsMs < 30 * 1000) {
                return 1
            }
            const genesisTsMs = genesisTs * 1000
            const p = (headTsMs - genesisTsMs) / (nowTsMs - genesisTsMs)
            return p < 0 ? NaN : p
        },
        ticker: () => {
            let lastHeadId = head.id
            return {
                next: () => {
                    return new Promise<void>(resolve => {
                        if (lastHeadId !== head.id) {
                            lastHeadId = head.id
                            return resolve()
                        }
                        tickerResolvers.push(() => {
                            resolve()
                            lastHeadId = head.id
                        })
                    })
                }
            }
        }
    }
}
