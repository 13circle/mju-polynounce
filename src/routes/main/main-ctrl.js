const mainCtrl = {};

mainCtrl.homePage = (req, res) => {
  res.status(200).render("home.html");
};

module.exports = mainCtrl;
