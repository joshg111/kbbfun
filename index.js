const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
var assert = require('assert');
var cheerio = require('cheerio'); // Basically jQuery for node.js
var rp = require('request-promise');
const pConfig = require("./config/public-config");
var fs = require('fs');


const OPTIONS = pConfig.rp.OPTIONS;
const OPTIONS_BASIC = pConfig.rp.OPTIONS_BASIC;


async function getApi() {
  var link = 'https://www.kbb.com/used-cars/';

  var api = null;
  var version = null;

  try {
    var body = await rp({...OPTIONS_BASIC, uri: link});

    api = /var assemblyVersion = "(.+)"/g.exec(body)[1];
    version = /var dataVersionId = "(.+)"/g.exec(body)[1];
  }
  catch(err) {
    console.log("getApi err = ", err);
    throw new Error(err);
  }

  assert(api);
  assert(version);
  return ({api, version});
}

async function getKbbMakesAndIds(year, api) {
  var link = 'https://www.kbb.com/Api/'+ api.api + '/' + api.version + '/vehicle/v1/Makes?vehicleClass=UsedCar&yearid=' + year;

  var body = await rp({...OPTIONS_BASIC, uri: link});
  var makes = JSON.parse(body);
  assert(makes);
  assert(makes.length > 0);
  return makes;
}

async function getKbbModels(year, make, api) {
  console.log("getting models");

  var link = 'https://www.kbb.com/Api/'+ api.api + '/' + api.version + '/vehicle/v1/Models?makeid=' + make.id + '&vehicleClass=UsedCar&yearid=' + year;

  var body = await rp({...OPTIONS_BASIC, uri: link});
  var models = JSON.parse(body);
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


// async function driver() {
//
//   // DRIVER
//   const api = await getApi();
//   const MIN_YEAR = 1992;
//   const MAX_YEAR = 2019;
//   var makesPerYearArr = [];
//
//   for (year = MIN_YEAR; year <= MAX_YEAR; year++) {
//     makesPerYearArr.push({year, makes: getKbbMakesAndIds(year, api)});
//     makes = getKbbMakesAndIds(year, api);
//
//   }
//
//   await Promise.all(makesPerYearArr.map(async (makesPerYearPromise) => {
//     var models = [];
//     var makesPerYear = await makesPerYearPromise;
//     var year = makesPerYear.year;
//
//     for (make of makesPerYear.makes) {
//       models.push({make, models: getKbbModels(year, make, api)});
//     }
//
//     var styles = [];
//     await Promise.all(models.map(async (modelPromise) => {
//       var data = await modelPromise;
//       styles.push({make: data.make, model: data.model, getKbbStyles(year, data.make, data.model)});
//     }));
//
//     await Promise.all(styles.map(async (stylePromise) => {
//       var style = await stylePromise;
//
//
//     }));
//   }));
// }



async function driver() {
  var stream = fs.createWriteStream("cars.txt", {flags:'a'});
  // DRIVER
  const api = await getApi();

  for (let year = 2016; year <= 2019; year++) {
    var res = [];
    var makes = await getKbbMakesAndIds(year, api);

    for (let make of makes) {
      var key = year + "." + make.name;
      var entry = {};
      entry[key] = [];
      var models = await getKbbModels(year, make, api);

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

