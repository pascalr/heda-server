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
  console.log('Expected: ', expected)
  console.log('Got: ', actual)
  console.log('Result: ', coloredResult(expected === actual))
}
function assertStartsWith(expected, actual) {
  console.log('Expected starts with: ', expected)
  console.log('Got: ', actual)
  console.log('Result: ', coloredResult(actual.startsWith(expected)))
}

(async () => {
  const browser = await puppeteer.launch({dumpio: true});
  const page = await browser.newPage();
  await page.setDefaultTimeout(5000);

  //const locales = ['fr', 'en']
  const locales = ['fr']
  for (let i = 0; i < locales.length; i++) {
    let locale = locales[i]

    // Load page
    const url = 'http://localhost:3000/?disablePreview=true&locale='+locale
    await page.goto(url, {waitUntil: 'networkidle0'});
    const html = await page.$eval('#root-home', (element) => {
      return element.innerHTML
    })
    fs.writeFile(path.join(__dirname, "../debug.html"), html, () => {})

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
  }

  await browser.close();
})();
