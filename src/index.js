const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const morgan = require("morgan");
const path = require("path");
const ejs = require("ejs");

const cookieParser = require("cookie-parser");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const passport = require("passport");

dotenv.config();

const { PORT, NODE_ENV } = process.env;

if (!NODE_ENV) {
  throw Error("NODE_ENV must be specified");
}

const app = express();

const routes = require("./routes");

const initDB = require("./models");
const passportConfig = require("./lib/util/passport");

const handleRouteError = require("./lib/mw/handle-route-error");

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cookieParser());

async function connectDB() {
  try {
    const dbConfig = await initDB();

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
        store: new MySQLStore(dbConfig),
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

  app.use("/static", express.static(path.resolve("src", "static")));

  app.use("/", routes);

  app.use(handleRouteError);

  const port = PORT || 3000;

  http.createServer(app).listen(port, () => {
    if (NODE_ENV === "development") {
      console.log(`Server listening to port ${port}`);
    }
  });
})();
