const cron = require("node-cron");
const fetch = require("node-fetch");
const jsdom = require("jsdom");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const { JSDOM } = jsdom;

const scrapper = require("./scrapper.json");

require('dotenv').config();

console.log("Initialised scrapping tool");

async function scrapeForTV(url, element, retailer) {
  console.log(`Scrapping website: ${retailer}`);

  try {
      const response = await fetch(url);
      const text = await response.text();
      const dom = await new JSDOM(text);
      const currentPrice = dom.window.document.querySelector(element);

      if (currentPrice === null) {
        return console.log(`Unable to retrieve price from ${url}`)
      }

      const currentPriceText = currentPrice.textContent.trim();

      return {
        "retailer": retailer,
        "url": url,
        "price": currentPriceText
      }
    } catch (e) {
      console.error(e);
    }
}

const tvDetails = async () => {
  const websiteDetails = await scrapper.websites.map(async ({ url, element, retailer }) => {
    const scraperDetails = await scrapeForTV(url, element, retailer);

    return scraperDetails;
  })

  return Promise.all(websiteDetails);
}

const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASS
  }
});

const options = {
  viewEngine: {
    layoutsDir: __dirname + "/views/layouts",
    extname: ".hbs"
  },
  extName: ".hbs",
  viewPath: "views"
};

transporter.use("compile", hbs(options));

cron.schedule('0 */4 * * *', () => {
  tvDetails().then(tableData => {
    const productDetails = {
      name: scrapper.product,
      websiteData: tableData,
    }

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: process.env.RECEPIENT_EMAIL,
      subject: `Alert | ${productDetails.name}`,
      template: "scrapperLinks",
      context: productDetails,
    };
  
    transporter.sendMail(mailOptions, function(error, info){
      const date = Date(Date.now()).toString();

      if (error) {
        console.log(date + ' ' + error);
      } else {
        console.log(date + ' - Email sent: ' + info.response);
      }
    });
  });
});