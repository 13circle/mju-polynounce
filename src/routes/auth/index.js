const express = require("express");

const passportAuth = require("@mw/passport-auth");
const checkUser = require("@mw/check-user");
const checkEmailVerified = require("@mw/check-email-verified");

const authCtrl = require("./auth-ctrl");

const auth = express.Router();

auth.get("/login", authCtrl.loginPage);
auth.get("/edit", checkUser, authCtrl.editPage);
auth.get("/register", authCtrl.registrationPage);
auth.get("/confirm-email/:token", authCtrl.emailConfirmPage);
auth.get("/reset-password/:token", authCtrl.passwordResetPage);

auth.post("/login", passportAuth, checkEmailVerified, authCtrl.login);
auth.delete("/logout", checkUser, authCtrl.logout);
auth.post("/register", authCtrl.register);
auth.post("/confirm-email/:token", authCtrl.confirmEmail);
auth.put("/edit", checkUser, checkEmailVerified, authCtrl.edit);
auth.put("/edit-setting", checkUser, checkEmailVerified, authCtrl.editSetting);
auth.post("/send-password-reset", checkUser, checkEmailVerified, authCtrl.sendPasswordReset);
auth.put("/reset-password/:token", authCtrl.resetPassword);
auth.delete("/unregister", checkUser, authCtrl.unregister);

module.exports = auth;
