import fs from 'fs'

import { header, assertEquals, assertThrowsException, fail, pass, assert } from "./tests_helpers.js"
import sqlDb from "../src/sql_db.js"
import schema from '../src/schema.js';

fs.copyFileSync("var/db/dev.db", "var/db/test.db")

const db = new sqlDb("var/db/test.db", { verbose: console.log })
db.setSchema(schema)

let user = {user_id: 999999999}
let admin = {user_id: 888888888, is_admin: true}
let invalid = {}
let recipe = null
let fetched = null
let record = null
let kind = null
let recipeKind = null

// Testing createRecord
header('Testing createRecord')
assertThrowsException('Trying to mass assign a security attribute should throw an exception', () => {
  db.createRecord('recipes', {user_id: 1}, user)
})
recipe = db.createRecord('recipes', {name: 'Testing recipe'}, user)
assertEquals(user.user_id, recipe.user_id)
fetched = db.fetchRecord('recipes', {id: recipe.id}, ['user_id'])
assert(fetched, "Recipe should exists")
assertEquals(user.user_id, fetched.user_id)
  
// TODO: Test that create record uses allow_write and writes the attribute to database
// And exception if not allowed
db.createRecord('images', {slug: 'foo.jpg'}, user, {allow_write: 'slug'})

assertThrowsException('Creating a translation without being an admin should not be allowed', () => {
  db.createRecord('translations', {original: 'test', translated: 'test'}, user)
})
record = db.createRecord('translations', {original: 'test', translated: 'test'}, admin)
assert(record.id, "Created record should have an id.")

// Testing findAndDestroyRecord
header('Testing findAndDestroyRecord')
assertThrowsException('Trying to destroy a recipe without the good user should not work', () => {
  db.findAndDestroyRecord('recipes', recipe, invalid)
})
recipe = db.createRecord('recipes', {name: 'Testing recipe'}, user)
db.findAndDestroyRecord('recipes', recipe, user)
assert(!db.fetchRecord('recipes', {id: recipe.id}, []), "Recipe should be destroyed")

// Testing findAndDestroyRecords
header('Testing findAndDestroyRecords')
recipe = db.createRecord('recipes', {name: 'Testing recipe'}, user)
db.findAndDestroyRecords('recipes', 'id', recipe.id, user)
assert(!db.fetchRecord('recipes', {id: recipe.id}, []), "Recipe should be destroyed")

// Testing findAndDestroyRecordWithDependants
header('Testing findAndDestroyRecordWithDependants')
assertThrowsException('Trying to destroy a recipe with dependants should only work for an admin', () => {
  recipe = db.createRecord('recipes', {name: 'Testing recipe'}, user)
  db.findAndDestroyRecord('recipes', recipe, invalid)
})
recipe = db.createRecord('recipes', {name: 'Testing recipe'}, admin)
db.findAndDestroyRecordWithDependants('recipes', recipe, admin)
assert(!db.fetchRecord('recipes', {id: recipe.id}, []), "Recipe should be destroyed")

// Testing findAndUpdateRecord
header('Testing findAndUpdateRecord')
recipe = db.createRecord('recipes', {name: 'Testing recipe'}, user)
db.findAndUpdateRecord('recipes', recipe, {name: 'mod'}, user)
fetched = db.fetchRecord('recipes', {id: recipe.id}, ['name'])
console.log('fetched', fetched)
assertEquals("mod", fetched.name)

// Testing fetchTable join
//header('Testing fetchTable join')
//kind = db.createRecord('kinds', {name_fr: 'Test', name_en: 'Test'}, admin)
//db.createRecord('recipe_kinds', {kind_id: kind.id, name_fr: 'Test2', name_en: 'Test2'}, admin)
//db.createRecord('recipe_kinds', {kind_id: kind.id, name_fr: 'Test3', name_en: 'Test3'}, admin)
//console.log('results', db.fetchTable('kinds', {id: kind.id}, 'recipe_kinds.name_fr', {join: {table: 'recipe_kinds', key: 'id', foreign: 'kind_id'}}))
