const { DataTypes, Model } = require("sequelize");

const delim = "|";

class MyiwebRegCourse extends Model {
  setSerializedCourseTimes(courseTimes) {
    this.courseTime = courseTimes.join(delim);
  }

  getDeserializedCourseTimes() {
    return this.courseTime.split(delim);
  }

  setSerializedCourseRooms(courseRooms) {
    this.courseRoom = courseRooms.join(delim);
  }

  getDeserializedCourseRooms() {
    return this.courseRoom.split(delim);
  }
}

function initModel(sequelize) {
  MyiwebRegCourse.init(
    {
      courseNum: {
        type: DataTypes.CHAR(4),
        allowNull: false,
        unique: true,
      },
      courseCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      courseName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      courseProf: {
        type: DataTypes.STRING,
      },
      courseCredit: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
      courseTime: {
        type: DataTypes.STRING,
      },
      courseRoom: {
        type: DataTypes.STRING,
      },
      courseCampus: {
        type: DataTypes.STRING,
      },
    },
    {
      modelName: "MyiwebRegCourse",
      sequelize,
    }
  );
}

module.exports = {
  MyiwebRegCourse,
  initModel,
  foreignKeyCnt: 0,
};
