import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({dumpio: true});
  const page = await browser.newPage();

  const locales = ['fr', 'en']
  for (let i = 0; i < locales.length; i++) {
    let locale = locales[i]
    const url = 'http://localhost:3000/?disablePreview=true&disableLazyLoading=true&locale='+locale
    await page.goto(url, {waitUntil: 'networkidle0'});
    const html = await page.$eval('#root-home', (element) => {
      return element.innerHTML
    })
    fs.writeFile(path.join(__dirname, "../../public/homepage_"+locale+".html"), html, () => {})
  }

  await browser.close();
})();
