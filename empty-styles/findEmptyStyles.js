var getStyle = require('./getStyle');
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
var fs = require('fs');

// var writeStream = fs.createWriteStream("newCars.txt", {flags:'a'});

var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('newCars.txt')
});

lineReader.on('line', async function (line) {
    var entry = JSON.parse(line);
    var key = Object.keys(entry)[0];
    var styles = entry[key];

    for (var style of styles) {
        if (style.styleText.length === 0) {
            // console.log("style = ", style);
            // var newStyleText = await getStyle(style.href);
            // await setTimeoutPromise(500);
            // style.styleText = newStyleText;
            console.log("key = ", key);
            console.log("styleText = ", newStyleText);
        }
    }
    // writeStream.write(JSON.stringify(entry) + "\n");
});

lineReader.on('close', function () {
    console.log("Complete");
});

