const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
var assert = require('assert');
var cheerio = require('cheerio'); // Basically jQuery for node.js
var rp = require('request-promise');
const pConfig = require("./config/public-config");
var fs = require('fs');
var getEmptyStyle = require('./empty-styles/getStyle');


const OPTIONS = pConfig.rp.OPTIONS;
const OPTIONS_BASIC = pConfig.rp.OPTIONS_BASIC;

async function getKbbMakesAndIds(year) {
  console.log("getKbbMakesAndIds");
  var link = 'https://www.kbb.com/vehicleapp/api/'

  var payload = {
    "operationName":"MAKES_QUERY",
    "variables":{
      "vehicleClass":"usedcar",
      "vehicleType":"used",
      "year": year
    },
    "extensions":{
      "persistedQuery":{
        "version":1,
        "sha256Hash":"5e9f49f68dfa81f9251ddd7a1a958bebb65ea982a34b7860cf47f47043f1901f"
      }
    }
  };

  try {
    var body = await rp({...OPTIONS_BASIC, uri: link, method: 'POST', 
      body: payload,
      json: true
    });
  } catch(err) {
    console.log(err);
  }
  var makes = body.data.makes;
  assert(makes);
  assert(makes.length > 0);
  return makes;
}

async function getKbbModels(year, make) {
  console.log("getting models");

  var link = 'https://www.kbb.com/vehicleapp/api/'

  var payload = {
    "operationName":"MODELS_QUERY",
    "variables":{
      "vehicleClass":"usedcar",
      "vehicleType":"used",
      "year": year,
      "make": make.id
    },
    "extensions":{
      "persistedQuery":{
        "version":1,
        "sha256Hash":"2e7f89c39a5e92eecfe7c82bc4fb797c718952bb33b070be36d6d9be68eab163"
      }
    }
  };

  var body = await rp({...OPTIONS_BASIC, uri: link, method: 'POST',
    body: payload,
    json: true
  });
  
  var models = body.data.models;
  
  assert(models);
  assert(models.length > 0);

  return models;
}

async function getStyleList(rsp) {

  var $ = cheerio.load(rsp.body);

  var styleLinks = $('a.style-link').get();
  var styleList = [];
  for(var style of styleLinks) {
    styleList.push({text: $(style).find("div.button-header").text(), href: $(style).attr('href')});
  }

  assert(styleList.length > 0);

  return styleList;
}

async function getKbbStyles(year, make, model, retry=true) {
  console.log("get kbb styles");
  // Return - A link to the next kbb page after choosing the style.
  var res = null;
  var styles = [];

  try {

    var link = 'https://www.kbb.com/' +
      make.name.toLowerCase().replace(/ /gi, '-') +
      '/' + model.name.toLowerCase().replace(/ /gi, '-')
        .replace(/[\(|\)]/g, '')
        .replace(/&/g, '')
        .replace(/\./g, '')
        .replace(/\//g, '-') +
      '/' + year + '/styles/?intent=buy-used';

    var rsp = await rp({...OPTIONS_BASIC, resolveWithFullResponse: true, uri: link});
    var requestUri = rsp.request.uri.path;

    if(!requestUri.includes("styles")) {
      // In this case, there is no style to match. Kbb redirected us to the
      // options page which is where the style links take us. At the end of the
      // function we construct the price link.
      styles = [{text: '', href: requestUri}]
    }
    else {
      styles = await getStyleList(rsp);
    }

    for (style of styles) {
      let styleHref = style.href;
      styleHref = styleHref.replace(/\/options/g, "");
      styleHref = 'https://www.kbb.com' + styleHref + '&pricetype=private-party&condition=good';
      styleHref = styleHref.replace(/&mileage=\d*/g, "");
      style.href = styleHref;
      if (style.text === "") {
        var newStyleText = await getEmptyStyle(style.href)
        style.text = newStyleText;
        console.log("Found empty style = ", style.href);
      }
    }
  }
  catch(err) {
    console.log("getKbbStyle = ", err);
    if (retry) {
      return getKbbStyles(year, make, model, false);
    }
    throw new Error(err);
  }
  // console.log("getKbbStyle res = ", styles);
  return styles;
}

async function driver() {
  var stream = fs.createWriteStream("testWithEmptyStyles.txt", {flags:'a'});
  // DRIVER

  for (let year = 2020; year <= 2020; year++) {
    var res = [];
    var makes = await getKbbMakesAndIds(year);

    for (let make of makes) {
      var key = year + "." + make.name;
      var entry = {};
      entry[key] = [];
      var models = await getKbbModels(year, make);

      for (let model of models) {
        var styles = await getKbbStyles(year, make, model);

        await Promise.all(styles.map(async (style) => {
          await setTimeoutPromise(1000);
          entry[key].push({model: model.name, styleText: style.text, href: style.href});
        }));
      }

      var entryStr = JSON.stringify(entry);
      res.push(entryStr)
    }

    for (let car of res) {
      stream.write( car + "\n");
    }
    console.log("wrote year: ", year);
  }

  stream.end();
}

driver().then(() => {
  console.log("success");
});

module.exports = {getKbbMakesAndIds};