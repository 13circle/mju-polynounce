const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const { User } = require("../../models/User");

async function passportConfig() {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findByPk(id).then((user) => {
      done(null, user);
    }).catch((err) => {
      done(err);
    });
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: "userEmail",
        passwordField: "userPwd",
        session: true,
        passReqToCallback: false,
      },
      (userEmail, userPwd, done) => {
        User.findOne({
          where: {
            userEmail,
          },
        })
          .then((user) => {
            if (!user) {
              return done(null, false, { message: "ER_NO_RESULT" });
            }

            user
              .compareUserPassword(userPwd)
              .then((isMatch) => {
                if (isMatch) {
                  done(null, user);
                } else {
                  done(null, false, { message: "ER_WRONG_PWD" });
                }
              })
              .catch((err) => {
                done(err);
              });
          })
          .catch((err) => {
            done(err);
          });
      }
    )
  );
}

module.exports = passportConfig;
