const { DataTypes, Model } = require("sequelize");

const { User } = require("./User");
const boardTypes = require("@config/boardType");

class BoardDisplaySetting extends Model {
  setBoardTypeByName(boardTypeName) {
    this.boardType = boardTypes.indexOf(boardTypeName);
  }

  getBoardTypeName() {
    return boardTypes[this.boardType];
  }
}

function initModel(sequelize) {
  BoardDisplaySetting.init(
    {
      boardType: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
    },
    {
      modelName: "BoardDisplaySetting",
      sequelize,
    }
  );

  User.hasMany(BoardDisplaySetting);
  BoardDisplaySetting.belongsTo(User);
}

module.exports = {
  BoardDisplaySetting,
  initModel,
  foreignKeyCnt: 1,
};
