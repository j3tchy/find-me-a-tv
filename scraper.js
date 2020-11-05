const fetch = require("node-fetch");
const jsdom = require("jsdom");
const nodemailer = require("nodemailer");
const { JSDOM } = jsdom;

const websites = require("./websites.json");

require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASS
  }
});


async function scrapeForTV(url, element) {
  try {
      const response = await fetch(url);
      const text = await response.text();
      const dom = await new JSDOM(text);
      const currentPrice = dom.window.document.querySelector(element);

      if (currentPrice === null) {
        return console.log(`Unable to retrieve price from ${url}`)
      }

      const currentPriceText = currentPrice.textContent;
      const stripOutPoundSign = currentPriceText.replace(/£/gm, "");
      const price = Number(stripOutPoundSign.split('.')[0]);

      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: process.env.RECEPIENT_EMAIL,
        subject: 'TV Updates',
        text: `${url}: ${currentPriceText}`
      };
      

      if (price < 799) {
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      }
    } catch (e) {
      console.error(e);
    }

    return "here";
}

websites.forEach(({ url, element }) => scrapeForTV(url, element));
