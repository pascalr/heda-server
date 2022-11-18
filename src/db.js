import fs from 'fs';
import path from 'path';

import schema from './schema.js';
import lazyDb from './lazy_db.js';

//import { findRecipeKindForRecipeName } from "./lib.js"
import {now} from './utils.js';

// FIXME: DB_URL should be DB_PATH, it's not an URL (doesn't start with sqlite3://...)
let dbPath = process.env.DB_URL
console.log('Database path:', dbPath)
console.log('Checking if database exists...')
if (fs.existsSync(dbPath)) {
  console.log('yes')
} else {
  console.log('no')
}
export const db = new lazyDb(dbPath, { verbose: console.log })
db.setSchema(schema)
console.log('Opening database successful!')

export default db;
