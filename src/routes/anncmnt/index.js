const express = require("express");

const checkUser = require("@mw/check-user");
const checkEmailVerified = require("@mw/check-email-verified");

const anncmntCtrl = require("./anncmnt-ctrl");

const anncmnt = express.Router();

anncmnt.put("/set-display-board", checkUser, checkEmailVerified, anncmntCtrl.setDisplayBoard);

anncmnt.get("/mju-home", checkUser, checkEmailVerified, anncmntCtrl.mjuHomeAnncmnt);
anncmnt.get("/myiweb-courses", checkUser, checkEmailVerified, anncmntCtrl.myiwebRegCourses);
anncmnt.get("/myiweb-curr-grade", checkUser, checkEmailVerified, anncmntCtrl.myiwebCurrGrade);

anncmnt.get("/lms-courses", checkUser, checkEmailVerified, anncmntCtrl.lmsCourses);
anncmnt.get("/lms-course-anncmnt/:kjkey", checkUser, checkEmailVerified, anncmntCtrl.lmsCourseAnncmnt);
anncmnt.get("/lms-course-assignment/:kjkey", checkUser, checkEmailVerified, anncmntCtrl.lmsCourseAssignment);
anncmnt.get("/lms-anncmnt", checkUser, checkEmailVerified, anncmntCtrl.lmsAnncmnt);

anncmnt.get("/eclass-courses", checkUser, checkEmailVerified, anncmntCtrl.eclassCourses);
anncmnt.get("/eclass-course-anncmnt/:courseName", checkUser, checkEmailVerified, anncmntCtrl.eclassCourseAnncmnt);
anncmnt.get("/eclass-course-assignment/:courseName", checkUser, checkEmailVerified, anncmntCtrl.eclassCourseAssignment);

anncmnt.get("/jw4-dept-anncmnt", checkUser, checkEmailVerified, anncmntCtrl.jw4DeptAnncmnt);

module.exports = anncmnt;
