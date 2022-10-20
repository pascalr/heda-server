// node -r dotenv/config tasks/backup_db.js

import db from '../src/db.js';

db.doBackup()
