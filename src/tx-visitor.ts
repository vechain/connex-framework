import { Driver } from './driver'

export function newTxVisitor(
    driver: Driver,
    id: string,
    headId: () => string
): Connex.Thor.TransactionVisitor {
    return {
        get id() { return id },
        get: () => driver.getTransaction(id, headId()),
        getReceipt: () => driver.getReceipt(id, headId())
    }
}
