import {isBlank} from '../src/utils.js'
import Quantity from '../src/quantity.js'
import { Utils } from "../src/react/recipe_utils.js"
import { prettyPreposition } from "../src/lib.js"
import { header, assertEquals } from "./tests_helpers.js"
//import Ingredient from "./ingredient.js"

global.gon = {} // FIXME: Remove this horrible shit

//# Ansi color code variables
//red="\e[0;91m"
//blue="\e[0;94m"
//expand_bg="\e[K"
//blue_bg="\e[0;104m${expand_bg}"
//red_bg="\e[0;101m${expand_bg}"
//green_bg="\e[0;102m${expand_bg}"
//green="\e[0;92m"
//white="\e[0;97m"
//bold="\e[1m"
//uline="\e[4m"
//reset="\e[0m"

header('Testing isBlank')
assertEquals(true, isBlank([]))
assertEquals(true, isBlank(""))
assertEquals(true, isBlank(null))
assertEquals(true, isBlank(undefined))
assertEquals(false, isBlank([1]))
assertEquals(false, isBlank("1"))

//function testIngredient() {
//  header('Testing testIngredient')
//  
//  let test = (str, expected) => {
//    let ing = new Ingredient({raw: str})
//    assertEquals(expected[0], ing.rawQty)
//    assertEquals(expected[1], ing.foodName)
//  }
//
//  test("1/2 t; huile", ["1/2 t", "huile"])
//  test("1/2 t d'huile", ["1/2 t", "huile"])
//  test("250 mL de lait", ["250 mL", "lait"])
//  test("4 bananes", ["4", "bananes"])
//    
//  let ing = new Ingredient({raw: "1/2 t d'huile"})
//  assertEquals(0.5, ing.getQuantity().nb)
//  assertEquals("t", ing.getQuantity().label)
//}

function testQuantity() {
  header('Testing testQuantity')

  let test = (str, expected) => {
    let qty = new Quantity(str)
    assertEquals(expected[0], qty.nb)
    assertEquals(expected[1], qty.label)
  }

  test("1/2 t", [0.5, "t"])
  test("1.5 L", [1.5, "L"])
  test("2,5 L", [2.5, "L"])
  test("4", [4, ""])
  test("250 mL", [250, "mL"])
  test("250 unitDoesNotExist", [250, "unitDoesNotExist"])
}
  
header('Testing prettyPreposition')
assertEquals('', prettyPreposition(null, null, 'fr'))
assertEquals('', prettyPreposition('', '', 'fr'))
assertEquals("d'", prettyPreposition('100 mL', 'huile', 'fr'))
assertEquals("de ", prettyPreposition('100 g', 'sucre', 'fr'))

function testPrintRecipeIngredient() {
  header('Testing testPrintRecipeIngredient')

  //prettyQuantityFor('1/4 t', 'huile végétale')
  assertEquals("1/4 t d'", Utils.prettyQuantityFor('1/4 t', 'huile végétale'))
  assertEquals("250 mL d'", Utils.prettyQuantityFor('250 mL', 'huile végétale'))
  assertEquals('2', Utils.prettyQuantityFor('2', 'banane'))

  //test("2", "banane plantain", "2 bananes plantains")
  //test("1/2 t", "huile végétale", "1/2 t d'huile végétale")

  //const [qty, foodName] = Quantity.parseQuantityAndFoodName(ingredient)
  //text = Utils.prettyQuantityFor(qty.raw, foodName)
  //food = gon.foodList.find(food => food.name == foodName)
  //name = foodName
}

testPrintRecipeIngredient()
testQuantity()
//testIngredient()
//
