// https://stackoverflow.com/questions/5914020/javascript-date-to-string
function padStr(i) {
  return (i < 10) ? "0" + i : "" + i;
}

// Get the time of now. Format looks like: 2022-09-20T17:48:11.522Z
// The format is comptatible with Ruby on Rails.
// FIXME: This is not tested, I am not sure this is compatible...
function now() {
  let n = new Date();
  let s = padStr(n.getFullYear()) + '-' +
          padStr(1 + n.getMonth()) + '-' +
          padStr(n.getDate()) + ' ' +
          padStr(n.getHours()) + ':' +
          padStr(n.getMinutes()) + ':' +
          padStr(n.getSeconds()) + '.' +
          n.getMilliseconds() + '000';
  return s
}

function sortBy(list, attr) {
  return list.sort((a,b) => {
    if (typeof a[attr] === 'string') {
      return a[attr].localeCompare(b[attr])
    } else {
      return a[attr] - b[attr]
    }
  })
}

function removeDuplicateIds(records) {
  return [...new Map(records.map((r) => [r.id, r])).values()];
}

function ensureIsArray(obj) {
  return Array.isArray(obj) ? obj : [obj]
}

const utils = {padStr, now, sortBy, removeDuplicateIds, ensureIsArray};
export default utils;
//module.exports = utils;
