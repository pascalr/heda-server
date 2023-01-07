// TIPTAP
import {Bold} from '@tiptap/extension-bold'
import {Document} from '@tiptap/extension-document'
import {Heading} from '@tiptap/extension-heading'
import {History} from '@tiptap/extension-history'
import {Italic} from '@tiptap/extension-italic'
import {Paragraph} from '@tiptap/extension-paragraph'
import {Strike} from '@tiptap/extension-strike'
import {Text} from '@tiptap/extension-text'
import { Node, nodeInputRule, textblockTypeInputRule } from '@tiptap/core'

import { prettyPreposition, quantityWithPreposition } from "./lib.js"

// FIXME: Just trying to make it work so I can compile in node...
if (typeof window === undefined) {
  global.window = {}
}
const getLocale = () => {
  // FIXME
  return typeof(window === undefined) ? global.locale || 'fr' : window.locale
}
        
const singleIngredientRegex = "(\\\d+|\\\(\\\d+[^-,\\\(\\\)\\\}\\\{]*\\\)|[^-,\\\(\\\)\\\}\\\{]*;[^-,\\\(\\\)\\\}\\\{]*)"
//const signleIngredientRegex = '({(\d+|\(\d+[^\(\)\}\{]*\))})$'

// ingredient can be a number, which is the item nb, or it can be a raw ingredient (quantity separated by food by a semicolon)
const parseIngredient = (ingredient) => {
  let prettyQty = null
  let food = null
  let name = null
  let comment = null
  let ing = null
  // 200 mL; eau
  if (ingredient.includes(";")) {
    console.log('here')
    const [qty, foodName] = Quantity.parseQuantityAndFoodName(ingredient)
    prettyQty = quantityWithPreposition(qty.raw, foodName, getLocale())
    //food = gon.foods.find(food => food.name == foodName)
    name = foodName
  // (200 mL) deprecated, use ;
  } else if (ingredient.startsWith("(")) { // old version
    const raw = ingredient.slice(1,-1)
    const [qty, foodName] = Quantity.parseQuantityAndFoodName(raw)
    prettyQty = quantityWithPreposition(qty.raw, foodName, getLocale())
    //food = gon.foods.find(food => food.name == foodName)
    name = foodName
    // 1 => ingredient nb 1
  } else {
    let recipe_ingredients = gon.recipe_ingredients//.filter(e => e.recipe_id == gon.recipe.id)
    ing = Object.values(recipe_ingredients || {}).find(ing => ing.item_nb == ingredient)
    if (ing) {
      name = ing.name || ing.raw_food
      prettyQty = function() {
        if (!ing.raw) {return ''}
        let quantity = new Quantity({raw: ing.raw})
        if (quantity.nb == null) {return ''}
        if (quantity.label) {return ing.raw + ' ' + prettyPreposition(ing.raw, name, getLocale())}
        return ing.raw+' '
      }()
      comment = ing.comment
    } else {
      console.log('ERROR MISSING INGREDIENT', ingredient)
    }
  }
  return ({prettyQty, food, name, comment, ing})
}

