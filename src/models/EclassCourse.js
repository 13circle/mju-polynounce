const { DataTypes, Model } = require("sequelize");

const delim = "|";

class EclassCourse extends Model {
  setSerializedCourseTimes(courseTimes) {
    this.courseTime = courseTimes.join(delim);
  }

  getDeserializedCourseTimes() {
    return this.courseTime.split(delim);
  }
}

function initModel(sequelize) {
  EclassCourse.init(
    {
      courseName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      courseTime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      courseUri: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      anncmntUri: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      homeworkUri: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      boardUri: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      modelName: "EclassCourse",
      sequelize,
    }
  );
}

module.exports = {
  EclassCourse,
  initModel,
  foreignKeyCnt: 0,
};
