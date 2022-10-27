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
  const url = 'http://localhost:3000/'

  //await page.goto(url);
  await page.goto(url, {waitUntil: 'networkidle0'});
  //await page.waitFor('#rendered-home');
  // await page.waitForFunction('window.status === "ready"'); THIS DOES NOT WORK. DEPRECATED FEATURE
  //await page.waitFor('.trunk');
  const html = await page.$eval('#root-home', (element) => {
    return element.innerHTML
  })

  //const html = await page.evaluate((sel) => {
  //  console.log('sel', sel)
  //  return sel.innerHTML;
  //}, '#root-home');
  //let html = await page.content();
  await browser.close();

  fs.writeFile(path.join(__dirname, "../../public/homepage.html"), html, () => {})
})();
