/**
* Convert the integer given to a string at least two characters long.
* Source: https://stackoverflow.com/questions/5914020/javascript-date-to-string
*/
export function padStr(i) {
  return (i < 10) ? "0" + i : "" + i;
}

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
export function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Used for read only
 * 
 * let x = new ArrayCombination([[1,2], [3,4]])
 * console.log('1', x[0]) => 1
 * console.log('2', x[1]) => 2 
 * console.log('3', x[2]) => 3
 * console.log('4', x[3]) => 4
 */
export class ArrayCombination {
  constructor(arrays) {
    let n = 0
    for (let i = 0; i < arrays.length; i++) {
      let array = arrays[i]
      for (let j = 0; j < array.length; j++) {
        this[n] = array[j]
        n += 1
      }
    }
    this.length = n
  }
}

/**
* Take an array and return another array with the elements randomly redistributed.
* Source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
*/
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

/**
 * Adds the locale to the given url.
 * @param {String} href The url to add the locale to
 * @param {String} locale The locale
 * @return {String} The url with the locale added if possible
 */
export function urlWithLocale(href, locale) {

  let path = getPathFromUrl(href);
  let params = locale ? {locale} : {}
  params = {...params, ...getUrlParams(href)}
  let url = path
  if (params && Object.keys(params).length >= 1) {
    url += '?' + new URLSearchParams(params).toString()
  }
  return url
}

/**
 * Adds the locale to the given url by extracting from the current url if possible.
 * @param {String} href The url to add the locale to
 * @param {String} currentUrl The current url to extract the locale from
 * @return {String} The url with the locale added if possible
 */
// DEPRECATED: use urlWithLocale or use Link directrly instead
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

/**
 * Get the time of now. Format looks like: 2022-09-20T17:48:11.522Z
 * The format is in theory comptatible with Ruby on Rails.
 */
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
 * Sort the given list based on the given attribute.
 * FIXME: Does this sort in ascending or descending order?
 * FIXME: Does this add the null elements at the beginning or at the end?
 * FIXME: Add some tests
 * @param {Array} list The list of items to sort
 * @param {String or Function} attr A property of an object as a string or a function to get the attribute.
 * @return {String} The sorted list
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
/**
 * Converts the date string attribute to an integer than sorts by it.
 */
export function sortByDate(list, attr) {
  return sortBy(list, (e => new Date(e[attr])))
}

/**
 * Returns an empty array if the obj is null.
 * Returns the object if it already is an array.
 * Returns an array with a single element otherwise.
 */
export function ensureIsArray(obj) {
  if (obj === null) {return []}
  return Array.isArray(obj) ? obj : [obj]
}

/**
 * Convert a string to a number if possible.
 */
export function stringToPrimitive(str) {
  let i = parseInt(str)
  if (i.toString() == str) {return i}
  let f = parseFloat(str)
  if (f.toString() == str) {return f}
  return str
}

/**
 * Extract the pathname from the given url.
 * WARNING: Does not remove the hostname.
 */
export function getPathFromUrl(url) {
  if (!url) {return ''}
  return url.split(/[?#]/, 1)[0];
}

/**
 * Convert the query string to an object.
 */
export function queryToParams(query) {
  let q = query[0] === "?" ? query.substr(1) : query
  var r = {};
  for (let pair of new URLSearchParams(q).entries()) {
    r[pair[0]] = stringToPrimitive(pair[1])
  }
  return r
}

/**
 * Extract and convert the query string to an object.
 */
export function getUrlParams(raw=null) {
  // FIXME: Use window.location.search instead of window.location.href...
  if (!raw) {raw = window.location.href}
  let url = raw.split('#')[0]
  let s = url.split('?', 2)
  if (s.length < 2) {return []}
  return queryToParams(s[1])
}

/**
 * Whether the given variable is falsy (false, '', null, undefined) or is empty ([]).
 */
export function isBlank(array) {
  return !array || array.length == 0
}

/**
 * Extract the number part at the beginning of a string.
 * Number can be integer, float or faction. Ex: 2, 3.4 or 2 1/2
 */
export function extractNumberAtBeginning(str) {
  if (!str) {return str}
  //let fraction = /\d+\/\d+/g
  //let decimal = /\d+[,.]\d+/g
  //let whole = /\d+/g
  let number = /\d+([,.]\d+)?/g
  let fraction_number = /(\d+ )?(\d+\/\d+)/g
  return (str.match(fraction_number) || str.match(number) || [])[0]
}

//export function stringSnippet(str, maxLength=20) {
//  if (str == null || str == '') {return ''}
//  if (str.length <= maxLength) {return str}
//  return str.slice(0,17)+'...'
//}
//
//  stripHtml(html) {
//    let tmp = document.createElement("div");
//    tmp.innerHTML = html;
//    return tmp.textContent || tmp.innerText || "";
//  },
//
//  translated(str) {
//    return str
//  },
//
//  minBy(array, fn) { 
//    return Utils.extremumBy(array, fn, Math.min); 
//  },
//
//  maxBy(array, fn) { 
//    return Utils.extremumBy(array, fn, Math.max);
//  },
//
//  extremumBy(array, pluck, extremum) {
//    return array.reduce(function(best, next) {
//      var pair = [ pluck(next), next ];
//      if (!best) {
//         return pair;
//      } else if (extremum.apply(null, [ best[0], pair[0] ]) == best[0]) {
//         return best;
//      } else {
//         return pair;
//      }
//    },null)[1];
//  },

const utils = {padStr, now, sortBy, ensureIsArray, getUrlParams};
export default utils;
//module.exports = utils;
