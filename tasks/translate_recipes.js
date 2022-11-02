// node -r dotenv/config tasks/translate_recipes.js

import db from '../src/db.js';
//import utils from '../src/utils.js';
//import { normalizeSearchText } from "../src/react/utils.js"
//import { findRecipeKindForRecipe } from "../src/lib.js"
//

//db.run('ALTER TABLE recipes ADD COLUMN ingredients TEXT', [], function(err) {
//  if (err) {console.log('ERR', err)}
//})

function replaceFirstChar(string, char) {
  let c = string[0]
  return char+string.substr(1)
}

function translatePart(part) {
  if (part === '') {return ''}
  if (part === ' ') {return ' '}
  let startsWithSpace = part.charAt(0) === ' '
  let endsWithSpace = part.slice(-1) === ' '
  let text = part.trim()
  let down = replaceFirstChar(text, text[0].toLocaleLowerCase())
  let startsWithUpperLetter = text !== down
  console.log('Missing translation:',down)
  let translated = down
  if (startsWithUpperLetter) {
    translated = replaceFirstChar(translated, translated[0].toLocaleUpperCase())
  }
  return (startsWithSpace ? ' ' : '') + translated + (endsWithSpace ? ' ' : '')
}

function translateKeepPunctuation(text) {
  // Split on punctuation
  let parts = text.split(/([,\.\(\):;])/g)
  return parts.map((p,i) => {
    if (i % 2 === 0) { // Text
      return translatePart(p)
    } else { // Punctuation, keep as is
      return p
    }
  }).join('')
}

/**
 * Don't translate URLs. Transation text by spliting at punctuation.
 */
function translate(raw) {
  if (raw === null) {return null}
  if (raw === '') {return ''}

  // Don't translate links.
  // Regex from: https://stackoverflow.com/questions/6038061/regular-expression-to-find-urls-within-a-string
  // Changed it so all the groups are non-capturing groups by adding ?: at the beginning
  let regex = /((?:http|ftp|https):\/\/(?:[\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-]))/g
  //let mod = raw.split(regex)
  let translated = raw.split(regex).map((p,i) => {
    if (i % 2 === 1) { // Url, keep as is
      return p
    } else {
      return translateKeepPunctuation(p)
    }
  }).join('')

  //console.log('Raw:',raw)
  //console.log('Translated:', translated)
}

function translateContent(node) {
  if (node.type === "text") {
    node.text = translate(node.text)
  } else if (node.content) {
    node.content = node.content.map(n => translateContent(n))
  }
  return node
}

let attrs = ['name', 'json', 'servings_name']
const recipes = db.fetchTable('recipes', {}, attrs)

recipes.forEach(recipe => {

  console.log('*** RECIPE '+recipe.id+' ***')
  let translated = {original_id: recipe.id}
  translated.name = translate(recipe.name)
  translated.servings_name = translate(recipe.servings_name)
 
  if (recipe.json) {
    translated.json = JSON.stringify(translateContent(JSON.parse(recipe.json)))
  }

  //db.createRecord('translated_recipes', translated, {allow_write: ['original_id']})
  
})
