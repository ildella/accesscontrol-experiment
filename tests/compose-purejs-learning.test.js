const composePure = (...funcs) =>
  initialArg => funcs.reduce((acc, func) => func(acc), initialArg)
const composePureRight = (...funcs) =>
  initialArg => funcs.reduceRight((acc, func) => func(acc), initialArg)

test('compose functions', () => {
  const multiplyBy2 = arg => arg * 2

  const sum3 = arg => arg + 3
  const expression = composePure(multiplyBy2, sum3)
  const reverse = composePureRight(multiplyBy2, sum3)

  expect(expression(2)).toEqual(7) // 2 * 2 + 3 = 7
  expect(reverse(2)).toEqual(10) // 2 + 3 * 2 = 10
})

const {composeAsync} = require('../src/promise-composition')

const p1 = async (param = 0) => 1 + param
const p2 = async (param = 0) => 2 + param
const e1 = async (param = 0) => { throw new Error('e1') }
const e2 = (param, cb) => cb('e2')

test('compose promise - success', async () => {
  expect(await p1()).toBe(1)
  expect(await p2()).toBe(2)
  const transformData = composeAsync(p1, p2)
  const result = transformData(1)
  expect(await result).toBe(4)
})

test('compose promise - error should block execution', async () => {
  const transformData = composeAsync(e1, p1, p2)
  const result = transformData(1)
  await expect(result).rejects.toThrow('e1')
})

const f1 = jest.fn().mockImplementation(async (param = 0) => 1 + param)
const f2 = jest.fn().mockImplementation(async (param = 0) => 2 + param)
const ef1 = jest.fn().mockImplementation(async () => {throw new Error('ef1')})

test('compose promise - chain stops if one fails', async () => {
  expect.assertions(4)
  const transformData = composeAsync(f1, ef1, f2)
  const result = transformData(1)
  await expect(result).rejects.toThrow('ef1')
  expect(ef1).toHaveBeenCalled()
  expect(f1).toHaveBeenCalled()
  expect(f2).not.toHaveBeenCalled()
})

test('compose promise - works', async () => {
  const transformData = composeAsync(f1, f2)
  const result = await transformData(1)
  expect(result).toBe(4)
})

test('compose functions - does fail', async () => {
  const transformData = composePure(f1, f2)
  const result = await transformData(1)
  expect(result).not.toBe(4)
})
