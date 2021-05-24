const { DataTypes, Model } = require("sequelize");

const { User } = require("./User");

class ScraperCache extends Model {}

function initModel(sequelize) {
  ScraperCache.init(
    {
      siteBaseUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      updateInterval: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, 
    {
      modelName: "ScraperCache",
      sequelize,
    }
  );

  User.hasOne(ScraperCache);
  ScraperCache.belongsTo(User);
}

module.exports = {
  ScraperCache,
  initModel,
};
