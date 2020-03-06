const compose = (...funcs) =>
  initialArg => funcs.reduce((acc, func) => func(acc), initialArg)
const composeRight = (...funcs) =>
  initialArg => funcs.reduceRight((acc, func) => func(acc), initialArg)

module.exports = {
  compose,
  composeRight,
}
