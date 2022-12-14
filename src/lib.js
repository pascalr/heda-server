import { normalizeSearchText, isValidEmail } from "./utils.js"
import Quantity from './quantity.js'
import { translate } from './translate.js'
import { ensureIsArray } from './utils.js';

// gros oignon espagnol, finement coupé => gros oignon espagnol
export function extractFoodNameFromIngredient(label) {
  return label.split(',')[0]
}

/**
 * Get the recipeKind or the kind ancestor id.
 * Ex: Dessert / Pie / Apple pie => In: Apple pie; Out: Dessert.id
 */
export function kindAncestorId(kinds, k, isKind=false) {
  return k?.kind_id ? kindAncestorId(kinds, kinds.find(d => d.id == k.kind_id), true) : isKind ? k?.id : undefined
}

// Used for meta tag og:description
export function descriptionRecipeIngredients(recipe, locale) {
  if (!recipe.ingredients) {return ''}
  const ingredientsAndHeaders = recipeIngredientsAndHeaders(recipe)
  const ingredients = ingredientsAndHeaders.filter(e => e.label || e.qty)
  if (ingredients.length === 0) {return ''}
  return translate(locale)("Ingredients") + ": " + ingredients.map(ing => extractFoodNameFromIngredient(ing.label)).join(" · ")
}

export function localeAttr(attr, locale) {
  return attr+'_'+(locale||'en')
}

/**
 * Extract the locale from the meta tag. Ex:
 * <meta name="locale" content="fr" /> => "fr"
 * FIXME: Maybe extract from <html lang="fr"> instead...
 */
 export function getLocale(val) {
  return document.querySelector('[name="locale"]')?.content
}

/**
 * Extract the csrf from the meta tag. Ex:
 * <meta name="csrf-token" content="..." />
 */
export const getCsrf = () => {
  return document.querySelector('[name="csrf-token"]')?.content
}

/**
 * Modifies the array to replace the attr with the locale attr. ([name] => [name_fr])
 */
function replaceAttrWithLocale(attrs, attr, locale) {
  let i = attrs.indexOf(attr)
  if (i !== -1) {
    attrs.splice(i,1) // Remove attr
    attrs.push(localeAttr(attr, locale)) // Add locale attr
  }
  return i !== -1
}

export function fetchRecordLocaleAttrs(db, table, conditions, attributes, localeAttrs, locale, options) {

  localeAttrs = ensureIsArray(localeAttrs)
  let attrs = [...ensureIsArray(attributes)]
  localeAttrs.forEach(attr => {
    attrs.push(localeAttr(attr, locale))
  })
  let record = db.fetchRecord(table, conditions, attrs, options)
  localeAttrs.forEach(attr => {
    let localized = localeAttr(attr, locale)
    record[attr] = record[localized]
    delete record[localized]
  })
  return record
}

export function fetchTableLocaleAttrs(db, table, conditions, attributes, localeAttrs, locale, options) {

  localeAttrs = ensureIsArray(localeAttrs)
  let attrs = [...ensureIsArray(attributes)]
  localeAttrs.forEach(attr => {
    attrs.push(localeAttr(attr, locale))
  })
  let records = db.fetchTable(table, conditions, attrs, options)
  return records.map(record => {
    localeAttrs.forEach(attr => {
      let localized = localeAttr(attr, locale)
      record[attr] = record[localized]
      delete record[localized]
    })
    return record
  })
}

export function fetchWithAncestors(id, attr, fetch) {
  console.log('id', id)
  let record = fetch(id)
  if (!record) {return null}
  if (record[attr]) {
    if (record[attr] == id) {throw 'Infinite loop fetchWithAncestors'}
    return [...fetchWithAncestors(record[attr], attr, fetch), record]
  }
  return [record]
}

export function needsPreposition(qty) {
  let q = new Quantity({raw: qty})
  return !!q.label
}

export function quantityWithPreposition(qty, label, locale) {
  return qty + ' ' + prettyPreposition(qty, label, locale)
}

export function prettyTimeMinutesToWords(minutes, locale) {
  let t = translate(locale)
  if (minutes === 0) {return '0 ' + t("minute")}
  let hours = Math.floor(minutes / 60)
  let mins = minutes % 60
  let s = hours > 0 ? hours + ' ' + (hours === 1 ? t("hour") : t("hours")) + ' ' : ''
  return (mins === 0) ? s : s + mins + ' ' + (mins === 1 ? t("minute") : t("minutes"))
}

/**
 * If the locale is french, add a preposition if required.
 * TODO: Handle d', I don't know if it's working right now with contractionList???
 * Ugly way to do it anyway using gon. Store the exceptions in a json file somewhere?
 */
