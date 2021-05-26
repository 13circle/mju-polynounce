const { Sequelize } = require("sequelize");
const tunnel = require("tunnel-ssh");

class MySequelize {
  #useSSH;
  #tunnelConfig;

  #sequelize;
  #sequelizeConfig;
  #mysqlConfig;

  constructor(minPool, maxPool, maxIdlePoolTime) {
    if (typeof minPool !== "number") {
      minPool = 0;
    }

    if (typeof maxPool !== "number") {
      maxPool = 10;
    }

    if (typeof maxIdlePoolTime !== "number") {
      maxIdlePoolTime = 20000;
    }

    const {
      MYSQL_HOST,
      MYSQL_PORT,
      MYSQL_USER,
      MYSQL_PASSWORD,
      MYSQL_DATABASE,
      USE_SSH,
    } = process.env;

    if (
      !MYSQL_HOST ||
      !MYSQL_PORT ||
      !MYSQL_USER ||
      !MYSQL_PASSWORD ||
      !MYSQL_DATABASE ||
      !USE_SSH
    ) {
      throw Error(
        "Some of the following environment variables are not specified: \n" +
          "\t(1) MYSQL_HOST \n" +
          "\t(2) MYSQL_PORT \n" +
          "\t(3) MYSQL_USER \n" +
          "\t(4) MYSQL_PASSWORD \n" +
          "\t(5) MYSQL_DATABASE \n" +
          "\t(6) USE_SSH \n"
      );
    }

    this.#sequelizeConfig = {
      dialect: "mysql",
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      username: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      pool: {
        max: maxPool,
        min: minPool,
        idle: maxIdlePoolTime,
      },
      define: {
        freezeTableName: true,
      },
      logging: false,
    };

    this.#mysqlConfig = {
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
    };

    this.#sequelize = new Sequelize(this.#sequelizeConfig);

    this.#useSSH = USE_SSH === "true";

    if (this.#useSSH) {
      const {
        SSH_HOST,
        SSH_PORT,
        SSH_USERNAME,
        SSH_PASSWORD,
        SSH_VALID_FORWARD_SRC_PORT,
      } = process.env;

      this.#tunnelConfig = {
        host: SSH_HOST,
        port: SSH_PORT,
        username: SSH_USERNAME,
        password: SSH_PASSWORD,
        dstHost: MYSQL_HOST,
        dstPort: MYSQL_PORT,
        srcHost: "127.0.0.1",
        srcPort: parseInt(SSH_VALID_FORWARD_SRC_PORT),
        keepAlive: true,
      };
    } else {
      this.#tunnelConfig = null;
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.#useSSH) {
        tunnel(this.#tunnelConfig, (err, server) => {
          if (err) {
            reject(err);
          } else {
            this.authenticate()
              .then(() => {
                resolve(this.#sequelize);
              })
              .catch((err) => {
                reject(err);
              });
          }
        });
      } else {
        this.authenticate()
          .then(() => {
            resolve(this.#sequelize);
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  }

  authenticate() {
    return new Promise((resolve, reject) => {
      this.#sequelize
        .authenticate()
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getSequelizeConfig() {
    return this.#sequelizeConfig;
  }

  getMySqlConfig() {
    return this.#mysqlConfig;
  }

  sync() {
    return new Promise((resolve, reject) => {
      const syncConfig =
        process.env.NODE_ENV === "development"
          ? { alter: true, force: true }
          : {};
      this.#sequelize
        .sync(syncConfig)
        .then((sequelize) => {
          resolve(sequelize);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

module.exports = MySequelize;
