const { DataTypes, Model } = require("sequelize");

const { GeneralAnncmnt } = require("./GeneralAnncmnt");
const jw4DeptCodes = require("@config/jw4DeptCode");

class JW4DeptAnncmnt extends Model {
  getDeptName() {
    return jw4DeptCodes[this.deptCode].deptName;
  }

  getBoardUri() {
    return jw4DeptCodes[this.deptCode].boardUri;
  }
}

function initModel(sequelize) {
  JW4DeptAnncmnt.init(
    {
      deptCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      modelName: "JW4DeptAnncmnt",
      sequelize,
    }
  );

  GeneralAnncmnt.hasOne(JW4DeptAnncmnt);
  JW4DeptAnncmnt.belongsTo(GeneralAnncmnt);
}

module.exports = {
  JW4DeptAnncmnt,
  initModel,
  foreignKeyCnt: 1,
};
