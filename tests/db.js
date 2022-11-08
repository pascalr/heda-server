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

// Testing createRecord
header('Testing createRecord')
assertThrowsException('Trying to mass assign a security attribute should throw an exception', () => {
  db.createRecord('recipes', {user_id: 1}, user)
})
recipe = db.createRecord('recipes', {name: 'Testing recipe'}, user)
assertEquals(user.user_id, recipe.user_id)
assert(db.fetchRecord('recipes', {id: recipe.id}, []), "Recipe should exists")

assertThrowsException('Creating a translation without being an admin should not be allowed', () => {
  db.createRecord('translations', {original: 'test', translated: 'test'}, user)
})
let record = db.createRecord('translations', {original: 'test', translated: 'test'}, admin)
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
