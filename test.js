const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
var fs = require('fs');


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// console.log(getRandomInt(3));


var arr = [];

for (var i = 0; i < 10; i++) {
  arr.push(setTimeoutPromise(getRandomInt(5) * 1000, 'foobar'));
}

async function foo() {
  await Promise.all(arr.map(async (item) => {
   await item;
   console.log("done");
  }));

  console.log("hi");
}

// foo();



///////////////////////////////

async function driver() {
  var res = [];
  var makes = [setTimeoutPromise(2000, 'a'), setTimeoutPromise(2000, 'aa')];

  await Promise.all(makes.map(async (aPromise) => {
    var aResolve = await aPromise;
    console.log(aResolve);
    var models = [setTimeoutPromise(3000, 'b'), setTimeoutPromise(2000, 'bb')]

    await Promise.all(models.map(async (bPromise) => {
      var bResolve = await bPromise;
      console.log(bResolve);
      var styles = [setTimeoutPromise(4000, 'c'), setTimeoutPromise(4000, 'cc')];

      await Promise.all(styles.map(async (cPromise) => {
        var cResolve = await cPromise;
        console.log(cResolve);
        console.log("Car - ", aResolve, bResolve, cResolve);
        res.push({make: aResolve, model: bResolve, style: cResolve});
      }));
    }));
  }));

  return res;
}

// driver().then((res) => {
//   console.log("res = ", res);
// })

// async function testAwait() {
//   await setTimeoutPromise(2000, 'a');
//   console.log("hi");
// }
//
// function testFunctionAwait() {
//   testAwait();
//   testAwait();
//   console.log("a");
// }
//
// testFunctionAwait();
// console.log("here");


// [1,2,3].map((num) => {
//   [1,2,3].map((a) => {
//     console.log(num);
//   })
// })

// var stream = fs.createWriteStream("cars.txt", {flags:'a'});
// stream.write("hi\n");
// stream.end();

var {hgetAsync, redisClient} = require('./redis-client');

redisClient.on("ready", async function () {
  var res = await hgetAsync('kbbCarData', '2019.subaru');
  console.log(res);
});

