const express = require("express");

// TODO: Import Middlewares

const authCtrl = require("./auth-ctrl");

const auth = express.Router();

auth.get("/login", authCtrl.loginPage);
auth.get("/edit", authCtrl.editPage);
auth.get("/register", authCtrl.registrationPage);

auth.post("/login", authCtrl.login);
auth.delete("/logout", authCtrl.logout);
auth.post("/register", authCtrl.register);
auth.put("/edit", authCtrl.edit);
auth.delete("/unregister", authCtrl.unregister);

module.exports = auth;