export function prettyPreposition(qty, label, locale) {
  if (!locale || locale.toLowerCase() != 'fr') {return ''}
  if (!needsPreposition(qty)) {return ''}
  if (!label) {return ''}
  if (label[0] == 'h' || label[0] == 'H') {
    return gon.contractionList ? (gon.contractionList.includes(label) ? "d'" : "de ") : "de "
  } else {
    return ['a','e','i','o','u','y','é'].includes(label[0]) ? "d'" : "de "// if exp.contract_preposition.nil?
  }
}

export function findRecipeKindForRecipeName(recipeName, recipeKinds) {
  let name = normalizeSearchText(recipeName)
  if (!name) {return null}
  return recipeKinds.find(k => name.includes(normalizeSearchText(k.name_fr)) || name.includes(normalizeSearchText(k.name_en)))
}

export function serializeIngredientsAndHeaders(ingredients) {
  return ingredients.map(ing => {
    if (ing.header != null) {return '#'+ing.header}
    return ing.qty + '; ' + ing.label
  }).join("\n")
}

// It's better to use recipeIngredientsAndHeaders, use this only when necessary
export function parseIngredientsAndHeaders(text) {
  if (!text) {return []}
  let itemNb = 0
  return text.split("\n").map((line,i) => {
    if (line.length <= 0) {return null;}
    const key = `${i}-${line}`
    // An ingredient section
    if (line[0] == '#') {
      return {key, header: line.substr(1).trim()}
    }
    let args = line.split(";")
    itemNb += 1
    return {key, qty: args[0].trim(), label: args[1].trim(), item_nb: itemNb}
  }).filter(e => e)
}
function parseHedaInstructionsIngredients(raw) {
  if (!raw) {return []}

  let result = []
  let instructions = raw.split(';')
  instructions.forEach((instruction,i) => {
    const key = `heda-${i}-${instruction}`
    let args = instruction.split(',')
    let cmd = args[0]
    if (cmd == 'ADD') {
      let qty = args[1]
      let i = args[2].indexOf('-')
      let machineFoodId = i !== -1 ? args[2].substr(0, i) : null
      let machineFoodName = i !== -1 ? args[2].substr(i+1) : args[2]
      result.push({key, qty, label: machineFoodName})
    } else if (cmd == 'CONTAINER' && args[1]) {
      result.push({key, header: args[1]})
    }
  })
  return result
}
export function recipeIngredientsAndHeaders(recipe) {
  return [...parseIngredientsAndHeaders(recipe.ingredients), ...parseHedaInstructionsIngredients(recipe.heda_instructions)]
}

/**
 * Check if the given email is valid.
 * @param String name 
 * @returns A string with an error message if the email is invalid, nullish otherwiser.
 */
 export function validateEmail(email) {
  return isValidEmail(email) ? '' : 'Invalid_email'
}

/**
 * Check if the given password is valid. Must be at least 6 characters long.
 * @param String name 
 * @returns A string with an error message if the password is invalid, nullish otherwiser.
 */
export function validatePassword(password) {
  return password?.length >= 6 ? null : 'Invalid_password_length'
}

/**
 * Check if the given username is valid. Must be at least 3 characters long. Must not be an email
 * @param String name 
 * @returns A string with an error message if the username is invalid, nullish otherwiser.
 */
export function validateUsername(name) {
  if (!name || name.length < 3) {return 'Invalid_username_length'}
  if (isValidEmail(name)) {return 'Invalid_username_is_email'}
  return null
}

// EX: validateUnique(email, allUsers.map(u=>u.email), 'Email_not_unique'),
export function validateUnique(value, values, error) {
  let val = normalizeSearchText(value)
  return values.find(v => normalizeSearchText(v) == val) ? error : null
}

/**
 * @typedef {Object} AjaxArgs
 * @property {string} url
 * @property {string} contentType Default is "application/json".
 * @property {string} method "GET", "PATCH", "POST" or "DELETE"
 * @property {function} success Success callback function.
 * @property {function} error Error callback function.
 */
/**
 * 
 * @param {AjaxArgs} params 
 */
export function ajax(params) {

  if (!params.url) {throw "ajax missing params url"}

  let method = params.method || params.type

  let headers = {}

  let _csrf = null
  if (method !== 'GET') {
    let _csrfContainer = document.querySelector('[name="csrf-token"]')
    if (!_csrfContainer) {console.log("Can't modify state missing csrf token.")}
    _csrf = _csrfContainer.content
  }

  let url = params.url
  let body = null
  if (method == "GET") {
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
  
  console.log('ajax '+url, params)

  fetch(url, {
    method,
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