import { normalizeSearchText } from "./utils.js"
import Quantity from './quantity.js'
import { t, tr } from './translate.js'
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
  return tr("Ingredients", locale) + ": " + ingredients.map(ing => extractFoodNameFromIngredient(ing.label)).join(" · ")
}

export function localeAttr(attr, locale) {
  return attr+'_'+(locale||'en')
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

export function prettyMinutes(minutes) {
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

