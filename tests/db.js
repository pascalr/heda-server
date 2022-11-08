import fs from 'fs'

import { header, assertEquals, assertThrowsException, fail, pass, assert } from "./tests_helpers.js"
import sqlDb from "../src/sql_db.js"
import schema from '../src/schema.js';

fs.copyFileSync("var/db/dev.db", "var/db/test.db")

const db = new sqlDb("var/db/test.db", { verbose: console.log })
db.setSchema(schema)

// FIXME: This with test database, not development database...
//import db from '../src/db.js';

let user = {user_id: 999999999}
let admin = {is_admin: true}
let invalid = {}

header('Testing createRecord')
assertThrowsException('Trying to mass assign a security attribute should throw an exception', () => {
  db.createRecord('recipes', {user_id: 1}, user)
})
let recipe = db.createRecord('recipes', {name: 'Testing recipe'}, user)
assertEquals(user.user_id, recipe.user_id)
assertThrowsException('Trying to destroy a recipe without the good user should not work', () => {
  db.findAndDestroyRecord('recipes', recipe, invalid)
})
db.findAndDestroyRecord('recipes', recipe, user)

assertThrowsException('Creating a translation without being an admin should not be allowed', () => {
  db.createRecord('translations', {original: 'test', translated: 'test'}, user)
})
let record = db.createRecord('translations', {original: 'test', translated: 'test'}, admin)
assert(record.id, "Created record should have an id.")
