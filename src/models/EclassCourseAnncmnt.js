const { DataTypes, Model } = require("sequelize");

const { Post } = require("./Post");
const { EclassCourse } = require("./EclassCourse");
const anncmntTypes = require("@config/eclassAnncmntType");

class EclassCourseAnncmnt extends Model {
  setAnncmntTypeByName(anncmntTypeName) {
    this.anncmntType = anncmntTypes.indexOf(anncmntTypeName);
  }

  getAnncmntTypeName() {
    return anncmntTypes[this.anncmntType];
  }
}

function initModel(sequelize) {
  EclassCourseAnncmnt.init(
    {
      anncmntType: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
      isFileAttached: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      modelName: "EclassCourseAnncmnt",
      sequelize,
    }
  );

  Post.hasOne(EclassCourseAnncmnt);
  EclassCourseAnncmnt.belongsTo(Post);

  EclassCourse.hasMany(EclassCourseAnncmnt);
  EclassCourseAnncmnt.belongsTo(EclassCourse);
}

module.exports = {
  EclassCourseAnncmnt,
  initModel,
  foreignKeyCnt: 2,
};