const IngredientNode = Node.create({
  name: 'ing',
  group: 'inline',
  inline: true,
  selectable: false,
  //atom: true, // What is this???

  addAttributes() {
    return {
      raw: {
        default: null,
        parseHTML: element => element.getAttribute('data-ingredient') || element.getAttribute('raw'),
        renderHTML: attributes => {
          if (!attributes.raw) {return {}}
          return {'raw': attributes.raw}
        },
      },
      //rawIngredient: {
      //  default: {'data-raw-ingredient': null},
      //  parseHTML: element => element.getAttribute('data-raw-ingredient'),
      //  renderHTML: attributes => {
      //    if (!attributes.rawIngredient) {return {}}

      //    return {'data-raw-ingredient': attributes.rawIngredient}
      //  },
      //},
    }
  },

  // HTMLAttributes here comes from attributes.renderHTML as defined in addAttributes().
  renderHTML({ node, HTMLAttributes }) {

    const {prettyQty, food, name, comment, ing} = parseIngredient(HTMLAttributes['raw'])
    let children = []
    if (prettyQty && prettyQty != '') {children.push(prettyQty)}
    children.push(['span', {class: 'food-name'}, (food && food.is_public) ? ['a', {href: food.url}, name||''] : name||''])
    if (comment) { children.push(elementFromString(' '+comment)) }
    if (ing) {
      return safeRenderHTML(['span', {'data-ingredient-id': ing.id}, ...children])
    } else {
      return safeRenderHTML(['span', {'data-ingredient': HTMLAttributes['raw']}, ...children])
    }
  },

  //addNodeView() {
  //  return ({ editor, node, getPos }) => {

  //    const dom = document.createElement('div')
  //    dom.innerHTML = '<b>TESTING 1212</b>'
  //    dom.classList.add('node-view')

  //    return {dom,}
  //  }
  //},

  parseHTML() {
    return [{tag: 'span[data-ingredient]'}]
  },

  addCommands() {
    //.insertContent('Example Text')
    return {
      insertIngredient: (ingId) => ({ commands }) => {
        console.log("insertIngredient")
        console.log("raw", ingId)
        return commands.insertContent({type: 'ing', attrs: {raw: ingId.toString()}})
        //return commands.insertContent(`<span data-ingredient="${ingId}"/>`)
        //return commands.setNode('ingredient')
      },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: new RegExp(`({(${singleIngredientRegex})})$`),
        type: this.type,
        getAttributes: match => {
          const [,,inner] = match
          console.log("MATCH", match)
          console.log("INNER", inner)
          return {raw: inner}

          //const ing = Object.values(gon.recipe_ingredients).find(ing => ing.item_nb == itemNb)
          //if (!ing) {return {}}
          //console.log("ingredient", ing.id)
          //return {ingredient: ing.id}
        },
      }),
      //nodeInputRule({
      //  find: /({(\(\d+[^\(\)\}\{]*)}\))$/,
      //  type: this.type,
      //  getAttributes: match => {
      //    console.log(match)
      //    const [,,itemNb] = match

      //    const raw = match.slice(1, -1)
      //    console.log(raw)
      //    //const ing = new Ingredient({raw})
      //    return {'rawIngredient': raw}
      //  },
      //}),
    ]
  },

})

const IngredientListNode = Node.create({
  name: 'ings',
  group: 'block',
  //inline: true,
  //selectable: false,
  //atom: true, // What is this???

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      raw: {
        default: null,
        parseHTML: element => element.getAttribute('data-ingredients') || element.getAttribute('raw'),
        renderHTML: attributes => {
          if (!attributes.raw) {return {}}
          return {'raw': attributes.raw}
          //let ings = []
          //let s = attributes.ingredients.split(',')
          //s.forEach(c => {
          //  if (c.includes('-')) {
          //    let [start, end] = c.split('-').map(i => parseInt(i))
          //    for (let i = start; i <= end; i++) {
          //      ings.push(i)
          //    }
          //  } else {
          //    ings.push(c)
          //  }
          //})
          ////let ingIds = nbs.map(itemNb => (
          ////  Object.values(gon.recipe_ingredients).find(ing => ing.item_nb == itemNb)
          ////)).map(ing => ing.id)
          //return {'raw': ings.join(',')}
        },
      },
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    const raw = HTMLAttributes['raw']
    if (!raw) {return ['span', {}, 'FIXME']}
    let ings = []
    let s = raw.split(',')
    s.forEach(c => {
      if (c.includes('-')) {
        let [start, end] = c.split('-').map(i => parseInt(i))
        for (let i = start; i <= end; i++) {
          ings.push(i.toString())
        }
      } else {
        ings.push(c)
      }
    })
    let list = ings.map(ingredient => {
      const {prettyQty, food, name, comment, ing} = parseIngredient(ingredient)
      let children = []
      if (prettyQty && prettyQty != '') {children.push(prettyQty)}
      if (ing && ing.food && ing.food.is_public) {
        children.push(['span', {class: 'food-name'}, ['a', {href: ing.food.url}, ing.name||'']])
      } else {
        children.push(['span', {class: 'food-name'}, name||''])
      }
      if (ing) {
        if (ing.comment) {children.push(elementFromString(' '+ing.comment))}
        return safeRenderHTML(['li', {'data-ingredient-id': ing.id}, ...children])
      } else {
        return safeRenderHTML(['li', {'data-ingredient': ingredient}, ...children])
      }
    })
    if (!list || list.length == 0) {list = ''}
    // Return: ['tagName', {attributeName: 'attributeValue'}, child1, child2, ...children]
    return safeRenderHTML([
      'span',
      { 'data-ingredients': HTMLAttributes['raw']},
      ['ul', {}, ...list]
    ])
  },

  parseHTML() {
    return [{tag: 'span[data-ingredients]'}]
  },

  addInputRules() {
    return [
      nodeInputRule({
        //find: /({(\d+(,\d+|-\d+)+)})$/,
        find: new RegExp(`({(${singleIngredientRegex}(,${singleIngredientRegex}|-${singleIngredientRegex})+)})$`),
        type: this.type,
        getAttributes: match => {
          const [,,inner] = match
          console.log("REGEX", `({(${singleIngredientRegex}(,${singleIngredientRegex}|-${singleIngredientRegex})+)})$`)
          console.log("MATCH", match)
          console.log("INNER", inner)
          return { raw: inner }
        },
      }),
    ]
  },

})

