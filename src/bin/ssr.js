import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SSR here means Server-Side Rendering
 *
 */

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({dumpio: true});
  const page = await browser.newPage();

  const locales = ['fr', 'en']
  const routes = [
    {url: '/', name: 'h', selector: '#root-home'},
    {url: '/x', name: 'x', selector: '#root-x'},
  ]
  for (let i = 0; i < locales.length; i+=1) {
    let locale = locales[i]
    for (let j = 0; j < routes.length; j+=1) {
      let route = routes[i]
      const url = 'http://localhost:3000'+route.url+'?disablePreview=true&disableLazyLoading=true&locale='+locale
      await page.goto(url, {waitUntil: 'networkidle0'});
      const html = await page.$eval(route.selector, (element) => {
        return element.innerHTML
      })
      fs.writeFile(path.join(__dirname, "../../public/ssr/"+locale+"/"+route.name+".html"), html, () => {})
    }
  }

  await browser.close();
})();
