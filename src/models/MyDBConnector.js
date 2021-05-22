const mysql = require("mysql2/promise");
const { Client } = require("ssh2");

class MyDBConnector {
  #sshClient;
  #mysqlConfig;
  #tunnelConfig;
  #portForwardConfig;

  #useSSH;
  #sshStream;
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
      this.#sshClient = new Client();

      this.#tunnelConfig = {
        host: SSH_HOST,
        port: parseInt(SSH_PORT),
        username: SSH_USERNAME,
        password: SSH_PASSWORD,
      };

      this.#portForwardConfig = {
        srcHost: this.#mysqlConfig.host,
        srcPort: parseInt(SSH_VALID_FORWARD_SRC_PORT),
        destHost: "127.0.0.1",
        destPort: this.#mysqlConfig.port,
      };

      this.#useSSH = true;
    } else {
      this.#tunnelConfig = null;
      this.#portForwardConfig = null;

      this.#useSSH = false;
    }

    this.#mysqlPool = null;
  }

  initPool() {
    return new Promise((resolve, reject) => {
      if (this.#useSSH) {
        this.#initSSHClient()
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

  #initSSHClient() {
    return new Promise((resolve, reject) => {
      if (this.#useSSH) {
        this.#sshClient
          .on("ready", () => {
            const { srcHost, srcPort, destHost, destPort } =
              this.#portForwardConfig;

            this.#sshClient.forwardOut(
              srcHost,
              srcPort,
              destHost,
              destPort,
              (err, stream) => {
                if (err) {
                  reject(err);
                } else {
                  this.#mysqlPool = mysql.createPool({
                    ...this.#mysqlConfig,
                    stream,
                  });
                  this.#sshStream = stream;

                  resolve();
                }
              }
            );
          })
          .on("error", (err) => {
            this.#sshClient.destroy();

            if (reject) {
              reject(err);
            } else {
              throw err;
            }
          })
          .connect(this.#tunnelConfig);
      } else {
        reject(Error("This MyDBConnector does not use SSH"));
      }
    });
  }

  isUsingSSH() {
    return this.#useSSH;
  }

  getMysqlConfig() {
    if (this.#useSSH) {
      return {
        ...this.#mysqlConfig,
        stream: this.#sshStream,
      };
    }

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
    if (conn.beginTransaction && this.#mysqlPool) {
      conn.beginTransaction();
    }
  }

  async prepareQuery(conn, sql, inputs) {
    try {
      if (conn.query && this.#mysqlPool) {
        const [rows, fields] = await conn.query(sql, inputs);
        return { rows, fields };
      }
    } catch (err) {
      return err;
    }
  }

  applyQuery(conn) {
    if (conn.commit && this.#mysqlPool) {
      conn.commit();
    }
  }

  cancelQuery(conn) {
    if (conn.rollback && this.#mysqlPool) {
      conn.rollback();
    }
  }

  endConnection(conn) {
    if (conn.release && this.#mysqlPool) {
      conn.release();
    }
  }

  async refreshPool() {
    try {
      if (this.#mysqlPool) {
        if (this.#useSSH) {
          await this.refreshSSHClient();
        } else {
          await this.endPool();
          this.#mysqlPool = mysql.createPool(this.#mysqlConfig);
        }
      }
    } catch (err) {
      throw err;
    }
  }

  async endPool() {
    try {
      if (this.#mysqlPool) {
        await this.#mysqlPool.end();
      }
    } catch (err) {
      throw err;
    }
  }

  async refreshSSHClient() {
    try {
      if (this.#useSSH) {
        await this.endSSHClient();
        await this.initPool();
      }
    } catch (err) {
      throw err;
    }
  }

  async endSSHClient() {
    try {
      if (this.#useSSH) {
        await this.#mysqlPool.end();
        this.#sshClient.destroy();
      }
    } catch (err) {
      throw err;
    }
  }
}

module.exports = MyDBConnector;
