const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const morgan = require("morgan");
const path = require("path");
const ejs = require("ejs");

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

app.set("views", path.resolve(__dirname, "view"));
app.set("view engine", "ejs");
app.engine("html", ejs.renderFile);

app.use("/static", express.static(path.resolve("src", "static")));

app.use("/", routes);

const port = PORT || 3000;

http.createServer(app).listen(port, () => {
  if (NODE_ENV === "development") {
    console.log(`Server listening to port ${port}`);
  }
});
