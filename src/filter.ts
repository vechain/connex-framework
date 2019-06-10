import * as V from './validator'

const MAX_LIMIT = 256

export function newFilter<T extends 'event' | 'transfer'>(
    ctx: Context,
    kind: T
): Connex.Thor.Filter<T> {

    if (kind !== 'event' && kind !== 'transfer') {
        throw new V.BadParameter(`'kind' unsupported filter kind`)
    }

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
            V.ensure(Array.isArray(set), `'set' expected array`)
            if (kind === 'event') {
                filterBody.criteriaSet = (set as Connex.Thor.Event.Criteria[])
                    .map((c, i) => {
                        V.ensure(!c.address || V.isAddress(c.address), `'criteria#${i}.address' expected address`)
                        const topics: Array<keyof typeof c> = ['topic0', 'topic1', 'topic2', 'topic3', 'topic4']
                        topics.forEach(t => {
                            V.ensure(!c[t] || V.isBytes32(c[t]!), `'criteria#${i}.${t}' expected bytes32`)
                        })

                        return {
                            address: c.address || undefined,
                            topic0: c.topic0 || undefined,
                            topic1: c.topic1 || undefined,
                            topic2: c.topic2 || undefined,
                            topic3: c.topic3 || undefined,
                            topic4: c.topic4 || undefined
                        }
                    })
            } else {
                filterBody.criteriaSet = (set as Connex.Thor.Transfer.Criteria[])
                    .map((c, i) => {
                        V.ensure(!c.txOrigin || V.isAddress(c.txOrigin), `'criteria#${i}.txOrigin' expected address`)
                        V.ensure(!c.sender || V.isAddress(c.sender), `'criteria#${i}.sender' expected address`)
                        V.ensure(!c.recipient || V.isAddress(c.recipient), `'criteria#${i}.recipient' expected address`)
                        return {
                            txOrigin: c.txOrigin || undefined,
                            sender: c.sender || undefined,
                            recipient: c.recipient || undefined
                        }
                    })

            }
            return this
        },
        range(range) {
            V.ensure(range instanceof Object, `'range' expected object`)
            V.ensure(range.unit === 'block' || range.unit === 'time', `'range.unit' expected 'block' or 'time'`)
            V.ensure(range.to >= 0 && Number.isSafeInteger(range.to), `'range.to' expected non-neg safe integer`)
            V.ensure(range.from >= 0 && Number.isSafeInteger(range.from), `'range.from' expected non-neg safe integer`)

            filterBody.range = { ...range }
            return this
        },
        order(order) {
            V.ensure(order === 'asc' || order === 'desc', `'order' expected 'asc' or 'desc'`)
            filterBody.order = order
            return this
        },
        apply(offset, limit) {
            V.ensure(offset >= 0 && Number.isSafeInteger(offset), `'offset' expected non-neg safe integer`)
            V.ensure(limit >= 0 && limit <= MAX_LIMIT && Number.isInteger(limit),
                `'limit' expected integer in [0, ${MAX_LIMIT}]`)

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
