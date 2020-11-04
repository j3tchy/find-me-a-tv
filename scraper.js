const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const websites = require("./websites.json");

async function scrapeForTV(url, element) {
  try {
      const response = await fetch(url);
      const text = await response.text();
      const dom = await new JSDOM(text);
      const currentPrice = dom.window.document.querySelector(element).textContent;

      const stripOutPoundSign = currentPrice.replace(/£/gm, "");
      const price = Number(stripOutPoundSign.split('.')[0]);

      if (price < 799) {
        console.log(url, price);
      }
    } catch (e) {
      console.error(e);
    }
}

websites.forEach(({ url, element }) => scrapeForTV(url, element));
