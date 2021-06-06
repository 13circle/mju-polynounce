const { DataTypes, Model } = require("sequelize");

const { User } = require("./User");
const { Assignment } = require("./Assignment");
const { EclassCourse } = require("./EclassCourse");

class EclassCourseAssignment extends Model {}

function initModel(sequelize) {
  EclassCourseAssignment.init(
    {
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
      },
    },
    {
      modelName: "EclassCourseAssignment",
      sequelize,
    }
  );

  User.hasMany(EclassCourseAssignment);
  EclassCourseAssignment.belongsTo(User);

  Assignment.hasOne(EclassCourseAssignment);
  EclassCourseAssignment.belongsTo(Assignment);

  EclassCourse.hasMany(EclassCourseAssignment);
  EclassCourseAssignment.belongsTo(EclassCourse);
}

module.exports = {
  EclassCourseAssignment,
  initModel,
  foreignKeyCnt: 3,
};
