import { Framework } from '../src'
import { Driver, SimpleNet, SimpleWallet } from '@vechain/connex.driver-nodejs'

interface Global extends NodeJS.Global {
    connex: Connex,
    location: {
        hostname: string
    }
}

declare var global: Global
global.location = {
    hostname: 'localhost'
}

const loadConnex = async () => {
    if (global.connex) {
        return
    }
    const wallet = new SimpleWallet()
    wallet.import('0xdce1443bd2ef0c2631adc1c67e5c93f13dc23a41c18b536effbbdcbcdb96fb65')
    wallet.import('0x597e2578f78813828306e0378036c8e06214c1d3f4da8f028b0d9660808cf481')

    const driver = await Driver.connect(new SimpleNet('https://sync-testnet.vechain.org/'), wallet)

    global.connex = new Framework(Framework.guardDriver(driver, err => {
        it('driver guard should not emit error', done => done(err))
    }))
}

before(() => {
    return loadConnex()
})

require('connex-tests')
