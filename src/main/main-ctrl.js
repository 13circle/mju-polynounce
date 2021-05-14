const path = require("path");

const mainCtrl = {};

mainCtrl.homePage = (req, res) => {
  res.status(200).sendFile(path.resolve(__dirname, "..", "view", "home.html"));
};

module.exports = mainCtrl;
