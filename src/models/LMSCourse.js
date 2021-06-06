const { DataTypes, Model } = require("sequelize");

const { MyiwebRegCourse } = require("./MyiwebRegCourse");

class LMSCourse extends Model {}

function initModel(sequelize) {
  LMSCourse.init(
    {
      kjkey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      modelName: "LMSCourse",
      sequelize,
    }
  );

  MyiwebRegCourse.hasOne(LMSCourse);
  LMSCourse.belongsTo(MyiwebRegCourse);
}

module.exports = {
  LMSCourse,
  initModel,
  foreignKeyCnt: 1,
};
