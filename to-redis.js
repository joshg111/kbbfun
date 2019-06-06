var {hsetAsync, redisClient} = require('./redis-client');

var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('empty-styles/newCars.txt')
});

var waitRedis = [];
lineReader.on('line', function (line) {
    var entry = JSON.parse(line);
    for (var key in entry) {
        waitRedis.push(hsetAsync('kbbCarData', key.toLowerCase(), JSON.stringify(entry[key])));
    }
});

lineReader.on('close', function () {
    console.log("Complete");
    Promise.all(waitRedis).then(() => console.log("Promises done"));
});


