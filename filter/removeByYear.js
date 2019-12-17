var fs = require('fs');

const REMOVE_YEAR = [2019];

var writeStream = fs.createWriteStream("removeByYear.txt", {flags:'a'});

var lineReader = require('readline').createInterface({
    input: fs.createReadStream('unfilteredCars.txt')
});

lineReader.on('line', async function (line) {
    var entry = JSON.parse(line);
    var key = Object.keys(entry)[0];
    var year = parseInt(key.split('.')[0], 10);
    if (!REMOVE_YEAR.includes(year)) {
      writeStream.write(JSON.stringify(entry) + "\n");
    }
    
});

lineReader.on('close', function () {
    console.log("Complete");
});

