var rp = require('request-promise');
const pConfig = require("../config/public-config");
var cheerio = require('cheerio'); // Basically jQuery for node.js

const OPTIONS_BASIC = pConfig.rp.OPTIONS_BASIC;

async function getStyle(href) {
    try {
        var body = await rp({...OPTIONS_BASIC, uri: href});
        var $ = cheerio.load(body);
        var styleText = $('select#stylesDropdown option').attr('value');
    } catch(err) {
        console.log("Retrying href = ", href);
        return getStyle(href);
    }

    return styleText;
}

// getStyle('https://www.kbb.com/volkswagen/golf-r/2018/hatchback-sedan-4d/?vehicleid=434560&intent=buy-used&modalview=false&pricetype=private-party&condition=good');

module.exports = getStyle;