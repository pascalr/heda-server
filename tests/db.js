import fs from 'fs'

import { header, assertEquals, assertThrowsException, fail, pass } from "./tests_helpers.js"
import sqlDb from "../src/sql_db.js"
import schema from '../src/schema.js';

fs.copyFileSync("var/db/dev.db", "var/db/test.db")

const db = new sqlDb("var/db/test.db", { verbose: console.log })
db.setSchema(schema)

// FIXME: This with test database, not development database...
//import db from '../src/db.js';

let user = {user_id: 999999999}

header('Testing createRecord')
let recipe = db.createRecord('recipes', {name: 'Testing recipe'}, user)
assertEquals(user.user_id, recipe.user_id)
assertThrowsException('Trying to mass assign a security attribute should throw an exception', () => {
  db.createRecord('recipes', {user_id: 1}, user)
})
