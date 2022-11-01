import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getPathname(page) {return await page.evaluate(() => document.location.pathname)}
//const url = await page.url();

function coloredResult(result) {
  return result ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m'
}
function assertEquals(expected, actual) {
  console.log('Testing equals expected:', expected, 'Input:', actual)
  console.log(coloredResult(expected === actual))
}
function assertStartsWith(expected, actual) {
  console.log('Testing starts with:', expected, 'Input:', actual)
  console.log(coloredResult(actual.startsWith(expected)))
}

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
      console.log('\x1b[33mREDIRECTED FROM ', response.url(), ' TO ', response.headers()['location'], '\x1b[0m')
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
    const url = 'http://localhost:3000/?disablePreview=true&locale='+locale
    await page.goto(url, {waitUntil: 'networkidle0'});

    // Search for "Pas" and go to page "Pascal"
    await page.waitForSelector('#search-btn');
    await page.click('#search-btn');
    await page.waitForSelector('#search-input');
    await page.type('#search-input', "pas");
    await page.waitForSelector('#search-results a');
    await page.click('#search-results a');
    await page.waitForSelector('#root-u');
    let pathname = await getPathname(page)
    assertStartsWith("/u/", pathname)
   
    // Click on the first link, it should be a recipe
    await page.waitForSelector('.trunk a');
    await page.click('.trunk a');
    pathname = await getPathname(page)
    assertStartsWith("/r/", pathname)

    // Create an account
    // Create a profile
    
    // Edit the profile image
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
