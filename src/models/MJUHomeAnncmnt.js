const { DataTypes, Model } = require("sequelize");

const { GeneralAnncmnt } = require("./GeneralAnncmnt");
const homeAnncmntType = require("@config/homeAnncmntType");

class MJUHomeAnncmnt extends Model {
  setHomeAnncmntTypeByName(anncmntTypeName) {
    this.homeAnncmntType = homeAnncmntType.indexOf(anncmntTypeName);
  }

  getHomeAnncmntTypeName() {
    return homeAnncmntType[this.homeAnncmntType];
  }
}

function initModel(sequelize) {
  MJUHomeAnncmnt.init(
    {
      homeAnncmntType: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
    },
    {
      modelName: "MJUHomeAnncmnt",
      sequelize,
    }
  );

  GeneralAnncmnt.hasOne(MJUHomeAnncmnt);
  MJUHomeAnncmnt.belongsTo(GeneralAnncmnt);
}

module.exports = {
  MJUHomeAnncmnt,
  initModel,
  foreignKeyCnt: 1,
};
