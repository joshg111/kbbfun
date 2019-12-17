var cheerio = require('cheerio'); // Basically jQuery for node.js

var pConfig = {rp: {}};

// pConfig.rp.USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36';

// pConfig.rp.USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36';
pConfig.rp.USER_AGENT = 'curl/7.54.0';

var headers = {
  'origin': 'https://www.kbb.com',
  'accept-language': 'en-US,en;q=0.9',
  'User-Agent': pConfig.rp.USER_AGENT,
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'cors',
  'content-type': 'application/json',
  'accept': '*/*',
}

pConfig.rp.OPTIONS = {
  transform: function (body) {
      return cheerio.load(body);
  },
  headers: headers,
  timeout: 6000
};

pConfig.rp.OPTIONS_BASIC = {
  headers: headers,
  timeout: 12000
};

module.exports = pConfig;
