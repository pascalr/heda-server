import { normalizeSearchText } from "./react/utils.js"
import Quantity from './quantity.js'
import { t} from './translate.js'

// gros oignon espagnol, finement coupé => gros oignon espagnol
export function extractFoodNameFromIngredient(label) {
  return label.split(',')[0]
}

export function localeAttr(attr, locale) {
  return attr+'_'+(locale||'en')
}
export function fetchRecipeKinds(db, conditions, locale, fetchDescription=true) {
  let attrs = [localeAttr('name', locale), 'image_slug']
  if (fetchDescription) {attrs.push(localeAttr('json', locale))}
  let records = db.fetchTable('recipe_kinds', conditions, attrs)
  return records.map(r => {
    let obj = {id: r.id, image_slug: r.image_slug, name: r[localeAttr('name', locale)]}
    if (fetchDescription) {obj.description_json = r[localeAttr('json', locale)]}
    return obj
  })
}
export function fetchRecipeKind(db, conditions, locale, fetchDescription=true) {
  let attrs = [localeAttr('name', locale), 'image_slug']
  if (fetchDescription) {attrs.push(localeAttr('json', locale))}
  let r = db.fetchRecord('recipe_kinds', conditions, attrs)
  let obj = {id: r.id, image_slug: r.image_slug, name: r[localeAttr('name', locale)]}
  if (fetchDescription) {obj.description_json = r[localeAttr('json', locale)]}
  return obj
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
  return recipeKinds.find(k => name.includes(normalizeSearchText(k.name_fr)) || name.includes(normalizeSearchText(k.name_en)))
}

export function serializeIngredientsAndHeaders(ingredients) {
  return ingredients.map(ing => {
    if (ing.header != null) {return '#'+ing.header}
    return ing.qty + '; ' + ing.label
  }).join("\n")
}

export function parseIngredientsAndHeaders(text) {
  if (!text) {return []}
  let itemNb = 0
  return text.split("\n").map((line,i) => {
    if (line.length <= 0) {return null;}
    const key = `${i}-${line}`
    // An ingredient section
    if (line[0] == '#') {
      return {key: key, header: line.substr(1).trim()}
    }
    let args = line.split(";")
    itemNb += 1
    return {key: key, qty: args[0].trim(), label: args[1].trim(), item_nb: itemNb}
  }).filter(e => e)
}

