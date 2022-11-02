import {TranslationServiceClient} from '@google-cloud/translate';

import { parseIngredientsAndHeaders, serializeIngredientsAndHeaders } from '../src/lib.js';

// Instantiates a client
const translationClient = new TranslationServiceClient();

const projectId = 'hedacuisine';
const location = 'global';

export async function googleTranslate(text) {
  throw "Safety disabled google translate"
  
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

function replaceFirstChar(string, char) {
  let c = string[0]
  return char+string.substr(1)
}

class Translator {
  constructor(cache, translateStrategy) {
    this.cache = cache
    this.translateStrategy = translateStrategy
    this.translate = this.translate.bind(this)
    this.translatePart = this.translatePart.bind(this)
    this.translateRecipe = this.translateRecipe.bind(this)
    this.translateTiptapContent = this.translateTiptapContent.bind(this)
    this.translateKeepPunctuation = this.translateKeepPunctuation.bind(this)
    this.translateIngredientsAndHeaders = this.translateIngredientsAndHeaders.bind(this)
  }

  async translatePart(part) {
    if (part === '') {return ''}
    if (part === ' ') {return ' '}
    let startsWithSpace = part.charAt(0) === ' '
    let endsWithSpace = part.slice(-1) === ' '
    let text = part.trim()
    let normalized = replaceFirstChar(text, text[0].toLocaleLowerCase())
    let startsWithUpperLetter = text !== normalized
    let translated = this.cache[normalized]
    if (translated) {
      console.log('Found translation from:',normalized,'To:',translated)
    } else {
      console.log('Missing translation:',normalized)
      translated = await this.translateStrategy(normalized)
      console.log('Google translate:',translated)
      let translation = {from: from, to: to, original: normalized, translated}
      db.createRecord('translations', translation, {allow_write: ['from', 'to', 'original', 'translated']})
    }
    if (startsWithUpperLetter) {
      translated = replaceFirstChar(translated, translated[0].toLocaleUpperCase())
    }
    return (startsWithSpace ? ' ' : '') + translated + (endsWithSpace ? ' ' : '')
  }
  
  async translateKeepPunctuation(text) {
    // Split on punctuation
    let parts = text.split(/([,\.\(\):;])/g)
    return (await Promise.all(parts.map(async (p,i) => {
      if (i % 2 === 0) { // Text
        return await this.translatePart(p)
      } else { // Punctuation, keep as is
        return p
      }
    }))).join('')
  }
  
  /**
   * Don't translate URLs. Transation text by spliting at punctuation.
   */
  async translate(raw) {
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
        return await this.translateKeepPunctuation(p)
      }
    }))).join('')
  
    return translated
  }
  
  async translateTiptapContent(node) {
    if (node.type === "text") {
      node.text = await this.translate(node.text)
    } else if (node.content) {
      node.content = await Promise.all(node.content.map(async n => await this.translateTiptapContent(n)))
    }
    return node
  }

  async translateIngredientsAndHeaders(ingredients) {
    let ingredientsAndHeaders = parseIngredientsAndHeaders(ingredients)
    let translatedIngAndHeaders = await Promise.all(ingredientsAndHeaders.map(async ingOrHeader => {
      let r = {...ingOrHeader}
      if (r.header) { // Header
        r.header = await this.translate(r.header)
      } else { // Ingredient
        // TODO: Translate quantity label. Ex: c. à table => tbsp, douzaine => dozen
        r.label = await this.translate(r.label)
      }
      return r
    }))
    return serializeIngredientsAndHeaders(translatedIngAndHeaders)
  }

  async translateRecipe(recipe) {

    let translated = {original_id: recipe.id}
    translated.name = await this.translate(recipe.name)
    translated.servings_name = await this.translate(recipe.servings_name)
    if (recipe.json) {
      translated.json = JSON.stringify(await this.translateTiptapContent(JSON.parse(recipe.json)))
    }
    translated.ingredients = await this.translateIngredientsAndHeaders(recipe.ingredients)
  }
}
export default Translator
