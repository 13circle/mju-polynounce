const passport = require("passport");

module.exports = passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: false,
});
