const { DataTypes, Model } = require("sequelize");

class Post extends Model {}

function initModel(sequelize) {
  Post.init(
    {
      postId: {
        type: DataTypes.STRING,
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
      uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      modelName: "Post",
      sequelize,
    }
  );
}

module.exports = {
  Post,
  initModel,
  foreignKeyCnt: 0,
};
