import { Driver } from './driver'

export function newBlockVisitor(
    driver: Driver,
    revision: string | number
): Connex.Thor.BlockVisitor {
    return {
        get revision() { return revision },
        get: () => driver.getBlock(revision)
    }
}
