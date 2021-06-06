const { DataTypes, Model } = require("sequelize");

const { Post } = require("./Post");
const anncmntTypes = require("@config/generalAnncmntType");

class GeneralAnncmnt extends Model {
  setAnncmntTypeByName(anncmntTypeName) {
    this.anncmntType = anncmntTypes.indexOf(anncmntTypeName);
  }

  getAnncmntTypeName() {
    return anncmntTypes[this.anncmntType];
  }
}

function initModel(sequelize) {
  GeneralAnncmnt.init(
    {
      anncmntType: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
      isFileAttached: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      modelName: "GeneralAnncmnt",
      sequelize,
    }
  );

  Post.hasOne(GeneralAnncmnt);
  GeneralAnncmnt.belongsTo(Post);
}

module.exports = {
  GeneralAnncmnt,
  initModel,
  foreignKeyCnt: 1,
};
