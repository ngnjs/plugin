import Semver from './semver.js'

const ID = Symbol.for('NGN')

const priv = (value, writable = false) => {
  return {
    enumerable: false,
    configurable: false,
    writable,
    value
  }
}

export { Semver }
export const moduleVersion = '<#REPLACE_VERSION#>'

export default class Reference {
  constructor (version = null) {
    Object.defineProperties(this, {
      instance: priv(reference => {
        if (globalThis[reference]) {
          reference = globalThis[reference]

          if (reference instanceof Map && reference.has('INSTANCE')) {
            return reference.get('INSTANCE')
          }
        }

        return null
      }),
      base: priv({}, true),
      ref: priv(null, true),
      proxy: priv(null, true)
    })

    this.use(version)

    const me = this
    this.proxy = new Proxy(this.base, {
      get (target, property) {
        if (target[property] !== undefined) {
          return target[property]
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

        return true
      }

      // ownKeys () {
      //   return Reflect.ownKeys(me.base)
      // }
    })

    Object.freeze(this.proxy)

    return this.proxy
  }

  get availableVersions () {
    let options = globalThis[ID] || []

    if (options.length === 0) {
      options = Object.getOwnPropertySymbols(globalThis).filter(s => globalThis[s] instanceof Map && globalThis[s].has('REFERENCE_ID') && globalThis[s].get('REFERENCE_ID') === s)
    }

    return options.sort((a, b) => Semver.gte(globalThis[a].get('VERSION'), globalThis[b].get('VERSION')) ? -1 : 1)
  }

  export (name) {
    const plugins = globalThis[this.ref].get('plugins') || new Map()
    const elements = new Set(Array.from(arguments).slice(1))

    if (elements.size === 0) {
      throw new Error('Missing arguments. Nothing was specified to export.')
    }

    plugins.set(name, Array.from(elements))

    globalThis[this.ref].set('PLUGINS', plugins)
  }

  // Use a specific version of NGN
  use (version = null) {
    let options = this.availableVersions

    if (version) {
      version = Semver.select(version, ...options.map(id => globalThis[id].get('VERSION')))
      options = options.filter(id => globalThis[id] instanceof Map && version === globalThis[id].get('VERSION'))
    }

    if (options.length === 0) {
      return null
    }

    this.ref = options.shift()
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
    if (arguments.length > 0) {
      if (this.base === null) {
        throw new Error('NGN is required.')
      }

      const missing = new Set()
      for (const el of arguments) {
        if (el.indexOf(':') > 0 || !this.exist(el)) {
          const match = /(?<feature>[^:\n]+):?(?<version>\d+\.\d+\.\d+([-+].+)?)?/i.exec(el)
          if (match) {
            const { feature, version } = match.groups

            if (!this.base.plugins[feature]) {
              missing.add(feature)
            } else {
              try {
                const pv = typeof this.base.plugins[feature].version === 'function' ? typeof this.base.plugins[feature].version() : typeof this.base.plugins[feature].version
                const v = Semver.select(version, pv)

                if (v !== pv) {
                  missing.add(feature + '@' + version)
                }
              } catch (e) {
                missing.add(feature + '@' + version)
              }
            }
          }
        }
      }

      if (missing.size > 0) {
        const msg = `The following NGN elements are required but not present in the environment: ${Array.from(missing).join(', ')}. Make sure these have been imported.`
        throw new Error(msg)
      }
    }

    return this.proxy
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
      let Element = component.split('.').reduceRight((acc, el) => {
        if (acc[el] === undefined) {
          acc = acc[el]
          return acc
        }

        return acc[el]
      }, this.base)

      if (Element === undefined) {
        Element = globalThis[component]

        if (Element === undefined) {
          return false
        }

        // If the element is undefined in NGN and is not a NGN custom exception, then it is not available.
        if (typeof Element === 'function') {
          try {
            const e = new Element()
            if (!(e instanceof Error)) {
              return false
            }
          } catch (e) {
            return false
          }
        }
      }
    }

    return true
  }
}
