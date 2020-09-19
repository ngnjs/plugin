<h1 align="center">NGN Plugins<br/><img src="https://img.shields.io/npm/v/@ngnjs/plugin?label=%40ngnjs/plugin&logo=npm&style=social"/></h1>


[NGN](https://ngn.js.org) 2.0.0+ can be extended through plugins. A NGN plugin is a JavaScript module which depends on/extends an NGN module (or part of a module) within a _system_.

In order to create an NGN plugin, a module must have a reference to NGN and any other modules loaded before it. This module provides the references to any instance of NGN available within the JavaScript runtime.

## Usage

```javascript
import Reference from 'https://cdn.skypack.dev/@ngnjs/plugin'

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

### Require a Minimum NGN Version

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

### Require Another NGN Plugin

Plugins can require other plugins, creating a dependency chain. When a required plugin is missing, an error is thrown.

Only plugins that are registered with NGN can be recognized by other plugins. See the last line of the usage example to understand how a plugin can register itself with NGN.

Plugins can be "required" the same way a core NGN element is required:

```javascript
const NGN = new Reference('^2.0.0').requires('EventEmitter', 'MyPlugin')
```

If an application needs a specific version of a plugin, it can be required like this:

```javascript
const NGN = new Reference('^2.0.0').requires('EventEmitter', 'MyPlugin:>=1.0.0')
```

The code above indicates a `MyPlugin` plugin greater than or equal to semantic version `1.0.0` must be present.

**Plugins may or may not be versioned.** This is a choice for plugin authors, but it is a recommended practice. The plugin system looks for a `version` attribute or method on each plugin to determine which version is registered. Here's an example of how a version can be specified on a custom plugin:

```javascript
import Reference from 'https://cdn.skypack.dev/@ngnjs/plugin'

// Create a reference to NGN
const NGN = new Reference()

export default class MyPlugin extends NGN.EventEmitter {
  constructor () {
    super(...arguments)

    console.log('Hello')
  }

  static get version () {
    return '1.0.1'
  }

  // Alternative option
  // static version () {
  //   return '1.0.1'
  // }
}

NGN.MyPlugin = MyPlugin // Optional
```

The code above uses a static attribute (or method) to identify the version number. When using classes or class-like structures, it is important to use the `static` keyword. This allows the attribute/method to be accessed before the class is instantiated/invoked.

### Use a Specific NGN Version

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
import NGN from 'https://cdn.skypack.dev/@ngnjs/ngn'
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
