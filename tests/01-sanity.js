import test from 'tappedout'
import ngn from 'ngn'
import Reference from '/app/.dist/ngn-plugin/index.js'

test('Sanity', t => {
  if (!ngn) {
    t.bail('Sanity check requires the presence of NGN.')
  }

  t.ok(typeof Reference === 'function', 'Reference class exists.')
  t.ok(typeof (new Reference()) === 'object', 'Reference avialable as an object.')
  // t.ok((new Reference()) instanceof Reference, 'Reference recognized as an instance of the plugin.')
  
  const NGN = new Reference()
  t.ok(typeof NGN.requires === 'function', 'Recognize the requires function')
  t.ok(typeof NGN.exist === 'function', 'Recognize the exist function')
  t.ok(typeof NGN.use === 'function', 'Recognize the use function')
  t.ok(typeof NGN.min === 'function', 'Recognize the min function')

  t.end()
})

test('Basic Usage', t => {
  const NGN = new Reference()

  t.ok(NGN.EventEmitter === ngn.EventEmitter, 'A reference to NGN elements is available.')

  let count = 0
  let ee
  t.doesNotThrow(() => {
    class TestEmitter extends NGN.EventEmitter {
      constructor() {
        super()
        count++
      }
    }

    ee = new TestEmitter()
  }, 'Extend a referenced class.')

  t.ok(typeof ee.emit === 'function', 'Inherited method from referenced library.')

  t.end()
})

test('Requiring Components', t => {
  const NGN = new Reference()

  t.doesNotThrow(() => {
    NGN.requires('EventEmitter')
  }, 'Does not throw an error when the required component is available.')

  t.throws(() => {
    NGN.requires('DoesNotExist')
  }, 'Throws an error when the required component is not available.')

  t.end()
})

test('Minimum Versions', t => {
  const NGN = new Reference()

  t.doesNotThrow(() => {
    NGN.min(NGN.version)
  }, 'Does not throw an error when the minimum required version is available.')

  t.throws(() => {
    NGN.min('1000.0.0')
  }, 'Throws an error when the minimum required version is not available.')

  t.end()
})
