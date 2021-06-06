const { DataTypes, Model } = require("sequelize");

const { User } = require("./User");

class UserSetting extends Model {
  setUpdateIntvByMin(updateIntvMin) {
    this.updateInterval = updateIntvMin * 60 * 1000;
  }
}

function initModel(sequelize) {
  UserSetting.init(
    {
      enableNotification: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notifyByUserEmail: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      updateInterval: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 30 * 60 * 1000,
      },
      toggleDarkMode: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      modelName: "UserSetting",
      sequelize,
    }
  );

  User.hasOne(UserSetting);
  UserSetting.belongsTo(User);
}

module.exports = {
  UserSetting,
  initModel,
  foreignKeyCnt: 1,
};
