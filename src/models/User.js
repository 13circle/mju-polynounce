const { DataTypes, Model } = require("sequelize");

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const saltRounds = 13;

const { PASSWD_SECRET } = process.env;

if (!PASSWD_SECRET) {
  throw Error("PASSWD_SECRET must be specified");
}

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
};
