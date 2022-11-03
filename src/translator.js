import { parseIngredientsAndHeaders, serializeIngredientsAndHeaders } from '../src/lib.js';

function replaceFirstChar(string, char) {
  let c = string[0]
  return char+string.substr(1)
}

// TODO: GoogleTranslateStrategy
//if (translated) {
//  console.log('Found translation from:',normalized,'To:',translated)
//} else {
//  console.log('Missing translation:',normalized)
//  translated = await this.translateStrategy(normalized)
//  console.log('Google translate:',translated)
//  let translation = {from: from, to: to, original: normalized, translated}
//  db.createRecord('translations', translation, {allow_write: ['from', 'to', 'original', 'translated']})
//}

export class StoreStrategy {
  constructor(msg) {
    this.msg = msg
    this._all = []
  }
  translate(normalized) {
    this._all.push(normalized)
    return null
  }
  all() {
    return this._all
  }
  unique() {
    return [...new Set(this._all)]
  }
  clear() {
    this._all = []
  }
}

export class LogStrategy {
  constructor(msg) {
    this.msg = msg
  }
  translate(normalized) {
    console.log(this.msg, normalized)
    return null
  }
}

export class TranslationsCacheStrategy {
  // TODO: Caching should actually be another strategy
  constructor(translations, from, to, ...strategies) {
    this.cache = {}

    translations.forEach(translation => {
      if (translation.from == from && translation.to == to) {
        this.cache[translation.original] = translation.translated
      } else if (translation.to == from && translation.from == to) {
        this.cache[translation.translated] = translation.original
      }
    })
  }
  translate(normalized) {
    let translated = this.cache[normalized]
    if (translated) {
      console.log('Cache found translation from:',normalized,'To:',translated)
    }
    return translated
  }
}

class Translator {
  // TODO: Caching should actually be another strategy
  // I think Strategy is the wrong pattern name, because it's not a single one.
  // But I don't know the proper pattern name.
  constructor(...strategies) {
    this.strategies = strategies
    this.translate = this.translate.bind(this)
    this.translatePart = this.translatePart.bind(this)
    this.translateRecipe = this.translateRecipe.bind(this)
    this.translateTiptapContent = this.translateTiptapContent.bind(this)
    this.translateKeepPunctuation = this.translateKeepPunctuation.bind(this)
    this.translateIngredientsAndHeaders = this.translateIngredientsAndHeaders.bind(this)
    this.translateWithStrategies = this.translateWithStrategies.bind(this)
  }
  
  async translateWithStrategies(normalized) {
    let translated = null
    for (let i = 0; i < this.strategies.length; i++) {
      if (translated) {console.log('HERE???'); return translated}
      let strategy = this.strategies[i]
      translated = await strategy.translate(normalized)
      if (translated) {return translated}
    }
  }

  async translatePart(part) {
    if (part === '') {return ''}
    if (part === ' ') {return ' '}
    let startsWithSpace = part.charAt(0) === ' '
    let endsWithSpace = part.slice(-1) === ' '
    let text = part.trim()
    let normalized = replaceFirstChar(text, text[0].toLocaleLowerCase())
    let startsWithUpperLetter = text !== normalized
    let translated = await this.translateWithStrategies(normalized)
    if (!translated) {
      return ''
    } else {
      if (startsWithUpperLetter) {
        translated = replaceFirstChar(translated, translated[0].toLocaleUpperCase())
      }
      return (startsWithSpace ? ' ' : '') + translated + (endsWithSpace ? ' ' : '')
    }
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
    return translated
  }
}
export default Translator
