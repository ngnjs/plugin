const PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

class Version {
  constructor (version) {
    const parts = PATTERN.exec(version)

    if (!parts) {
      throw new Error('Invalid semantic version.')
    }

    this.major = parseInt(parts[1], 10)
    this.minor = parseInt(parts[2], 10)
    this.patch = parseInt(parts[3], 10)
    this.prerelease = parts[4]
    this.build = parts[5]
  }

  toString () {
    return `${this.major}.${this.minor}.${this.patch}${this.prerelease ? '-' + this.prerelease : ''}`
  }

  get name () {
    const match = /^(a-zA-Z0-9-_)[\.|\+]?/i.exec(this.prerelease) // eslint-disable-line
    return match ? match[1].trim() : null
  }

  get subversion () {
    return this.name === null ? 0 : this.prerelease.replace(this.name, '').trim()
  }

  // Incermenting/decrementing is not currently necessary in NGN
  // It may be applicable in the future, or for a dedicated SV library.
  // inc (type = null, value = 1) {
  //   type = type !== null ? type : (this.prerelease ? 'prerelease' : 'minor')

  //   switch (type.toLowerCase()) {
  //     case 'build':
  //       throw new Error('Builds cannot be incremented (they are a label).')

  //     case 'prerelease':
  //       if (this.prerelease.indexOf('.') < 0) {
  //         if (value < 0) {
  //           throw new Error('Cannot decrement a prerelease with no prior versions.')
  //         }

  //         this.prerelease = `${this.prerelease}.1`
  //       } else {
  //         const parts = this.prerelease.split('.')
  //         parts.shift()
  //         const last = parts[parts.length - 1]

  //         if (isNaN(last)) {
  //           throw new Error('Cannot increment prereleases ending in non-integer characters.')
  //         }

  //         parts[parts.length - 1] = (parseInt(last, 10) + value)
  //       }

  //       return this

  //     case 'patch':
  //       this.patch += value
  //       this.prerelease = ''
  //       this.build = ''
  //       return this

  //     case 'minor':
  //       this.minor += value
  //       this.patch = 0
  //       this.prerelease = ''
  //       this.build = ''
  //       return this

  //     case 'major':
  //       this.major += value
  //       this.minor = 0
  //       this.patch = 0
  //       this.prerelease = ''
  //       this.build = ''
  //       return this
  //   }
  // }

  // dec (type = null) {
  //   return this.inc(type, -1)
  // }
}

function normalize (a, b) {
  return {
    a: typeof a === 'string' ? new Version(a) : a,
    b: typeof b === 'string' ? new Version(b) : b
  }
}

export default class SV {
  static parse (version) {
    return new Version(version)
  }

  static gt () {
    const { a, b } = normalize(...arguments)
    if (a.major < b.major) { return false }
    if (a.minor < b.minor) { return false }
    if (a.patch < b.patch) { return false }
    if (a.name === null && b.name !== null) { return true }
    if (a.name !== null && b.name === null) { return false }
    if (a.name !== b.name && a.name !== null) { return a.name > b.name }
    if (!isNaN(a.subversion) && isNaN(b.subversion)) { return true }
    if (isNaN(a.subversion) && !isNaN(b.subversion)) { return false }
    if (typeof a.subversion === typeof b.subversion && typeof a.subversion === 'string') {
      return a.subversion.length > b.subversions.length
    }
    if (!a.prerelease && b.prerelease) { return true }
    if (a.prerelease && !b.prerelease) { return false }
    if (a.prerelease && b.prerelease) {
      try {
        const { aPrefix } = /^(<aPrefix>[^\d]+)/i.exec(a.prerelease).groups
        const { bPrefix } = /^(<bPrefix>[^\d]+)/i.exec(b.prerelease).groups
        if (aPrefix !== bPrefix) {
          return aPrefix > bPrefix
        }
        const { aNum } = /(<aNum>^\d+)/i.exec(a.prerelease).groups
        const { bNum } = /(<bNum>^\d+)/i.exec(b.prerelease).groups
        return aNum === undefined ? false : (bNum === undefined ? true : (aNum === bNum ? false : aNum > bNum))
      } catch (e) {
        return a.prerelease > b.prerelease
      }
    }

    return true
  }

  static gte () {
    return (SV.eq(...arguments) || SV.gt(...arguments))
  }

  static lt () {
    return !SV.gte(...arguments)
  }

  static lte () {
    return (SV.eq(...arguments) || SV.lt(...arguments))
  }

  static eq () {
    const { a, b } = normalize(...arguments)
    return a.toString() === b.toString()
  }

  // Only necessary when inc/dec are enabled.
  // static bump (version, type = null) {
  //   return (new Version(version)).inc(type).toString()
  // }

  static sort () {
    return Array.from(new Set(Array.from(arguments)
      .map(v => v instanceof Version ? v : new Version(v))
      .sort((a, b) => SV.gt(a, b) ? -1 : (SV.lt(a, b) ? 1 : 0))))
  }

  static select (pattern) {
    if (arguments.length < 2) {
      return null
    }

    const list = SV.sort(...Array.from(arguments).slice(1))
    const match = /^(\^|~|<=?|>=?)(.*)/i.exec(pattern || '')
    let version = match ? match[2] : pattern

    if (!match) {
      const i = list.map(i => i.toString()).indexOf(version)
      return i >= 0 ? list[i].toString() : null
    }

    version = new Version(version)

    return list.filter(i => {
      switch (match[1]) {
        case '>':
          return SV.gt(i, version)
        case '>=':
          return SV.gte(i, version)
        case '<':
          return SV.lt(i, version)
        case '<=':
          return SV.lte(i, version)
        case '^':
          return SV.gte(i, version) && i.major === version.major
        case '~':
          return SV.gte(i, version) && i.major === version.major && i.minor === version.minor
      }
    }).shift().toString()
  }
}
