const anncmntCtrl = {};

const Joi = require("joi");

const { User } = require("@models/User");
const { Post } = require("@models/Post");
const { Assignment } = require("@models/Assignment");
const { GeneralAnncmnt } = require("@models/GeneralAnncmnt");
const { MJUHomeAnncmnt } = require("@models/MJUHomeAnncmnt");
const { MyiwebRegCourse } = require("@models/MyiwebRegCourse");
const { MyiwebCurrGrade } = require("@models/MyiwebCurrGrade");
const { LMSCourse } = require("@models/LMSCourse");
const { LMSCourseAnncmnt } = require("@models/LMSCourseAnncmnt");
const { LMSCourseAssignment } = require("@models/LMSCourseAssignment");
const { EclassCourse } = require("@models/EclassCourse");
const { EclassStudent } = require("@models/EclassStudent");
const { EclassCourseAnncmnt } = require("@models/EclassCourseAnncmnt");
const { EclassCourseAssignment } = require("@models/EclassCourseAssignment");
const { BoardDisplaySetting } = require("@models/BoardDisplaySetting");
const { JW4DeptAnncmnt } = require("@models/JW4DeptAnncmnt");

const boardType = require("@config/boardType");
const homeAnncmntType = require("@config/homeAnncmntType");
const generalAnncmntType = require("@config/generalAnncmntType");

anncmntCtrl.setDisplayBoard = async (req, res) => {
  const {
    user: { id },
  } = req;

  try {
    const boards = await BoardDisplaySetting.findAll({
      where: {
        UserId: id,
      },
    });

    const chosenBoards = {};

    boards.forEach((b) => {
      chosenBoards[boardType[b.boardType]] = true;
    });

    boardType.forEach((b) => {
      if (!(b in chosenBoards)) {
        chosenBoards[b] = false;
      }
    });

    const schema = Joi.object({
      MJUHome: Joi.boolean().required(),
      Myiweb: Joi.boolean().required(),
      LMS: Joi.boolean().required(),
      Eclass: Joi.boolean().required(),
      JW4Dept: Joi.boolean().required(),
    });

    const result = schema.validate(req.body);

    if (result.error) {
      delete result.error._original;
      return res.status(400).send(result.error.details);
    }

    for (let b in chosenBoards) {
      if (req.body[b] !== chosenBoards[b]) {
        chosenBoards[b] = req.body[b];
      }
    }

    for (let b in chosenBoards) {
      const option = {
        where: {
          UserId: id,
          boardType: boardType.indexOf(b),
        },
      };
      const board = await BoardDisplaySetting.findOne(option);

      if (chosenBoards[b]) {
        if (!board) {
          await BoardDisplaySetting.create(option.where);
        }
      } else if (board) {
        await BoardDisplaySetting.destroy(option);
      }
    }

    res.status(200).send(
      await BoardDisplaySetting.findAll({
        where: {
          UserId: id,
        },
      })
    );
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.mjuHomeAnncmnt = async (req, res) => {
  const homeAnncmnt = {};

  try {
    for (let t in homeAnncmntType) {
      const mha = await MJUHomeAnncmnt.findAll({
        where: {
          homeAnncmntType: t,
        },
        include: {
          model: GeneralAnncmnt,
          include: [
            {
              model: Post,
              attributes: {
                exclude: ["createdAt", "updatedAt"],
              },
            },
          ],
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      });
      homeAnncmnt[homeAnncmntType[t]] = mha;
    }

    res.status(200).send(homeAnncmnt);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.myiwebRegCourses = async (req, res) => {
  const {
    user: { id },
  } = req;

  try {
    const grades = await MyiwebCurrGrade.findAll({
      where: {
        UserId: id,
      },
    });

    const courses = [];

    for (let g in grades) {
      courses.push(await grades[g].getMyiwebRegCourse());
    }

    res.status(200).send(courses);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.myiwebCurrGrade = async (req, res) => {
  const {
    user: { id },
  } = req;

  try {
    const grades = await MyiwebCurrGrade.findAll({
      where: {
        UserId: id,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: {
        model: MyiwebRegCourse,
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
    });

    res.status(200).send(grades);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.lmsCourses = async (req, res) => {
  try {
    const courses = await MyiwebRegCourse.findAll({
      include: {
        model: LMSCourse,
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send(courses);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.lmsCourseAnncmnt = async (req, res) => {
  const { kjkey } = req.params;

  try {
    const anncmnts = await LMSCourseAnncmnt.findAll({
      include: [
        {
          model: LMSCourse,
          where: {
            kjkey,
          },
          include: {
            model: MyiwebRegCourse,
            attributes: {
              exclude: ["createdAt", "updatedAt"],
            },
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: GeneralAnncmnt,
          include: {
            model: Post,
            attributes: {
              exclude: ["createdAt", "updatedAt"],
            },
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send(anncmnts);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.lmsCourseAssignment = async (req, res) => {
  const {
    user: { id },
  } = req;
  const { kjkey } = req.params;

  try {
    const assignments = await LMSCourseAssignment.findAll({
      where: {
        UserId: id,
      },
      include: [
        {
          model: LMSCourse,
          where: {
            kjkey,
          },
          include: {
            model: MyiwebRegCourse,
            attributes: {
              exclude: ["createdAt", "updatedAt"],
            },
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: Assignment,
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: User,
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send(assignments);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.lmsAnncmnt = async (req, res) => {
  try {
    const lmsAnncmnts = await GeneralAnncmnt.findAll({
      where: {
        anncmntType: generalAnncmntType.indexOf("LMSAnncmnt"),
      },
      include: {
        model: Post,
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send(lmsAnncmnts);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.eclassCourses = async (req, res) => {
  const {
    user: { id },
  } = req;

  try {
    const courses = await EclassStudent.findAll({
      where: {
        UserId: id,
      },
      include: {
        model: EclassCourse,
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send(courses);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.eclassCourseAnncmnt = async (req, res) => {
  const {
    user: { id },
    params: { courseName },
  } = req;

  try {
    const stud = await EclassStudent.findOne({
      where: {
        UserId: id,
      },
      include: {
        model: EclassCourse,
        where: {
          courseName,
        },
      },
    });

    const anncmnts = await EclassCourseAnncmnt.findAll({
      where: {
        EclassCourseId: stud.EclassCourseId,
      },
      include: {
        model: Post,
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send(anncmnts);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.eclassCourseAssignment = async (req, res) => {
  const {
    user: { id },
    params: { courseName },
  } = req;

  try {
    const assignments = await EclassCourseAssignment.findAll({
      where: {
        UserId: id,
      },
      include: [
        {
          model: EclassCourse,
          where: {
            courseName,
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: Assignment,
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send(assignments);
  } catch (err) {
    throw err;
  }
};

anncmntCtrl.jw4DeptAnncmnt = async (req, res) => {
  const {
    user: { majorDeptCode },
  } = req;

  try {
    const anncmnts = await JW4DeptAnncmnt.findAll({
      where: {
        deptCode: majorDeptCode,
      },
      include: {
        model: GeneralAnncmnt,
        include: {
          model: Post,
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send(anncmnts);
  } catch (err) {
    throw err;
  }
};

module.exports = anncmntCtrl;
