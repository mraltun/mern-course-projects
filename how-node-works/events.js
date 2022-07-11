// We need events module
const EventEmitter = require("events");
const http = require("http");

// Create Sales class that inherits everything from EventEmitter superclass. This is actually how many of core modules implements internally.
class Sales extends EventEmitter {
  constructor() {
    super();
  }
}

const myEmitter = new Sales();

// Setting up an event emitter here with the name "newSale". This is like event listener (for example: add event listener for a button)
myEmitter.on("newSale", () => {
  console.log("There was a new sale");
});

// We can set up multiple listeners for the same event. We can use additional parameters. The listeners for same event will run synchorously.
myEmitter.on("newSale", (stock) => {
  console.log(`There are now ${stock} items left`);
});

// We emit the "newSale" event. (for example: this is the button clicked event). We can use additional arguments.
myEmitter.emit("newSale", 9);

////////////////////////////////
////////////////////////////////

const server = http.createServer();

// .on is for listening an event. We listen for "request" event.
server.on("request", (req, res) => {
  console.log("Request received!");
  res.end("Request received");
});

// We can listen multiple times for same event
server.on("request", (req, res) => {
  console.log("Another request");
});

// This listener is for "close" event
server.on("close", () => {
  console.log("Server closed");
});

// Start the server
server.listen(8000, "127.0.0.1", () => {
  console.log("Waiting for requests..");
});
