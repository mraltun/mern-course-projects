// console.log(arguments);
// console.log(require("module").wrapper);

// module.exports
const C = require("./test-module-1");
const calc1 = new C();
console.log(calc1.add(2, 5));

// exports
const calc2 = require("./test-module-2");
const { add, multiply, divide } = require("./test-module-2");
console.log(calc2.add(2, 5));

// caching
// This will run "Hello from module" once because this module loaded once. The two "Second log"s comes from the cache.
require("./test-module-3")();
require("./test-module-3")();
require("./test-module-3")();
