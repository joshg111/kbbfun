var {hgetAsync, delAsync, redisClient} = require('./redis-client');

redisClient.on("ready", async function () {
    var res = await hgetAsync('kbbCarData', '2019.ram');
    console.log(res);

    res = await delAsync('kbbCarData');
    console.log(res);

    res = await hgetAsync('kbbCarData', '2019.ram');
    console.log(res);
});