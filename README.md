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
