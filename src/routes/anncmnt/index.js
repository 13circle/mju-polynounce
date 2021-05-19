const express = require("express");

// TODO: Import Middlewares

const anncmntCtrl = require("./anncmnt-ctrl");

const anncmnt = express.Router();

anncmnt.get("/lms-course/:kjkey", anncmntCtrl.lmsCourseAnncmnt);
anncmnt.get("/lms", anncmntCtrl.lmsAnncmnt);
anncmnt.get("/eclass-course/:courseNum", anncmntCtrl.eclassCourseAnncmnt);
anncmnt.get("/eclass", anncmntCtrl.eclassAnncmnt);

module.exports = anncmnt;
