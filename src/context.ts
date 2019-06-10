
import { Driver } from './driver'

export interface Context {
    readonly driver: Driver
    readonly head: Connex.Thor.Status['head']
}
