const express = require("express");
const http = require("http");

const app = express();

const api = require("./api");
const main = require("./main");

app.use("/api", api);
app.use("/", main);

http.createServer(app).listen(3000, () => {
  console.log("Server listening to port 3000");
});
