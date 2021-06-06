const fs = require("fs");
const path = require("path");

const MySequelize = require("./config/MySequelize");

const models = [];

const currFile = path.basename(__filename);

fs.readdirSync(__dirname, { withFileTypes: true }).forEach((d) => {
  if (!d.isDirectory() && d.name !== currFile) {
    models.push(require(`./${d.name}`));
  }
});

models.sort((m1, m2) => m1.foreignKeyCnt - m2.foreignKeyCnt);

const db = new MySequelize();

function initDB() {
  return new Promise((resolve, reject) => {
    db.connect()
      .then((sequelize) => {
        models.forEach((model) => {
          model.initModel(sequelize);
        });
        db.sync()
          .then(() => {
            resolve(sequelize);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = initDB;
