const { DataTypes, Model } = require("sequelize");

class Assignment extends Model {}

function initModel(sequelize) {
  Assignment.init(
    {
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      boardUri: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      dueDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      modelName: "Assignment",
      sequelize,
    }
  );
}

module.exports = {
  Assignment,
  initModel,
  foreignKeyCnt: 0,
};
