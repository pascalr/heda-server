export function isTrue(val) {
  return val && val != 'false'
}

export function changeUrl(pathname, params) {
  let url = (!params || Object.keys(params).length == 0) ? pathname : pathname+'?'+new URLSearchParams(params).toString()
  window.history.pushState(params, '', url)

  // I don't think there is or at least I wasn't able to find an event for pushState, so I created one.
  const historyChanged = new CustomEvent("history-changed", {
    detail: {pathname, params},
    bubbles: false,
    cancelable: false,
    composed: false,
  });

  window.dispatchEvent(historyChanged)
}

export function bindSetter(obj, setter) {
  const updateObj = (val) => {
    val.update = obj.update
    setter(val)
  }
  if (obj) {
    obj.update = updateObj
  }
}

export function omit(obj, property) {
  let o = {...obj}
  delete o[property]
  return o
}

export function capitalize(str) {
  return str?.replace(/^\w/, c => c.toUpperCase())
}

export function join(str1, str2) {
  if (str1 && str2) {return `${str1} ${str2}`}
  if (str1 && !str2) {return str1}
  if (str2 && !str1) {return str2}
  return ''
}

export function preloadImage(url) {
  var img = new Image();
  img.src = url;
}
  
export function prettyNumber(nb) {
  //return Math.round(nb*100)/100
  return Number.parseFloat(Number.parseFloat(nb).toPrecision(3));
}

export function colorToHexString(color) {
  return '#' + Number(color).toString(16)
}

export function hexStringToColor(hex) {
  return parseInt(hex.slice(1), 16)
}

export function addExtensionToPath(ext, path) {
  if (path == null) {return null}
  ext = ext[0] == "." ? ext : "."+ext
  let i = path.indexOf('?')
  if (i == -1) {
    return path + ext
  } else {
    return path.substr(0, i)+ext+'?'+path.substr(i+1)
  }
}

// Unfortunately, FormData only handles strings.
// FormData sends null as "null", but we want ""
// FormData sends true as "true", but we want "1"
// FormData sends false as "false", but we want "0"
function convertFormDataValue(val) {
  if (val === null || val === "null") {return ''}
  if (val === false || val === "false") {return '0'}
  if (val === true || val === "true") {return '1'}
  return val
}

/**
 * Parameters
 * url
 * contentType: default is "application/json"
 * type: "GET", "PATCH" or "POST"
 * data: the data to send either as an object or a FormData
 * sucess: success callback function
 * error: error callback function
**/
export function ajax(params) {

  if (!params.url) {throw "ajax missing params url"}

  let headers = {}

  let _csrf = null
  if (params.type !== 'GET') {
    let _csrfContainer = document.querySelector('[name="csrf-token"]')
    if (!_csrfContainer) {console.log("Can't modify state missing csrf token.")}
    _csrf = _csrfContainer.content
  }

  let url = params.url
  let body = null
  if (params.type == "GET") {
    //if (params.data) {throw "Error ajax GET request cannnot have data, use query params instead."}
    if (params.data) {
      url += '?' + new URLSearchParams(params.data).toString()
    }
  } else if (params.data instanceof FormData) {

    body = new FormData()
    for (let [k, v] of params.data) {
      let v1 = convertFormDataValue(v)
      body.append(k, convertFormDataValue(v))
    }
    body.append('_csrf', _csrf)

  } else {
    body = {...params.data}
    body._csrf = _csrf
    body = JSON.stringify(body),

    headers = {'Content-Type': 'application/json'}
  }
  
  const handleResponse = (ok, data) => {
    if (ok) {
      if (params.success) { params.success(data) }
    } else {
      if (params.error) { params.error(data) }
    }
  }
  
  console.log('fetch '+url, params)

  fetch(url, {
    method: params.type,
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body, headers
  }).then(response => {
    response.text().then((text) => {
      try {
        handleResponse(response.ok, JSON.parse(text))
      } catch(err) {
        handleResponse(response.ok, text)
      }
    })
  })
}

// https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
export function normalizeSearchText(text) {
  if (text == null) {return null}
  if (text == '') {return ''}
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export function toBoolean(a) {
  return String(a).toLowerCase() == "true"
}

const Utils = {}
Utils.addExtensionToPath = addExtensionToPath
Utils.colorToHexString = colorToHexString
Utils.hexStringToColor = hexStringToColor
Utils.normalizeSearchText = normalizeSearchText
Utils.toBoolean = toBoolean
Utils.ajax = ajax
export { Utils }
