// node -r dotenv/config tasks/translate_recipes.js

import db from '../src/db.js';

import {TranslationServiceClient} from '@google-cloud/translate';

// Instantiates a client
const translationClient = new TranslationServiceClient();

const projectId = 'hedacuisine';
const location = 'global';

// TODO: Don't hardcode this. Check what language the source is.
let from = 1 // French
let to = 4 // English
let fromLocale = 'fr' // French
let toLocale = 'en' // French

async function translateText(text) {
  
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: fromLocale,
    targetLanguageCode: toLocale,
  };

  const [response] = await translationClient.translateText(request);

  for (const translation of response.translations) {
    console.log(`Translation: ${translation.translatedText}`);
  }

  return response.translations[0].translatedText
}

const translations = db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated'])
const frenchToEnglish = {}
translations.forEach(translation => {
  if (translation.from == from && translation.to == to) {
    frenchToEnglish[translation.original] = translation.translated
  } else if (translation.to == from && translation.from == to) {
    frenchToEnglish[translation.translated] = translation.original
  }
})

let missing = []

function replaceFirstChar(string, char) {
  let c = string[0]
  return char+string.substr(1)
}

async function translatePart(part) {
  if (part === '') {return ''}
  if (part === ' ') {return ' '}
  let startsWithSpace = part.charAt(0) === ' '
  let endsWithSpace = part.slice(-1) === ' '
  let text = part.trim()
  let down = replaceFirstChar(text, text[0].toLocaleLowerCase())
  let startsWithUpperLetter = text !== down
  let translated = frenchToEnglish[down]
  if (translated) {
    console.log('Found translation from:',down,'To:',translated)
  } else {
    console.log('Missing translation:',down)
    missing.push(down)
    translated = await translateText(down)
    console.log('Google translate:',translated)
    let translation = {from: from, to: to, original: down, translated}
    db.createRecord('translations', translation, {allow_write: ['from', 'to', 'original', 'translated']})
  }
  if (startsWithUpperLetter) {
    translated = replaceFirstChar(translated, translated[0].toLocaleUpperCase())
  }
  return (startsWithSpace ? ' ' : '') + translated + (endsWithSpace ? ' ' : '')
}

async function translateKeepPunctuation(text) {
  // Split on punctuation
  let parts = text.split(/([,\.\(\):;])/g)
  return (await Promise.all(parts.map(async (p,i) => {
    if (i % 2 === 0) { // Text
      return await translatePart(p)
    } else { // Punctuation, keep as is
      return p
    }
  }))).join('')
}

/**
 * Don't translate URLs. Transation text by spliting at punctuation.
 */
async function translate(raw) {
  if (!raw) {return raw}

  // Don't translate links.
  // Regex from: https://stackoverflow.com/questions/6038061/regular-expression-to-find-urls-within-a-string
  // Changed it so all the groups are non-capturing groups by adding ?: at the beginning
  let regex = /((?:http|ftp|https):\/\/(?:[\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-]))/g
  //let mod = raw.split(regex)
  let translated = (await Promise.all(raw.split(regex).map(async (p,i) => {
    if (i % 2 === 1) { // Url, keep as is
      return p
    } else {
      return await translateKeepPunctuation(p)
    }
  }))).join('')

  console.log('Raw:',raw)
  console.log('Translated:', translated)
  return translated
}

async function translateContent(node) {
  if (node.type === "text") {
    node.text = await translate(node.text)
  } else if (node.content) {
    node.content = await Promise.all(node.content.map(async n => await translateContent(n)))
  }
  return node
}

let attrs = ['name', 'json', 'servings_name']
const recipes = db.fetchTable('recipes', {}, attrs, {limit: 1})
const translatedRecipes = db.fetchTable('translated_recipes', {}, ['original_id'])

// TODO: translate recipes by languages. If the recipe is english, translate from english to french...
recipes.forEach(async recipe => {

  //if (translatedRecipes.find(r => r.original_id == recipe.id)) {
  //  console.log('*** SKIPING RECIPE '+recipe.id+' ALREADY TRANSLATED ***')
  //  return
  //}

  console.log('*** RECIPE '+recipe.id+' ***')
  let translated = {original_id: recipe.id}
  translated.name = await translate(recipe.name)
  translated.servings_name = await translate(recipe.servings_name)
 
  if (recipe.json) {
    translated.json = JSON.stringify(await translateContent(JSON.parse(recipe.json)))
  }

  // TODO: Translate ingredients

  console.log('////////////////////////////')
  console.log('////////////////////////////')
  console.log('////////////////////////////')
  console.log('recipe', recipe)
  console.log('////////////////////////////')
  console.log('////////////////////////////')
  console.log('////////////////////////////')
  console.log('translated', translated)
  console.log('////////////////////////////')
  console.log('////////////////////////////')
  console.log('////////////////////////////')
  db.createRecord('translated_recipes', translated, {allow_write: ['original_id']})
  
})

console.log('Missing count:', missing.length)
let uniq = [...new Set(missing)]
console.log('Unique missing count:', uniq.length)
console.log('Char count:', uniq.reduce(function (sum, str) {
  return sum + str.length
}, 0))

