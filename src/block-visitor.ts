import * as V from './validator'

export function newBlockVisitor(
    ctx: Context,
    revision?: string | number
): Connex.Thor.BlockVisitor {
    if (typeof revision === 'string') {
        V.ensure(V.isBytes32(revision), `'revision' expected bytes32 in hex string`)
    } else if (typeof revision === 'number') {
        V.ensure(V.isUint32(revision), `'revision' expected non-neg 32bit integer`)
    } else if (typeof revision === 'undefined') {
        revision = ctx.trackedHead.id
    } else {
        throw new V.BadParameter(`'revision' has invalid type`)
    }

    return {
        get revision() { return revision! },
        get: () => ctx.driver.getBlock(revision!)
    }
}
