function coloredResult(result) {
  return result ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m'
}

export function fail(msg) {
  console.log('\x1b[31mFAILED\x1b[0m', msg);
}

export function pass(msg) {
  console.log('\x1b[32mPASSED\x1b[0m', msg);
}

export function header(msg) {
  console.log('\x1b[0;94m%s\x1b[0m', msg);
}

export function assertEquals(expected, actual) {
  console.log(coloredResult(expected === actual), 'Expected:', expected, 'Input:', actual)
}

export function assert(cond, msg) {
  console.log(coloredResult(cond), msg)
}

export function assertThrowsException(msg, func) {
  try {
    func()
    fail(msg)
  } catch (e) {pass(msg)}
}

export function assertStartsWith(expected, actual) {
  console.log(coloredResult(actual.startsWith(expected)), 'Expected starts with:', expected, 'Input:', actual)
}
