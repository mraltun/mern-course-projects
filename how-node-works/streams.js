const fs = require("fs");
// This is nice trick for creating a server
const server = require("http").createServer();

// Listen for the request event.
server.on("request", (req, res) => {
  // Solution 1 is terrible for big files because Node will load entire file in the memory then send to client whole data.
  //   fs.readFile("test-file.txt", (error, data) => {
  //     if (error) console.log(error);
  //     res.end(data);
  //   });
  // Solution 2 with Streams - This will have "backpressure" problem!
  // Create readable stream from data in the file.
  //   const readable = fs.createReadStream("test-file.txt");
  // Readable stream emits data event when there is new data to consume. We access that data with chunk parameter.
  //   readable.on("data", (chunk) => {
  // Response is a writable stream. We use write method to send data in chunks. We basically stream the data from file to client
  // res.write(chunk);
  //   });
  // Listener for the "end" event.
  //   readable.on("end", () => {
  // Signal for no more data will be written to this writable stream. Also no parameters because we already sent the data
  // res.end();
  //   });
  // Error handling
  //   readable.on("error", (error) => {
  //     console.log(error);
  //     res.statusCode = 500;
  //     res.end("File not found!");
  //   });

  // Solution 3 - Solving backpressure with pipe method
  const readable = fs.createReadStream("test-file.txt");
  // readableSource.pipe(writableDestination). This will control the speed of data coming in and going out.
  readable.pipe(res);
});

server.listen(8000, "127.0.0.1", () => {
  console.log("Listening");
});
