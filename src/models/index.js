const MySequelize = require("./config/MySequelize");

const models = [
  require("./User"),
  require("./ScraperCache"),
  require("./CacheNotification"),
  require("./CacheAssignment"),
];

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
