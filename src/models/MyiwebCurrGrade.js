const { DataTypes, Model } = require("sequelize");

const { User } = require("./User");
const { MyiwebRegCourse } = require("./MyiwebRegCourse");

class MyiwebCurrGrade extends Model {}

function initModel(sequelize) {
  MyiwebCurrGrade.init(
    {
      courseGrade: {
        type: DataTypes.STRING,
      },
    },
    {
      modelName: "MyiwebCurrGrade",
      sequelize,
    }
  );

  User.hasMany(MyiwebCurrGrade);
  MyiwebCurrGrade.belongsTo(User);

  MyiwebRegCourse.hasOne(MyiwebCurrGrade);
  MyiwebCurrGrade.belongsTo(MyiwebRegCourse);
}

module.exports = {
  MyiwebCurrGrade,
  initModel,
  foreignKeyCnt: 2,
};
