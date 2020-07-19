const ID = Symbol.for('NGN')

const priv = (value, writable = false) => {
  return {
    enumerable: false,
    configurable: false,
    writable,
    value
  }
}

const SEMVER = /(\d+)\.(\d+)\.(\d+)(.*)?/i

export default class Reference {
  constructor (version = null) {
    Object.defineProperties(this, {
      instance: priv(reference => {
        if (!globalThis[reference]) {
          return null
        }

        reference = globalThis[reference]

        if (!(reference instanceof Map) || !reference.has('INSTANCE')) {
          return null
        }

        return reference.get('INSTANCE')
      }),
      base: priv(null, true),
      ref: priv(null, true),
      proxy: priv(null, true)
    })

    this.use(version)

    const me = this
    this.proxy = new Proxy(this.base, {
      get (target, property) {
        if (me.base[property] !== undefined) {
          return me.base[property]
        }

        if (me.ref) {
          const plugins = globalThis[me.ref].get('PLUGINS') || new Map()
          if (plugins.has(property)) {
            return plugins.get(property)
          }
        }

        return me[property]
      },

      set (target, property, value) {
        if (me.ref === null) {
          throw new Error('Cannot find NGN.')
        }

        const plugins = globalThis[me.ref].get('plugins') || new Map()

        plugins.set(property, value)
        globalThis[me.ref].set('PLUGINS', plugins)
      },

      ownKeys () {
        return Reflect.ownKeys(me.base)
      }
    })

    Object.freeze(this.proxy)

    return this.proxy
  }

  // Use a specific version of NGN
  use (version = null) {
    let options = globalThis[ID] || []

    if (options.length === 0) {
      options = Object.getOwnPropertySymbols(globalThis).filter(s => globalThis[s] instanceof Map && globalThis[s].has('REFERENCE_ID') && globalThis[s].get('REFERENCE_ID') === s)

      if (options.length === 0) {
        return null
      }
    }

    if (options.length > 1 && version) {
      options = options.filter(id => {
        if (globalThis[id]) {
          if (globalThis[id] instanceof Map) {
            return version === globalThis[id].get('VERSION')
          }
        }

        return false
      })

      if (options.length === 0) {
        return null
      }
    }

    this.ref = options.pop()
    this.base = this.instance(this.ref)

    return this.proxy
  }

  /**
   * Throws an error if the specified elements
   * are not available in the NGN environment.
   *
   * For example, if the plugin requires the
   * NGN EventEmitter and Middleware, the plugin
   * can check for their existance and throw an
   * error if they are not available.
   *
   * ```javascript
   * const NGN = new Reference()
   * NGN.requires('EventEmitter', 'Middleware')
   * ```
   * @param {string[]} elements
   * A comma-separated list of required elements.
   */
  requires () {
    if (arguments.length === 0) {
      return
    }

    if (this.base === null) {
      throw new Error('NGN is required.')
    }

    if (!this.exist(...arguments)) {
      throw new Error(`The following NGN elements are required but not present in the environment: ${Array.from(arguments).join(', ')}. Make sure these have been imported.`)
    }
  }

  /**
   * Determines if the specified element(s)
   * are available in the NGN environment.
   *
   * For example, if the plugin requires the
   * NGN EventEmitter and Middleware, the plugin
   * can check for their existance and throw an
   * error if they are not available.
   *
   * ```javascript
   * const NGN = new Reference()
   * NGN.exist('EventEmitter', 'Middleware')
   * ```
   * @param {string[]} elements
   * A comma-separated list of required elements.
   * @returns {boolean}
   */
  exist () {
    for (const component of arguments) {
      if (typeof component !== 'string') {
        throw new Error('The plugin/reference require() method only accepts string values.')
      }

      const element = component.split('.').reduceRight((acc, el) => {
        if (acc[el] !== undefined) {
          acc = acc[el]
          return acc
        }
      }, this.base)

      if (element !== undefined) {
        return true
      }
    }

    return false
  }

  min (version) {
    if (version) {
      if (!this.base) {
        throw new Error('NGN is not available or was not imported.')
      }

      const required = SEMVER.exec(version)
      if (!required) {
        throw new Error(`"${version}" is not a valid semantic version (invalid format)`)
      }

      const ngn = SEMVER.exec(this.base.version)

      // Do not combine these into a single line.
      // The multiline format respects semver cascading.
      if (parseInt(required[0], 10) <= parseInt(ngn[0], 10)) { return } //eslint-disable-line
      else if (parseInt(required[0], 10) <= parseInt(ngn[0], 10)) { return } //eslint-disable-line
      else if (parseInt(required[1], 10) <= parseInt(ngn[1], 10)) { return }

      throw new Error(`NGN v${version} is required. Found (v${this.base.version}). Please update.`)
    }
  }
}
