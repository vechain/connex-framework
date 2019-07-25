export function newHeadTracker(driver: Connex.Driver) {
    let head = { ...driver.initialHead }
    let resolvers: Array<() => void> = [];

    (async () => {
        for (; ;) {
            try {
                const newHead = await driver.getHead()
                if (newHead.id !== head.id && newHead.number >= head.number) {
                    head = { ...newHead }
                    const resolversCopy = resolvers
                    resolvers = []
                    resolversCopy.forEach(r => r())
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1 * 1000))
                }
            } catch {
                // rejection from driver.getHead means driver closed
                break
            }
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
