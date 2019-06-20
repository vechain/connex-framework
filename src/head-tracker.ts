export function newHeadTracker(driver: Connex.Driver) {
    let head = { ...driver.getHead() }
    let resolvers: Array<() => void> = [];

    (async () => {
        for (; ;) {
            const newHead = { ...driver.getHead() }
            if (newHead.id !== head.id && newHead.number >= head.number) {
                head = newHead
                const resolversCopy = resolvers
                resolvers = []
                resolversCopy.forEach(r => r())
            }
            await new Promise(resolve => setTimeout(resolve, 1 * 1000))
        }
    })()

    const genesisTs = driver.genesis.timestamp

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
                        resolvers.push(() => {
                            resolve()
                            lastHeadId = head.id
                        })
                    })
                }
            }
        }
    }
}
