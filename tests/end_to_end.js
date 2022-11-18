import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../src/db.js';
import { assertEquals, assertStartsWith } from "./tests_helpers.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let ACCOUNT_EMAIL = "AutomaticTest@hedacuisine.com"
let ACCOUNT_PASSWORD = "12345678"
let USER_NAME = "AutomaticTest"

let account = db.prepare("SELECT id FROM accounts WHERE email = ?").get(ACCOUNT_EMAIL)
if (account) {
  console.log("Destroying previous test account");
  db.prepare('DELETE FROM accounts WHERE id = ?').run(account.id)
}

let user = db.prepare("SELECT id FROM users WHERE name = ?").get(USER_NAME)
if (user) {
  console.log("Destroying previous test user");
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id)
}

async function getPathname(page) {return await page.evaluate(() => document.location.pathname)}
//const url = await page.url();


(async () => {
  const browser = await puppeteer.launch({});
  //const browser = await puppeteer.launch({dumpio: true});
  const page = await browser.newPage();
  await page.setDefaultTimeout(5000);

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

  //const locales = ['fr', 'en']
  const locales = ['fr']
  for (let i = 0; i < locales.length; i++) {
    let locale = locales[i]

    // Load page
    let url = 'http://localhost:3000/?disablePreview=true&locale='+locale
    await page.goto(url, {waitUntil: 'networkidle0'});

    // Search for "Pas" and go to page "Pascal"
    await page.waitForSelector('#search-btn');
    await page.click('#search-btn');
    await page.waitForSelector('#search-input');
    await page.type('#search-input', "pas");
    await page.waitForSelector('#search-results a');
    await page.click('#search-results a');
    await page.waitForSelector('#root-u');
    assertStartsWith("/u/", await getPathname(page))
   
    // Click on the first link, it should be a recipe
    await page.waitForSelector('.trunk a');
    await page.click('.trunk a');
    assertStartsWith("/r/", await getPathname(page))

    // Create an account
    url = 'http://localhost:3000/signup?locale='+locale
    await page.goto(url, {waitUntil: 'networkidle0'});
    await page.waitForSelector('#email');
    await page.type('#email', ACCOUNT_EMAIL);
    await page.type('#new-password', ACCOUNT_PASSWORD);
    await page.click('#create');
    await page.waitForSelector('#choose-user-form');
    assertStartsWith("/choose_user", await getPathname(page))

    // Create a profile
    // The first link should be a button to create a profile
    await page.waitForSelector('body a');
    await page.click('body a');
    assertStartsWith("/new_user", await getPathname(page))
    await page.waitForSelector('#name');
    await page.type('#name', USER_NAME);
    await page.click('#create');
    await page.waitForSelector('body');
    assertEquals("/", await getPathname(page))
    
    // Edit the profile image
    url = 'http://localhost:3000/edit_profile'
    await page.goto(url, {waitUntil: 'networkidle0'});

    // Create a recipe
    // Change cooking time
    // Add an ingredient
    // Paste two more ingredients
    // Add some instructions
    // Add a single ingredient {1} and a range of ingredients {1-3}
    // Look at the recipe
    // Look at my settings
    // Create a tag
    // Look at my recipes
    // Tag the recipe with the tag
    // Look at the suggestions, see the tag with the recipe
    // Add the recipe to the list To Cook Soon
    // Remove the recipe from the list To Cook Soon
    // Logout
    // Log back in
    
  }

  await browser.close();
})();
