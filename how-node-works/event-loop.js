const fs = require("fs");
const crypto = require("crypto");

// Timer to test thread pool times
const start = Date.now();
// Setting up Thread Pool threads up to 128. Problematic in Windows.
process.env.UV_THREADPOOL_SIZE = 1;

// This will be the 2nd
setTimeout(() => console.log("Timer 1 finished"), 0);
// This will be the 3rd
setImmediate(() => console.log("Immediate 1 finished"));

fs.readFile("./test-file.txt", () => {
  // This will be the 4th
  console.log("I/O finished");
  console.log("------next-part-below-------");

  // This will be the 3rd
  setTimeout(() => console.log("Timer 2 finished"), 0);
  setTimeout(() => console.log("Timer 3 finished"), 3000);
  // This will be the 2nd
  setImmediate(() => console.log("Immediate 2 finished"));

  // This will be the 1st
  process.nextTick(() => console.log("Process.nextTick"));

  // This will be the 4th
  // Thread pool (Default is 4 threads). They will run async.
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () =>
    console.log(Date.now() - start, "Password encrypted")
  );
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () =>
    console.log(Date.now() - start, "Password encrypted")
  );
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () =>
    console.log(Date.now() - start, "Password encrypted")
  );
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () =>
    console.log(Date.now() - start, "Password encrypted")
  );
});

// This will be the 1st
console.log("Hello from top-level code!");
