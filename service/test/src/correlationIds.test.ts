import { expect } from 'chai'
import CorrelationIds, { caseSplit } from '~/instrumentation/correlationIds'

type Test = {
  input: string
  output: string[]
}
function entry(input: string, ...output: string[]): Test {
  return {
    input,
    output,
  }
}
const tests: Test[] = [
  entry(''),
  entry('a', 'a'),
  entry('A', 'A'),
  entry('aA', 'a', 'A'),
  entry('aAa', 'a', 'Aa'),
  entry('aAA', 'a', 'A', 'A'),
  entry('aAAA', 'a', 'A', 'A', 'A'),
  entry('54A', '54', 'A'),
  entry('id', 'id'),
  entry('hipHopSuperStop', 'hip', 'Hop', 'Super', 'Stop'),
  entry('HipHop', 'Hip', 'Hop'),
]

describe('correlationIds (utils)', function () {
  for (const t of tests) {
    it(`parse ${t.input} => ${t.output}`, function () {
      const res = caseSplit(t.input)
      expect(res).to.be.an('array').that.eqls(t.output)
    })
  }
})

describe('corrlelationIds (methods)', function () {
  const input = {
    trace: 'abc',
    hipHop: 'xyz',
    JimmyJam: 'xtc',
  }

  it('convert ids (normal)', function () {
    const ids = new CorrelationIds()
    ids.put(input)
    const output = ids.get()
    expect(output).to.eql({
      trace: 'abc',
      hipHop: 'xyz',
      jimmyJam: 'xtc',
    })
  })

  it('convert ids (headers)', function () {
    const ids = new CorrelationIds()
    ids.put(input)
    const output = ids.getHeaders()
    expect(output).to.eql({
      'nod15c-cid-trace': 'abc',
      'nod15c-cid-hip-hop': 'xyz',
      'nod15c-cid-jimmy-jam': 'xtc',
    })
  })

  it('convert ids (logs)', function () {
    const ids = new CorrelationIds()
    ids.put(input)
    const output = ids.getLogs()
    expect(output).to.eql({
      cidTrace: 'abc',
      cidHipHop: 'xyz',
      cidJimmyJam: 'xtc',
    })
  })
})
