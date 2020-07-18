const ID = Symbol.for('NGN')

const priv = (value, writable = false) => {
  return {
    enumerable: false,
    configurable: false,
    writable,
    value
  }
}

// Thanks to https://github.com/sindresorhus/semver-regex/blob/master/index.js
const SEMVER = /(\d)\.(\d)\.(\d)(.*)?/i

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
      base: priv(this.use(version), true),
      ref: priv(null, true)
    })

    return new Proxy(this, {
      get (target, property) {
        if (this.base[property] !== undefined) {
          return this.base[property]
        }

        if (this.ref) {
          const plugins = globalThis[this.ref].get('PLUGINS') || new Map()
          if (plugins.has(property)) {
            return plugins.get(property)
          }
        }

        return target[property]
      },

      set (target, property, value) {
        if (this.ref === null) {
          throw new Error('Cannot find NGN.')
        }

        const plugins = globalThis[this.ref].get('plugins') || new Map()

        plugins.set(property, value)
        globalThis[this.ref].set('PLUGINS', plugins)
      }
    })
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

    return this.instance(this.ref)
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
      throw new Error(`The follow NGN element are required but not present in the environment: ${Array.from(arguments).join(', ')}. Make sure these have been imported.`)
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
        return false
      }
    }

    return true
  }

  min (version) {
    if (!version) {
      return
    }

    if (!this.base) {
      throw new Error('NGN is not available or was not imported.')
    }

    const required = SEMVER.exec(version)
    if (!required) {
      throw new Error(`"${version}" is not a valid semantic version (invalid format)`)
    }

    const ngn = SEMVER.exec(this.base.version)

    if (required[0] < ngn[0]) { return }
    if (required[1] < ngn[1]) { return }
    if (required[2] <= ngn[2]) { return }

    throw new Error(`NGN v${version} is required. An older version was found (v${this.base.version}). Please update.`)
  }
}
