// File System for reading and writing files.
const fs = require("fs");
// Networking capabilities (like building a server),
const http = require("http");
// url for Routing
const url = require("url");
// Slug
const slugify = require("slugify");

const replaceTemplate = require("./modules/replaceTemplate");

/////////////////////////////////////////////////////////////////////////////////
/// FILES

// Blocking, Synchoronous Way (AVOID):

// Read the file synchronously. It takes two arguments: path of the file, character encoding.
const textIn = fs.readFileSync("./txt/input.txt", "utf-8");

const textOut = `This is what we know about the avocado: ${textIn}.n\Created on ${Date.now()}`;

// Write the file synchronously. It takes two arguments: path of the file, what to write.
fs.writeFileSync("./txt/output.txt", textOut);
console.log("File written!");

// Non-blocking, Asynchoronous Way:

// Read the file asynchoronously. Which file to read, encoding, and callback function. Callback fn returns error first (if there is any) then the data. This is also callback hell we gonna replace it with async/await
fs.readFile("./txt/start.txt", "utf-8", (error, data) => {
  if (error) return console.log("Error!");
  console.log(data);
  fs.readFile(`./txt/${data}.txt`, "utf-8", (error, data1) => {
    console.log(data1);
    fs.readFile("./txt/append.txt", "utf-8", (error, data2) => {
      console.log(data2);
      // Write the file asynchoronously. Which file to write, what to write, encoding and callback function.
      fs.writeFile(
        "./txt/final.txt",
        `${data1}\n${data2}`,
        "utf-8",
        (error) => {
          console.log("Your file has been written");
        }
      );
    });
  });
});
console.log("This line is first");

/////////////////////////////////////////////////////////////////////////////////
/// SERVER

// This is top level so it's going to be run once and won't block. We can use synchoronous.
const tempOverview = fs.readFileSync(
  `${__dirname}/templates/template-overview.html`,
  "utf-8"
);
const tempCard = fs.readFileSync(
  `${__dirname}/templates/template-card.html`,
  "utf-8"
);
const tempProduct = fs.readFileSync(
  `${__dirname}/templates/template-product.html`,
  "utf-8"
);

// Directory name is where the file currently located
const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, "utf-8");
// Turn into JS object
const dataObj = JSON.parse(data);

// Slug the product names "Baby Carrots > baby-carrots"
const slugs = dataObj.map((el) => slugify(el.productName, { lower: true }));

// The callback function will be fired whenever we get a new request to server. It takes two important parameters, request and response.
const server = http.createServer((req, res) => {
  // Get the current route from url object ("/products?id=0", "id:0" is query object , "/products" is the pathname). "true" parameter makes query an object "query: {id:'0'}"".
  const { query, pathname } = url.parse(req.url, true);

  // Overview Page
  if (pathname === "/" || pathname === "/overview") {
    res.writeHead(200, {
      "Content-type": "text/html",
    });

    // Loop over the fetched array and replace placeholders with current card elements inside of that array and join it to become one single string element.
    const cardsHtml = dataObj
      .map((element) => replaceTemplate(tempCard, element))
      .join("");

    const output = tempOverview.replace("{%PRODUCT_CARDS%}", cardsHtml);
    res.end(output);

    // Product Page
  } else if (pathname === "/product") {
    res.writeHead(200, {
      "Content-type": "text/html",
    });
    // Retrieve the element from dataObj with same query id (0,1,2 etc..)
    const product = dataObj[query.id];
    // Replace the placeholder info on template-product file with new the data we retrived above
    const output = replaceTemplate(tempProduct, product);

    res.end(output);

    // API
  } else if (pathname === "/api") {
    // Send header
    res.writeHead(200, {
      "Content-type": "application/json",
    });
    res.end(data);

    // Not Found Page
  } else {
    // Send HTTP header (response headers). Set it before response content (like res.end)
    res.writeHead(404, {
      "Content-type": "text/html",
    });
    res.end("<h1>Page not found!</h1>");
  }

  res.end("Hello from the server");
});

// First parameter is the port, second is server address, callback function.
server.listen(8000, "127.0.0.1", () => {
  console.log("Listening to requests on port 8000");
});
