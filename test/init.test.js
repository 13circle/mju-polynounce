"use strict";

const path = require("path");

require("module-alias/register");

require("dotenv").config({
  path: path.resolve(__dirname, "..", "test.env"),
});
