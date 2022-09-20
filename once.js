var t = new Date()
console.log('t', t)
console.log('Date.now', Date.now())

// https://stackoverflow.com/questions/5914020/javascript-date-to-string
function padStr(i) {
  return (i < 10) ? "0" + i : "" + i;
}

// Get the time of now. Format looks like: 2022-09-20T17:48:11.522Z
// The format is comptatible with Ruby on Rails.
// FIXME: This is not tested, I am not sure this is compatible...
function nowStr() {
  let now = new Date();
  let s = padStr(now.getFullYear()) + '-' +
          padStr(1 + now.getMonth()) + '-' +
          padStr(now.getDate()) + ' ' +
          padStr(now.getHours()) + ':' +
          padStr(now.getMinutes()) + ':' +
          padStr(now.getSeconds()) + '.' +
          now.getMilliseconds() + '000';
  return s
}

console.log('test', nowStr())

var x = 10
var y = 10
