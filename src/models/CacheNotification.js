const { DataTypes, Model } = require("sequelize");

const { ScraperCache } = require("./ScraperCache");

class CacheNotification extends Model {}

function initModel(sequelize) {
  CacheNotification.init(
    {
      boardUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      modelName: "CacheNotification",
      sequelize,
    }
  );

  ScraperCache.hasOne(CacheNotification);
  CacheNotification.belongsTo(ScraperCache);
}

module.exports = {
  CacheNotification,
  initModel,
};
