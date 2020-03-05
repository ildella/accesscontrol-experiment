const composePure = (...funcs) =>
  initialArg => funcs.reduce((acc, func) => func(acc), initialArg)
const composePureRight = (...funcs) =>
  initialArg => funcs.reduceRight((acc, func) => func(acc), initialArg)

test('functions', () => {
  const log = arg => {
    console.log(arg)
    return arg
  }

  // const addSomething = key => arg => {
  //   sessionStorage.setItem(key, JSON.stringify(arg))
  //   return arg
  // }

  const getPerson = id => id === 'homer'
    ? {firstName: 'Homer', surname: 'Simpson'}
    : {}

  const getPersonWithSideEffects = composePure(
    log,
    log,
    getPerson,
    log,
    // store('person'),
  )

  const person = getPersonWithSideEffects('homer')
  expect(person).toEqual({'firstName': 'Homer', 'surname': 'Simpson'})
})

const applyAsync = (acc,val) => acc.then(val)
const composeAsync = (...funcs) => x => funcs.reduce(applyAsync, Promise.resolve(x))

test('compose promise', async () => {
  const p1 = async (param = 0) => (1 + param)
  const p2 = async (param = 0) => (2 + param)
  expect(await p1()).toBe(1)
  expect(await p2()).toBe(2)
  const transformData = composeAsync(p1, p2)
  const result = await transformData(0)
  expect(result).toBe(3)
})
