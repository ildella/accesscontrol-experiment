const composePure = (...funcs) =>
  initialArg => funcs.reduce((acc, func) => func(acc), initialArg)
const composePureRight = (...funcs) =>
  initialArg => funcs.reduceRight((acc, func) => func(acc), initialArg)

test('functions', () => {
  const multiplyBy2 = arg => arg * 2

  const sum3 = arg => arg + 3
  const expression = composePure(multiplyBy2, sum3)
  const reverse = composePureRight(multiplyBy2, sum3)

  expect(expression(2)).toEqual(7) // 2 * 2 + 3 = 7
  expect(reverse(2)).toEqual(10) // 2 + 3 * 2 = 10
})

const applyAsync = (acc,val) => acc.then(val)
const composeAsync = (...funcs) => x => funcs.reduce(applyAsync, Promise.resolve(x))

test('compose promise', async () => {
  const p1 = async (param = 0) => 1 + param
  const p2 = async (param = 0) => 2 + param
  expect(await p1()).toBe(1)
  expect(await p2()).toBe(2)
  const transformData = composeAsync(p1, p2)
  const result = await transformData(0)
  expect(result).toBe(3)
})
