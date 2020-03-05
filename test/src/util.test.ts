import { expect } from 'chai'
import { flatten } from '../../src/util'

function addFlattenTest(str: string): void {
  const arr = str.split('/').map(item => item.split(''))
  const expected = str.replace(/\//g, '').split('')
  it(`flatten: ${JSON.stringify(arr)} => ${JSON.stringify(expected)}`, function() {
    const flat = flatten(arr)
    expect(flat).to.be.an('array')
    expect(flat).to.have.ordered.members(expected)
  })
}

describe('Flatten', function() {
  const tests = ['a', 'a/bc', 'ab/cd/ef', 'ab//c/d/e']

  // eslint-disable-next-line mocha/no-setup-in-describe
  tests.forEach(addFlattenTest)
})
