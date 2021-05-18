const express = require("express");

const auth = require("./auth");
//const anncmnt = require("./anncmnt");

const routes = express.Router();

routes.use("/auth", auth);
//api.use("/anncmnt", anncmnt);

module.exports = routes;
