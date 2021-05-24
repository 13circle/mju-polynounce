const { DataTypes, Model } = require("sequelize");

const { ScraperCache } = require("./ScraperCache");

class CacheAssignment extends Model {}

function initModel(sequelize) {
  CacheAssignment.init(
    {
      dueDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      modelName: "CacheAssignment",
      sequelize,
    }
  );

  ScraperCache.hasOne(CacheAssignment);
  CacheAssignment.belongsTo(ScraperCache);
}

module.exports = {
  CacheAssignment,
  initModel,
};
