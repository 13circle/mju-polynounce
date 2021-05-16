const express = require("express");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

const { PORT, NODE_ENV } = process.env;

if (!NODE_ENV) {
  throw Error("NODE_ENV must be specified");
}

const app = express();

const api = require("./api");
const main = require("./main");

app.use("/api", api);
app.use("/", main);

const port = PORT || 3000;

http.createServer(app).listen(port, () => {
  if (NODE_ENV === "development") {
    console.log(`Server listening to port ${port}`);
  }
});
