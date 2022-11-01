// https://stackoverflow.com/questions/5914020/javascript-date-to-string
export function padStr(i) {
  return (i < 10) ? "0" + i : "" + i;
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


// TODO: Use this inside views too instead of linkTo ???
export function localeHref(href, currentUrl=null) {

  if (!currentUrl) {currentUrl = window.location.href}
  let path = getPathFromUrl(href);
  let locale = getUrlParams(currentUrl).locale
  let params = locale ? {locale} : {}
  params = {...params, ...getUrlParams(href)}
  let url = path
  if (params && Object.keys(params).length >= 1) {
    url += '?' + new URLSearchParams(params).toString()
  }
  return url
}

// Get the time of now. Format looks like: 2022-09-20T17:48:11.522Z
// The format is comptatible with Ruby on Rails.
// FIXME: This is not tested, I am not sure this is compatible...
export function now() {
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

/**
 * list: The list of items
 * attr: The name of an object property or a function to get a value
 * Does this sort in ascending or descending order?
 */
export function sortBy(list, attr) {
  const getVal = (el) => {
    return (typeof attr === 'function') ? attr(el) : el[attr]
  }
  return list.sort((a,b) => {
    if (getVal(a) == null) {
      return getVal(b) == null ? 0 : -1
    } else if (getVal(b) == null) {
      return 1
    } else if (typeof getVal(a) === 'string') {
      return getVal(a).localeCompare(getVal(b))
    } else {
      return getVal(a) - getVal(b)
    }
  })
}
export function sortByDate(list, attr) {
  return sortBy(list, (e => new Date(e[attr])))
}

export function removeDuplicateIds(records) {
  return [...new Map(records.map((r) => [r.id, r])).values()];
}

export function ensureIsArray(obj) {
  if (!obj) {return []}
  return Array.isArray(obj) ? obj : [obj]
}

export function stringToPrimitive(str) {
  let i = parseInt(str)
  if (i.toString() == str) {return i}
  let f = parseFloat(str)
  if (f.toString() == str) {return f}
  return str
}

export function getPathFromUrl(url) {
  if (!url) {return ''}
  return url.split(/[?#]/, 1)[0];
}

export function queryToParams(query) {
  let q = query[0] === "?" ? query.substr(1) : query
  var r = {};
  for (let pair of new URLSearchParams(q).entries()) {
    r[pair[0]] = stringToPrimitive(pair[1])
  }
  return r
}

export function getUrlParams(url=null) {
  // FIXME: Use window.location.search instead of window.location.href...
  if (!url) {url = window.location.href}
  let s = url.split('?', 2)
  if (s.length < 2) {return []}
  return queryToParams(s[1])
}

const utils = {padStr, now, sortBy, removeDuplicateIds, ensureIsArray, getUrlParams};
export default utils;
//module.exports = utils;
