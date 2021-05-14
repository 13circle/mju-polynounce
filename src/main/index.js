const express = require("express");

const mainCtrl = require("./main-ctrl");

const main = express.Router();

main.get("/", mainCtrl.homePage);

module.exports = main;
