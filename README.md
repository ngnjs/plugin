# NGN Plugin

[NGN](https://ngn.js.org) 2.0.0+ can be extended through plugins. A NGN plugin is a JavaScript module which depends on/extends an NGN module (or part of a module) within a _system_.

In order to create an NGN plugin, a module must have a reference to NGN and any other modules loaded before it. This module provides the references to any instance of NGN available within the JavaScript runtime.

## Usage

```javascript
import Reference from 'https://domain.tld/path/to/this/library.js'

// Create a reference to NGN
const NGN = new Reference()

export default class MyPlugin extends NGN.EventEmitter {
  constructor () {
    super(...arguments)

    console.log('Hello')
  }
}

NGN.MyPlugin = MyPlugin // Optional
```

Let's deconstruct the code above.

1. The reference module is imported (i.e. this module). The `Reference` class performs all of the lookups necessary to find NGN, returning a proxy to all of the core NGN modules and any plugins.

1. Next, notice the class extends the `NGN.EventEmitter` class, which is a part of the [NGN core](https://github.com/ngnjs/ngn) library.

1. Finally, the optional last line exposes the new module to NGN, making it available for use in other modules.

## Additonal Features

It is also possible to require specific components from an NGN environment, use different versions, & require a minimum version. See the unit tests for working examples.

### Requiring a NGN Component (Dependency)

It is possible to require a specific feature, which includes features added by other plugins.

```javascript
const NGN = new Reference()

// Does nothing (No-op) since both items existin the NGN core.
NGN.requires('EventEmitter', 'Middleware')

// Throws an error
NGN.requires('DoesNotExist')
```

### Require a minimum NGN version

NGN references use the npm package nomenclature for defining minimum requirements.

```javascript
// A specific version
const NGN = new Reference('2.0.0')

// Any version in the 2.x.x range
const NGN = new Reference('^2.0.0')

// Any version in the 2.0.x range
const NGN = new Reference('~2.0.0')

// Anything greater than 2.0.0
const NGN = new Reference('>2.0.0')

// Anything greater than or equal to 2.0.0
const NGN = new Reference('>=2.0.0')

// Anything less than 2.0.0
const NGN = new Reference('<2.0.0')

// Anything less than or equal to 2.0.0
const NGN = new Reference('<=2.0.0')
```

### Use a Specific Version

It is possible to use more than one version of NGN if multiple versions are available. Remember, references were introduced in NGN 2.0.0. They are not available in the 1.x.x release line.

```javascript
const NGN = new Reference()
const CURRENT = NGN.use('2.0.0')
const BETA = NGN.use('2.1.0-beta')

class MyPlugin extends CURRENT.EventEmitter {
  ...
}

class MyNewPlugin extends BETA.EventEmitter {
  ...
}
```

### Export (Apply) Plugin to NGN

References will always identify plugins within the referenced version of NGN, but sometimes users wish to use the original NGN namespace.

For example:

```javascript
import NGN from 'https://domain.com/ngn/index.js'
import MyPlugin from 'https://domain.com/plugin/index.js'

console.log(NGN.MyPlugin)
```

To make this scenario work, the plugin needs to export itself to NGN. This can be done with a named reference:

```javascript
const NGN = new Reference()

class CustomPlugin extends NGN.EventEmitter {
  ...
}

NGN.export('MyPlugin', CustomPlugin)
```
