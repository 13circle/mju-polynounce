const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const morgan = require("morgan");
const path = require("path");
const ejs = require("ejs");
const internalIp = require("internal-ip");

const cookieParser = require("cookie-parser");
const session = require("express-session");
const SessionStore = require("express-session-sequelize")(session.Store);
const passport = require("passport");

dotenv.config();

const { NODE_ENV, PORT, BASE_URL } = process.env;

if (!NODE_ENV) {
  throw Error("NODE_ENV must be specified");
}

const port = PORT || 3000;

if (!BASE_URL) {
  throw Error("BASE_URL must be specified");
} else if (BASE_URL === "localhost") {
  process.env.BASE_URL = `http://${internalIp.v4.sync()}:${port}`;
}

require("module-alias/register");

const app = express();

const routes = require("@routes");

const initDB = require("@models");
const passportConfig = require("@util/passport");

const handleRouteError = require("@mw/handle-route-error");

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cookieParser());

async function connectDB() {
  try {
    const sequelize = await initDB();

    if (NODE_ENV === "development") {
      console.log("MySQL connected");
    }

    const { SESSION_SECRET } = process.env;

    if (!SESSION_SECRET) {
      throw Error("SESSION_SECRET must be specified");
    }

    app.use(
      session({
        key: "MJU_POLYNOUNCE_SESSION",
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new SessionStore({ db: sequelize }),
        cookie:
          NODE_ENV === "production" ? { secure: true, httpOnly: true } : {},
      })
    );
  } catch (err) {
    console.error(err);
    process.exit(-1);
  }
}

(async () => {
  await connectDB();

  if (NODE_ENV === "development") {
    const ServiceQueue = require("@util/ServiceQueue");
    await new ServiceQueue("INIT").deleteTable();
  }

  app.use(passport.initialize());
  app.use(passport.session());

  await passportConfig();

  if (NODE_ENV === "development") {
    console.log("Passport initialized");
  }

  app.set("views", path.resolve(__dirname, "view"));
  app.set("view engine", "ejs");
  app.engine("html", ejs.renderFile);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.text());

  if (NODE_ENV === "development" || BASE_URL === "localhost") {
    app.use("/static", express.static(path.resolve("src", "static")));
  }

  app.use("/", routes);

  app.use(handleRouteError);

  http.createServer(app).listen(port, () => {
    if (NODE_ENV === "development") {
      console.log(`Server listening to port ${port}`);
    }
  });
})();
