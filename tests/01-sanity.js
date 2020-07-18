import test from 'tappedout'
import Reference from '/app/.dist/ngn-plugin/index.js'

test('Sanity', t => {
  t.ok(typeof Reference === 'function', 'The reference class exists.')
  t.ok(typeof new Reference() === 'object', 'The reference is avialable as an object.')
  t.ok(new Reference() instanceof Reference, 'The reference is recognized as an instance of the plugin reference.')
  t.end()
})
