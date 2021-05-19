const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const morgan = require("morgan");

dotenv.config();

const { PORT, NODE_ENV } = process.env;

if (!NODE_ENV) {
  throw Error("NODE_ENV must be specified");
}

const app = express();

const routes = require("./routes");

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/", routes);

const port = PORT || 3000;

http.createServer(app).listen(port, () => {
  if (NODE_ENV === "development") {
    console.log(`Server listening to port ${port}`);
  }
});
