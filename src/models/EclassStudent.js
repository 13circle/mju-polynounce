const { Model } = require("sequelize");

const { User } = require("./User");
const { EclassCourse } = require("./EclassCourse");

class EclassStudent extends Model {}

function initModel(sequelize) {
  EclassStudent.init(
    {
      //
    },
    {
      modelName: "EclassStudent",
      sequelize,
    }
  );

  User.hasOne(EclassStudent);
  EclassStudent.belongsTo(User);

  EclassCourse.hasOne(EclassStudent);
  EclassStudent.belongsTo(EclassCourse);
}

module.exports = {
  EclassStudent,
  initModel,
  foreignKeyCnt: 2,
}
