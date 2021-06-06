const Oxen = require("oxen-queue");

const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } =
  process.env;

class ServiceQueue {
  #queue;
  #serviceType;

  constructor(serviceType) {
    const oxenConfig = {
      mysql_config: {
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
      },
      db_table: "ServiceQueue",
      job_type: serviceType,
    };

    this.#queue = new Oxen(oxenConfig);
    this.#serviceType = serviceType;
  }

  async initTable() {
    try {
      await this.#queue.dbQry(
        `ALTER DATABASE ${MYSQL_DATABASE} DEFAULT CHARACTER SET = utf8`
      );
      await this.#queue.dbQry("DESC ServiceQueue");
    } catch (err) {
      if (err.code === "ER_NO_SUCH_TABLE") {
        await this.#queue.createTable();
      } else {
        throw err;
      }
    }
  }

  addServiceToUser(userId, intvInMs) {
    this.#queue.addJob({
      body: userId,
      start_time: new Date(new Date().getTime() + intvInMs),
    });
  }

  runServices(asyncCallback) {
    this.#queue.process({
      work_fn: async (userId) => {
        try {
          await asyncCallback(userId);

          await this.#queue.dbQry(
            "DELETE FROM ServiceQueue WHERE body = ? AND job_type = ? AND status = ?",
            [userId, this.#serviceType, "processing"]
          );
        } catch (err) {
          throw err;
        }
      },
      concurrency: 5,
    });
  }

  async deleteTable() {
    try {
      await this.#queue.deleteTable();
    } catch (err) {
      if (err.code !== "ER_NO_SUCH_TABLE") {
        throw err;
      }
    }
  }
}

module.exports = ServiceQueue;
