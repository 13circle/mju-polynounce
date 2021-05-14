const express = require("express");

const auth = require("./auth");
//const anncmnt = require("./anncmnt");

const api = express.Router();

api.use("/auth", auth);
//api.use("/anncmnt", anncmnt);

module.exports = api;
