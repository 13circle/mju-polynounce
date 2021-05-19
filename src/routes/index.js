const express = require("express");

const main = require("./main");
const auth = require("./auth");
const anncmnt = require("./anncmnt");

const routes = express.Router();

routes.use("/", main);
routes.use("/auth", auth);
routes.use("/anncmnt", anncmnt);

module.exports = routes;
