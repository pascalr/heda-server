// node -r dotenv/config migrations/images.js

import db from '../src/db.js';

const images = db.fetchTable('images', {}, ['filename', 'slug', 'user_id'])

images.forEach(image => {
  if (!image.slug && image.filename) {
    let ext = image.filename.substr(image.filename.lastIndexOf('.') + 1).toLowerCase();
    let slug = `${image.id}.${ext}`
    db.safeUpdateField('images', image.id, 'slug', slug, {user_id: image.user_id}, {allow_write: ['slug']})
  }
})
