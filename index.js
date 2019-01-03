const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
var assert = require('assert');
var cheerio = require('cheerio'); // Basically jQuery for node.js
var rp = require('request-promise');
const pConfig = require("./config/public-config");

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
        .replace(/&/g, '') +
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

  // DRIVER
  const api = await getApi();
  const MIN_YEAR = 1992;
  const MAX_YEAR = 2019;

  // 12/30/18 - Adding a single year to the array for testing purposes.
  var years = [2018];
  var res = {};

  // 12/30/18 - Comment out for testing purposes.
  // for (year = MIN_YEAR; year <= MAX_YEAR; year++) {
  //   years.push(year);
  // }

  // await Promise.all(years.map(async (year) => {
  for (year = MIN_YEAR; year <= MAX_YEAR; year++) {
    // 12/30/18 - Comment out for testing purposes.
    var makes = await getKbbMakesAndIds(year, api);
    // var makes = [{"id":49,"name":"Toyota"}];

    // await Promise.all(makes.map(async (make) => {
    for (let make of makes) {
      var key = year + "." + make.name;
      res[key] = [];
      var models = await getKbbModels(year, make, api);

      // Make getKbbStyles synchronous to ease resources.
      for (let model of models) {
        var styles = await getKbbStyles(year, make, model);

        styles.map((style) => {
          res[key].push({model: model.name, styleText: style.text, href: style.href});
        });
      }

      // models.map((model) => {
      //   var styles = await getKbbStyles(year, make, model);
      //
      //   styles.map((style) => {
      //     res[key].push({model: model.name, styleText: style.text, href: style.href});
      //   });
      // });
    }
  }

  return res;
}

driver().then((cars) => {
  console.log(cars);
  // console.log("done");
})

// https://www.kbb.com/Api/3.9.269.0/67873/vehicle/v1/Makes?vehicleClass=UsedCar
// https://www.kbb.com/Api/3.9.269.0/67873/vehicle/v1/Models?makeid=49&vehicleClass=UsedCar

// https://www.kbb.com/Api/3.9.269.0/67873/vehicle/v1/Styles?makeid=49modelid=290&vehicleClass=UsedCar
// https://www.kbb.com/toyota/camry/2014/styles/?intent=buy-used
// https://www.kbb.com/vehicles/path/_classifiedsentry/?yearid=2014&modelid=286&intent=buy-used&vehicleid=0
