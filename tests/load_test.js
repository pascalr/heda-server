import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

//import lazyDb from "../src/lazy_db.js"
//import schema from '../src/schema.js';
import { assertEquals, assertStartsWith } from "./tests_helpers.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//fs.copyFileSync("var/db/dev.db", "var/db/test.db")
//const db = new lazyDb("var/db/test.db", { verbose: console.log })
//db.setSchema(schema)

async function getPathname(page) {return await page.evaluate(() => document.location.pathname)}
//const url = await page.url();


(async () => {
  const browser = await puppeteer.launch({});
  //const browser = await puppeteer.launch({dumpio: true});
  const page = await browser.newPage();
  await page.setDefaultTimeout(6000);

  page.on('response', async function(response) {
    const status = response.status()
    if ((status >= 400) && (status <= 599)) {
      let buf = await response.buffer()
      console.log('\x1b[31mERROR '+status+'\x1b[0m: at url', response.url())
      console.log(buf.toString())
    }
    // 304: Not Modified
    if ((status >= 300) && (status <= 399) && (status !== 304)) {
      console.log('\x1b[33mREDIRECTED FROM', response.url(), 'TO', response.headers()['location'], '\x1b[0m')
    }
  })

  // Catch console log errors
  page.on("pageerror", err => {
    console.log(`\x1b[31mLOG ERROR\x1b[0m: ${err.toString()}`);
  });

  // Catch all console messages
  page.on('console', msg => {
      //console.log('Logger:', msg.type());
      console.log('\x1b[36mLOG\x1b[0m:', msg.text());
      //console.log('Logger:', msg.location());
  }); 

  const locales = ['fr', 'en']
  //const locales = ['fr']
  for (let i = 0; i < locales.length; i++) {
    let locale = locales[i]

    // Load page
    let url = 'http://localhost:3000/?locale='+locale
    //let url = 'http://localhost:3000/?disablePreview=true&locale='+locale
    var before = new Date()
    //await page.goto(url, {waitUntil: 'networkidle0'});
    await page.goto(url);
    await page.waitForSelector('body');
    console.log('TIME ELAPSED (ms): '+(new Date()-before))
  }

  await browser.close();
})();
