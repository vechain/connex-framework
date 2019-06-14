import * as V from './validator'

const MAX_LIMIT = 256

export function newFilter<T extends 'event' | 'transfer'>(
    ctx: Context,
    kind: T
): Connex.Thor.Filter<T> {

    const filterBody = {
        range: {
            unit: 'block',
            from: 0,
            to: 2 ** 32 - 1
        },
        options: {
            offset: 0,
            limit: 10
        },
        criteriaSet: [] as Array<Connex.Thor.Event.Criteria | Connex.Thor.Transfer.Criteria>,
        order: 'asc'
    }

    return {
        criteria(set) {
            V.ensure(Array.isArray(set),
                `arg0 expected array`)

            if (kind === 'event') {
                filterBody.criteriaSet = (set as Connex.Thor.Event.Criteria[])
                    .map((c, i) => {
                        V.ensure(!c.address || V.isAddress(c.address),
                            `arg0.#${i}.address expected address`)
                        const topics: Array<keyof typeof c> = ['topic0', 'topic1', 'topic2', 'topic3', 'topic4']
                        topics.forEach(t => {
                            V.ensure(!c[t] || V.isBytes32(c[t]!),
                                `arg0.#${i}.${t} expected bytes32`)
                        })

                        return {
                            address: c.address ? c.address.toLowerCase() : undefined,
                            topic0: c.topic0 ? c.topic0.toLowerCase() : undefined,
                            topic1: c.topic1 ? c.topic1.toLowerCase() : undefined,
                            topic2: c.topic2 ? c.topic2.toLowerCase() : undefined,
                            topic3: c.topic3 ? c.topic3.toLowerCase() : undefined,
                            topic4: c.topic4 ? c.topic4.toLowerCase() : undefined
                        }
                    })
            } else {
                filterBody.criteriaSet = (set as Connex.Thor.Transfer.Criteria[])
                    .map((c, i) => {
                        V.ensure(!c.txOrigin || V.isAddress(c.txOrigin),
                            `arg0.#${i}.txOrigin expected address`)
                        V.ensure(!c.sender || V.isAddress(c.sender),
                            `arg0.#${i}.sender expected address`)
                        V.ensure(!c.recipient || V.isAddress(c.recipient),
                            `arg0.#${i}.recipient expected address`)
                        return {
                            txOrigin: c.txOrigin ? c.txOrigin.toLowerCase() : undefined,
                            sender: c.sender ? c.sender.toLowerCase() : undefined,
                            recipient: c.recipient ? c.recipient.toLowerCase() : undefined
                        }
                    })

            }
            return this
        },
        range(range) {
            V.ensure(range instanceof Object,
                `arg0 expected object`)
            V.ensure(range.unit === 'block' || range.unit === 'time',
                `arg0.unit expected 'block' or 'time'`)
            V.ensure(range.to >= 0 && Number.isSafeInteger(range.to),
                `arg0.to expected non-neg safe integer`)
            V.ensure(range.from >= 0 && Number.isSafeInteger(range.from),
                `arg0.from expected non-neg safe integer`)

            filterBody.range = { ...range }
            return this
        },
        order(order) {
            V.ensure(order === 'asc' || order === 'desc',
                `arg0 expected 'asc' or 'desc'`)
            filterBody.order = order
            return this
        },
        apply(offset, limit) {
            V.ensure(offset >= 0 && Number.isSafeInteger(offset),
                `arg0 expected non-neg safe integer`)
            V.ensure(limit >= 0 && limit <= MAX_LIMIT && Number.isInteger(limit),
                `arg1 expected integer in [0, ${MAX_LIMIT}]`)

            filterBody.options.offset = offset
            filterBody.options.limit = limit

            if (kind === 'transfer') {
                return ctx.driver.filterTransferLogs(filterBody as any) as Promise<any>
            } else {
                return ctx.driver.filterEventLogs(filterBody as any) as Promise<any>
            }
        }
    }
}
