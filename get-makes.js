var rp = require('request-promise');
const pConfig = require("./config/public-config");
var assert = require('assert');
var fs = require('fs');

const OPTIONS_BASIC = pConfig.rp.OPTIONS_BASIC;

async function getKbbMakesAndIds(year, api) {
    var link = 'https://www.kbb.com/Api/'+ api.api + '/' + api.version + '/vehicle/v1/Makes?vehicleClass=UsedCar&yearid=' + year;

    var body = await rp({...OPTIONS_BASIC, uri: link});
    var makes = JSON.parse(body);
    assert(makes);
    assert(makes.length > 0);
    return makes;
}

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

async function driver() {
    var res = [];
    const api = await getApi();
    var stream = fs.createWriteStream("makes.txt", {flags:'a'});

    for (let year = 1992; year <= 2019; year++) {
        var makes = await getKbbMakesAndIds(year, api);
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
