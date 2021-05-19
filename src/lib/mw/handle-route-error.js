const path = require("path");

module.exports = (req, res, next) => {
  res.status(404).render("404.html");
};
