var rp = require('request-promise');
const pConfig = require("./config/public-config");
var assert = require('assert');
var fs = require('fs');

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


async function driver() {
    var res = [];
    var stream = fs.createWriteStream("makes.txt", {flags:'a'});

    for (let year = 2019; year <= 2020; year++) {
        var makes = await getKbbMakesAndIds(year);
        var entry = {};
        entry[year] = makes;
        res.push(JSON.stringify(entry));
    }

    for (let make of res) {
        stream.write( make + "\n");
    }
    stream.end();
}

driver().then(() => console.log("done"));
