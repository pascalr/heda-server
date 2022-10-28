// node -r dotenv/config migrations/image_thumbs.js

import { fileURLToPath } from 'url';
import sharp from 'sharp'
import path from 'path';
import db from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let p = process.env.VOLUME_PATH
let VOLUME_FOLDER = p[0] == '.' ? path.join(__dirname, '..', p) : p
let IMAGE_FOLDER = path.join(VOLUME_FOLDER, 'images')

const images = db.fetchTable('images', {}, ['slug'])
images.forEach(image => {

  const promises = [];
  let stream = sharp(path.join(IMAGE_FOLDER, image.slug))

  // OPTIMIZE: It would be better if the latter resizes used the previous ones?
  let out1 = path.join(IMAGE_FOLDER, "original", image.slug)
  let opts = {width: 800, height: 800, fit: 'inside', withoutEnlargement: true}
  promises.push(stream.clone().resize(opts).toFile(out1));

  //let out2 = path.join(IMAGE_FOLDER, "medium", image.slug)
  //opts = {width: 452, height: 304, fit: 'cover', withoutEnlargement: true}
  //promises.push(stream.clone().resize(opts).toFile(out2));

  let out3 = path.join(IMAGE_FOLDER, "thumb", image.slug)
  opts = {width: 71, height: 48, fit: 'cover', withoutEnlargement: true}
  promises.push(stream.clone().resize(opts).toFile(out3));
    
  let out4 = path.join(IMAGE_FOLDER, "small", image.slug)
  opts = {width: 255, height: 171, fit: 'cover', withoutEnlargement: true}
  promises.push(stream.clone().resize(opts).toFile(out4));
  
  Promise.all(promises)
    .then(r => { console.log("Done processing image!"); })
        
    .catch(err => {
      console.error("Error processing files, let's clean it up", err);
      try {
        fs.unlinkSync(out1);
        //fs.unlinkSync(out2);
        fs.unlinkSync(out3);
        fs.unlinkSync(out4);
      } catch (e) {}
    });
})
