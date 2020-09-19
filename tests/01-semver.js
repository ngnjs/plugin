import test from 'tappedout'
import { Semver as sv } from '@ngnjs/plugin'

const a = '2.0.0-alpha.3'
const b = '2.0.0-alpha.5'

test('Semver Checks', t => {
  t.expect(true, sv.eq(a, a), 'equal')
  t.expect(true, sv.lt(a, b), 'less than')
  t.expect(true, sv.gt(b, a), 'greater than')
  t.expect(true, sv.lte(a, b), 'less than or equal to (unequal)')
  t.expect(true, sv.gte(b, a), 'greater than or equal to (unequal)')
  t.expect(true, sv.lte(a, a), 'less than or equal to (equal)')
  t.expect(true, sv.gte(a, a), 'greater than or equal to (equal)')
  t.expect(b, sv.select('^2.0.0-alpha', b, a), 'Select latest version of the same minor version.')
  t.end()
})