const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const morgan = require("morgan");
const path = require("path");
const ejs = require("ejs");

const session = require("express-session");
const FileStore = require("session-file-store")(session);
const MySQLStore = require("express-mysql-session")(session);

dotenv.config();

const { PORT, NODE_ENV } = process.env;

if (!NODE_ENV) {
  throw Error("NODE_ENV must be specified");
}

const app = express();

const routes = require("./routes");

const MyDBConnector = require("./models/MyDBConnector");

const handleRouteError = require("./lib/mw/handle-route-error");

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

async function connectDB(callback) {
  global.db = new MyDBConnector();

  const { db } = global;

  try {
    await db.initPool();

    setInterval(async () => {
      await db.refreshPool();
      if (NODE_ENV === "development") {
        console.log("MySQL Pool Refreshed");
      }
    }, 1000 * 60 * 15);

    if (callback)
      callback(
        db.isUsingSSH()
          ? {
              path: path.resolve(__dirname, "sessions"),
            }
          : db.getMysqlConfig()
      );
  } catch (err) {
    throw err;
  }
}
connectDB((storeConfig) => {
  const { SESSION_SECRET } = process.env;

  if (!SESSION_SECRET) {
    throw Error("SESSION_SECRET must be specified");
  }

  const store = db.isUsingSSH()
    ? new FileStore(storeConfig)
    : new MySQLStore(storeConfig);

  app.use(
    session({
      key: "MJU_POLYNOUNCE_SESSION",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store,
    })
  );
});

app.set("views", path.resolve(__dirname, "view"));
app.set("view engine", "ejs");
app.engine("html", ejs.renderFile);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.text());

app.use("/static", express.static(path.resolve("src", "static")));

app.use("/", routes);

app.use(handleRouteError);

const port = PORT || 3000;

http.createServer(app).listen(port, () => {
  if (NODE_ENV === "development") {
    console.log(`Server listening to port ${port}`);
  }
});
