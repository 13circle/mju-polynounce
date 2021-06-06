const { DataTypes, Model } = require("sequelize");

const { User } = require("./User");
const { Assignment } = require("./Assignment");
const { LMSCourse } = require("./LMSCourse");

class LMSCourseAssignment extends Model {}

function initModel(sequelize) {
  LMSCourseAssignment.init(
    {
      isInProgress: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      isSubmitted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      scorePerPoints: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      modelName: "LMSCourseAssignment",
      sequelize,
    }
  );

  User.hasMany(LMSCourseAssignment);
  LMSCourseAssignment.belongsTo(User);

  Assignment.hasOne(LMSCourseAssignment);
  LMSCourseAssignment.belongsTo(Assignment);

  LMSCourse.hasMany(LMSCourseAssignment);
  LMSCourseAssignment.belongsTo(LMSCourse);
}

module.exports = {
  LMSCourseAssignment,
  initModel,
  foreignKeyCnt: 3,
};