const DeprecatedLinkModel = Node.create({
  name: 'link-model',
  priority: 1000,
  group: 'inline',
  inline: true,
  selectable: true,
  renderHTML({node, HTMLAttributes}) {
    return ['span', {}, '']
  },
})

const CustomHeading = Heading.extend({
  addInputRules() {
    return [3,4,5].map(level => {
      return textblockTypeInputRule({
        find: new RegExp("^(\\\${"+(level-2)+"})\\s$"),
        type: this.type,
        getAttributes: {level},
      })
    })
  },
})

const StepNode = Node.create({
  name: 'step',
  content: 'inline*',
  group: 'block',
  defining: true,

  addAttributes() {
    return {
      first: {
        default: false,
        parseHTML: element => element.getAttribute('data-step') || element.getAttribute('first'),
        renderHTML: attributes => {
          //return !attributes.first ? {} : {'data-step': attributes.first}
          if (attributes.first == null) {return {}}
          return {'first': attributes.first}
        },
      },
    }
  },

  parseHTML() {
    return [{tag: 'div[data-step]'}]
  },
  //parseHTML() {
  //  return this.options.levels
  //    .map((level: Level) => ({
  //      tag: `h${level}`,
  //      attrs: { level },
  //    }))
  //},

  renderHTML({ node, HTMLAttributes }) {
    //const hasLevel = this.options.levels.includes(node.attrs.level)
    //const level = hasLevel
    //  ? node.attrs.level
    //  : this.options.levels[0]

    //return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    return [`div`, {'data-step': HTMLAttributes['first']}, 0]
  },

  addCommands() {
    return {
      setStep: attributes => ({ commands }) => {
        return commands.setNode('step', attributes)
      },
      toggleStep: attributes => ({ commands }) => {
        return commands.toggleNode('step', 'paragraph', attributes)
      },
    }
  },

  //addKeyboardShortcuts() {
  //  return this.options.levels.reduce((items, level) => ({
  //    ...items,
  //    ...{
  //      [`Mod-Alt-${level}`]: () => this.editor.commands.toggleHeading({ level }),
  //    },
  //  }), {})
  //},

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: new RegExp(`^(#)\\s$`),
        type: this.type,
      })
    ]
  },
})

const editorSelectable = (node, editable) => editable ? node : node.extend({selectable: false})

export const getRecipeExtensions = (editable) => {
  return [
    Bold, Italic, Document, Paragraph, Strike, Text, CustomHeading, DeprecatedLinkModel,
    History, IngredientNode, editorSelectable(IngredientListNode, editable), StepNode
  ]
}
