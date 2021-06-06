const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const MJUScraperClient = require("@scrapers/MJUScraperClient");

const {
  PASSWD_SECRET,
  JWT_SECRET,
  BASE_URL,
  MAILER_SERVICE,
  MAILER_EMAIL,
  MAILER_HOST,
  MAILER_PORT,
  MAILER_USER,
  MAILER_PASSWORD,
} = process.env;
const saltRounds = 13;

if (!PASSWD_SECRET) {
  throw Error("PASSWD_SECRET must be specified");
}

if (!JWT_SECRET) {
  throw Error("JWT_SECRET must be specified");
}

if (
  !MAILER_SERVICE ||
  !MAILER_EMAIL ||
  !MAILER_HOST ||
  !MAILER_PORT ||
  !MAILER_USER ||
  !MAILER_PASSWORD
) {
  throw Error(
    "All of the following must be specified: \n" +
      "(1) MAILER_SERVICE \n" +
      "(2) MAILER_EMAIL \n" +
      "(3) MAILER_HOST \n" +
      "(4) MAILER_PORT \n" +
      "(5) MAILER_USER \n" +
      "(6) MAILER_PASSWORD \n"
  );
}

const transporter = nodemailer.createTransport({
  service: MAILER_SERVICE,
  host: MAILER_HOST,
  port: parseInt(MAILER_PORT),
  auth: {
    user: MAILER_USER,
    pass: MAILER_PASSWORD,
  },
});

class User extends Model {
  serialize() {
    const user = this.toJSON();

    delete user.userPwd;
    delete user.studPwd;
    delete user.emailCheckCode;

    return user;
  }

  async hashUserPassword(userPwd) {
    this.userPwd = await bcrypt.hash(userPwd, saltRounds);
  }

  async compareUserPassword(userPwd) {
    const isMatch = await bcrypt.compare(userPwd, this.userPwd);
    return isMatch;
  }

  encryptStudPassword(studPwd) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(PASSWD_SECRET),
      iv
    );

    const enc = cipher.update(studPwd);

    this.studPwd =
      iv.toString("hex") +
      ":" +
      Buffer.concat([enc, cipher.final()]).toString("hex");
  }

  decryptStudPassword() {
    const strs = this.studPwd.split(":");
    const iv = Buffer.from(strs.shift(), "hex");
    const enc = Buffer.from(strs.join(":"), "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(PASSWD_SECRET),
      iv
    );

    const dec = decipher.update(enc);
    const studPwd = Buffer.concat([dec, decipher.final()]).toString();

    this.encryptStudPassword(studPwd);

    return studPwd;
  }

  static checkStudAccount(studId, studPwd) {
    return new Promise((resolve, reject) => {
      MJUScraperClient.checkUser(studId, studPwd)
        .then((isStudValid) => {
          resolve(isStudValid);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  generateEmailToken(isMjuEmail) {
    return jwt.sign(
      {
        id: this.id,
        isMjuEmail,
        exp: Date.now() + 30 * 60 * 1000,
      },
      JWT_SECRET
    );
  }

  generatePasswordToken() {
    return jwt.sign(
      {
        id: this.id,
        exp: Date.now() + 10 * 60 * 1000,
      },
      JWT_SECRET
    );
  }

  static decodeToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (err) {
      return null;
    }
  }

  sendEmailVerification(isMjuEmail) {
    return new Promise((resolve, reject) => {
      const token = this.generateEmailToken(isMjuEmail);

      const mailerOptions = {
        from: MAILER_EMAIL,
        to: isMjuEmail ? this.mjuEmail : this.userEmail,
        subject: "[MJU Polynounce] 이메일 인증 안내",
        html: `
          <h1>[MJU Polynounce]</h1>
          <h2>이메일 인증 안내</h2>
          <br/>
          <hr/>
          <br/>
          <p>가입하여 관리자의 서버비를 늘려주셔서 감사합니다.</p>
          <br/>
          <p>아래의 링크를 클릭하여 인증해주시기 바랍니다.</p>
          <br/>
          <a 
            href="${BASE_URL}/auth/confirm-email/${token}"
            target="_blank"
          >
            이메일 인증하기
          </a><br/>
          <br/>
          <hr/>
          <br/>
          <p>본 메일은 MJU Polynounce에서 발신되었습니다.</p>
          <p>이 메일을 요청한 적이 없으시다면 아래의 메일로 알려주시면 감사하겠습니다.</p>
          <br/>
          <a href="mailto:13circle97@gmail.com">13circle97@gmail.com</a>
          <br/>
        `,
      };

      transporter.sendMail(mailerOptions, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  sendPasswordResetMail() {
    return new Promise((resolve, reject) => {
      const token = this.generatePasswordToken();

      const mailerOptions = {
        from: MAILER_EMAIL,
        to: this.userEmail,
        subject: "[MJU Polynounce] 비밀번호 변경 안내",
        html: `
          <h1>[MJU Polynounce]</h1>
          <h2>비밀번호 변경 안내</h2>
          <br/>
          <hr/>
          <br/>
          <p>아래의 링크를 클릭하여 비밀번호를 변경해주시기 바랍니다.</p>
          <br/>
          <a 
            href="${BASE_URL}/auth/reset-password/${token}"
            target="_blank"
          >
            비밀번호 변경하기
          </a><br/>
          <br/>
          <hr/>
          <br/>
          <p>본 메일은 MJU Polynounce에서 발신되었습니다.</p>
          <p>이 메일을 요청한 적이 없으시다면 아래의 메일로 알려주시면 감사하겠습니다.</p>
          <br/>
          <a href="mailto:13circle97@gmail.com">13circle97@gmail.com</a>
          <br/>
        `,
      };

      transporter.sendMail(mailerOptions, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  sendNotification(useUserEmail) {
    return new Promise((resolve, reject) => {
      const mailerOptions = {
        from: MAILER_EMAIL,
        to: useUserEmail ? this.userEmail : this.mjuEmail,
        subject: `[MJU Polynounce] 정보 갱신 현황 보고`,
        html: `
          <h1>[MJU Polynounce]</h1>
          <h2>정보 갱신 현황 보고</h2>
          <br/>
          <hr/>
          <br/>
          <p>방금 전에 최신 정보로 갱신되었습니다.</p>
          <br/>
          <p>방문하셔서 확인 부탁드리겠습니다.</p>
          <br/>
          <a 
            href="${BASE_URL}"
            target="_blank"
          >
            MJU Polynounce 바로가기
          </a><br/>
          <br/>
          <hr/>
          <br/>
          <p>본 메일은 MJU Polynounce에서 발신되었습니다.</p>
          <p>이 메일을 요청한 적이 없으시다면 아래의 메일로 알려주시면 감사하겠습니다.</p>
          <br/>
          <a href="mailto:13circle97@gmail.com">13circle97@gmail.com</a>
          <br/>
        `,
      };

      transporter.sendMail(mailerOptions, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

function initModel(sequelize) {
  User.init(
    {
      userEmail: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      userPwd: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      studId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      studPwd: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      majorDeptCode: {
        type: DataTypes.STRING,
      },
      mjuEmail: {
        type: DataTypes.STRING,
        unique: true,
      },
      isUserEmailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isMjuEmailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      modelName: "User",
      sequelize,
    }
  );
}

module.exports = {
  User,
  initModel,
  foreignKeyCnt: 0,
};
