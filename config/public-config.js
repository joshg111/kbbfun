var cheerio = require('cheerio'); // Basically jQuery for node.js

var pConfig = {rp: {}};

pConfig.rp.USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36';

pConfig.rp.OPTIONS = {
  transform: function (body) {
      return cheerio.load(body);
  },
  headers: {
    'User-Agent': pConfig.rp.USER_AGENT
  },
  timeout: 6000
};

pConfig.rp.OPTIONS_BASIC = {
  headers: {
    'User-Agent': pConfig.rp.USER_AGENT
  },
  timeout: 12000
};

module.exports = pConfig;
