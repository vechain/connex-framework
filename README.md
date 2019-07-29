# Connex Framework

[![npm version](https://badge.fury.io/js/%40vechain%2Fconnex-framework.svg)](https://badge.fury.io/js/%40vechain%2Fconnex-framework)

Connex Framework is a library implements Connex interface. 
It helps various wallet instances offer consistent Connex interface to VeChain DApps.

## Installation

```sh
npm i @vechain/connex-framework
```

To create framework instance, the driver needs to be implemented

```typescript
import { Framework } from '@vechain/connex-framework'
class MyDriver implemented Connex.Driver {
    // implementations
}

let driver = new MyDriver()

// it's suggested in development mode, which is helpful to diagnose driver implementation.
driver = Framework.guardDriver(driver)

const framework = new Framework(driver)
// here `framework` is the Connex instance object
```

## See also

### Driver implementations:

* NodeJS - [connex.driver-nodejs](https://github.com/vechain/connex.driver-nodejs)

### Connex playground
* [connex repl](https://github.com/vechain/connex-repl)
