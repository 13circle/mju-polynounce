"use strict";

require("./init.test");

const Oxen = require("oxen-queue");

const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } =
  process.env;

const serviceType = "UpdateData";

const serviceQueue = new Oxen({
  mysql_config: {
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
  },
  db_table: "ServiceQueue",
  job_type: serviceType,
});

async function run() {
  try {
    await serviceQueue.dbQry("DESC ServiceQueue");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      await serviceQueue.createTable();
    } else {
      console.error(err);
    }
  }

  try {
    serviceQueue.addJobs([{ body: 1 }, { body: 2 }, { body: 3 }]);
    serviceQueue.process({
      work_fn: async function (jobBody) {
        console.log(jobBody);
        await serviceQueue.dbQry(
          `DELETE FROM ServiceQueue WHERE body = ? AND job_type = ? AND status = ?`,
          [jobBody, serviceType, "processing"]
        );
      },
      concurrency: 5,
    });
    //await serviceQueue.deleteTable();
  } catch (err) {
    console.error(err);
  }
}

run();
