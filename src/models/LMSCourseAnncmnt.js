const { Model } = require("sequelize");

const { GeneralAnncmnt } = require("./GeneralAnncmnt");
const { LMSCourse } = require("./LMSCourse");

class LMSCourseAnncmnt extends Model {}

function initModel(sequelize) {
  LMSCourseAnncmnt.init(
    {
      //
    },
    {
      modelName: "LMSCourseAnncmnt",
      sequelize,
    }
  );

  GeneralAnncmnt.hasOne(LMSCourseAnncmnt);
  LMSCourseAnncmnt.belongsTo(GeneralAnncmnt);

  LMSCourse.hasMany(LMSCourseAnncmnt);
  LMSCourseAnncmnt.belongsTo(LMSCourse);
}

module.exports = {
  LMSCourseAnncmnt,
  initModel,
  foreignKeyCnt: 2,
};
