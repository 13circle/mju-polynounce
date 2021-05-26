const mysql = require("mysql2/promise");
const tunnel = require("tunnel-ssh");

class MyDBConnector {
  #mysqlConfig;
  #tunnelConfig;

  #useSSH;
  #mysqlPool;

  constructor(connectionLimit, queueLimit) {
    if (typeof connectionLimit === "number") {
      connectionLimit = parseInt(connectionLimit);
    } else {
      connectionLimit = 15;
    }

    if (typeof queueLimit === "number") {
      queueLimit = parseInt(queueLimit);
    } else {
      queueLimit = 30;
    }

    const {
      MYSQL_HOST,
      MYSQL_PORT,
      MYSQL_USER,
      MYSQL_PASSWORD,
      MYSQL_DATABASE,
      USE_SSH,
      SSH_HOST,
      SSH_PORT,
      SSH_USERNAME,
      SSH_PASSWORD,
      SSH_VALID_FORWARD_SRC_PORT,
    } = process.env;

    if (
      !MYSQL_HOST ||
      !MYSQL_PORT ||
      !MYSQL_USER ||
      !MYSQL_PASSWORD ||
      !MYSQL_DATABASE
    ) {
      throw Error(
        "Some of the following environment variables are not specified: \n" +
          "\t(1) MYSQL_HOST \n" +
          "\t(2) MYSQL_PORT \n" +
          "\t(3) MYSQL_USER \n" +
          "\t(4) MYSQL_PASSWORD \n" +
          "\t(5) MYSQL_DATABASE \n"
      );
    }

    this.#mysqlConfig = {
      host: MYSQL_HOST,
      port: parseInt(MYSQL_PORT),
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      connectionLimit,
      queueLimit,
    };

    if (USE_SSH === "true") {
      this.#tunnelConfig = {
        host: SSH_HOST,
        port: parseInt(SSH_PORT),
        username: SSH_USERNAME,
        password: SSH_PASSWORD,
        dstHost: MYSQL_HOST,
        dstPort: MYSQL_PORT,
        srcHost: "127.0.0.1",
        srcPort: parseInt(SSH_VALID_FORWARD_SRC_PORT),
        keepAlive: true,
      };

      this.#useSSH = true;
    } else {
      this.#tunnelConfig = null;

      this.#useSSH = false;
    }

    this.#mysqlPool = null;
  }

  initPool() {
    return new Promise((resolve, reject) => {
      if (this.#useSSH) {
        this.initSSHClient()
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        this.#mysqlPool = mysql.createPool(this.#mysqlConfig);

        if (this.#mysqlPool) {
          resolve();
        } else {
          reject(Error("No MySQL Pool"));
        }
      }
    });
  }

  initSSHClient() {
    return new Promise((resolve, reject) => {
      if (this.#useSSH) {
        tunnel(this.#tunnelConfig, (err, server) => {
          if (err) {
            reject(err);
          } else {
            this.#mysqlPool = mysql.createPool(this.#mysqlConfig);
            resolve();
          }
        });
      } else {
        reject(Error("This MyDBConnector does not use SSH"));
      }
    });
  }

  isUsingSSH() {
    return this.#useSSH;
  }

  getMysqlConfig() {
    return this.#mysqlConfig;
  }

  async getConnection() {
    if (!this.#mysqlPool.getConnection) return null;

    try {
      const conn = await this.#mysqlPool.getConnection();
      return conn;
    } catch (err) {
      throw err;
    }
  }

  startConnection(conn) {
    return new Promise((resolve, reject) => {
      if (conn.beginTransaction && this.#mysqlPool) {
        conn.beginTransaction();
        resolve();
      } else {
        reject(Error("Invalid MySQL connection or pool"));
      }
    });
  }

  async prepareQuery(conn, sql, inputs) {
    try {
      if (conn.query && this.#mysqlPool) {
        const [rows, fields] = await conn.query(sql, inputs);
        return { rows, fields };
      } else {
        throw Error("Invalid MySQL connection or pool");
      }
    } catch (err) {
      return err;
    }
  }

  applyQuery(conn) {
    return new Promise((resolve, reject) => {
      if (conn.commit && this.#mysqlPool) {
        conn.commit();
        resolve();
      } else {
        reject(Error("Invalid MySQL connection or pool"));
      }
    });
  }

  cancelQuery(conn) {
    return new Promise((resolve, reject) => {
      if (conn.rollback && this.#mysqlPool) {
        conn.rollback();
        resolve();
      } else {
        reject(Error("Invalid MySQL connection or pool"));
      }
    });
  }

  endConnection(conn) {
    return new Promise((resolve, reject) => {
      if (conn.release && this.#mysqlPool) {
        conn.release();
        resolve();
      } else {
        reject(Error("Invalid MySQL connection or pool"));
      }
    });
  }
}

module.exports = MyDBConnector;
