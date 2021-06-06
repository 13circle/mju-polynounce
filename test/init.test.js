"use strict";

const path = require("path");
const dotenv = require("dotenv");

require("module-alias/register");

dotenv.config();
dotenv.config({
  path: path.resolve(__dirname, "..", "test.env"),
});
