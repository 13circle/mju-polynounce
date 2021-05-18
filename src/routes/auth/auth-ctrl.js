const path = require("path");

const authCtrl = {};

authCtrl.loginPage = (req, res) => {
  res
    .status(200)
    .sendFile(
      path.resolve(__dirname, "..", "..", "view", "auth", "login.html")
    );
};

authCtrl.editPage = (req, res) => {
  res
    .status(200)
    .sendFile(path.resolve(__dirname, "..", "..", "view", "auth", "edit.html"));
};

authCtrl.registrationPage = (req, res) => {
  res
    .status(200)
    .sendFile(
      path.resolve(__dirname, "..", "..", "view", "auth", "register.html")
    );
};

authCtrl.login = (req, res) => {
  res.status(200).send("POST .../auth/login");
};

authCtrl.logout = (req, res) => {
  res.status(200).send("DELETE .../auth/logout");
};

authCtrl.register = (req, res) => {
  res.status(200).send("POST .../auth/register");
};

authCtrl.edit = (req, res) => {
  res.status(200).send("PUT .../auth/edit");
};

authCtrl.unregister = (req, res) => {
  res.status(200).send("DELETE .../auth/unregister");
};

module.exports = authCtrl;
