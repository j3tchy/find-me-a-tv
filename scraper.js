const fetch = require("node-fetch");
const jsdom = require("jsdom");
const nodemailer = require("nodemailer");
const { JSDOM } = jsdom;

const websites = require("./websites.json");

require('dotenv').config();

async function scrapeForTV(url, element) {
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
        "url": url,
        "price": currentPriceText
      }
      

    } catch (e) {
      console.error(e);
    }
}

const tvDetails = async () => {
  const websiteDetails = await websites.map(async ({ url, element }) => {
    const scraperDetails = await scrapeForTV(url, element);

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

tvDetails().then(tableData => {
  const content = tableData.reduce((prev, curr) => {
    return prev + '<tr><td>' + curr.url + '</td><td>' + curr.price + '</td></tr>'
  }, '')

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: process.env.RECEPIENT_EMAIL,
    subject: 'TV Updates',
    html: `
      <table border="1" width="75%">
        <tr>
          <th>URL</th>
          <th>Price</th>
        </tr>
        ${content}
      </table>
    `
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
});
