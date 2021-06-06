const ServiceQueue = require("@util/ServiceQueue");

const { User } = require("@models/User");
const { UserSetting } = require("@models/UserSetting");
const { BoardDisplaySetting } = require("@models/BoardDisplaySetting");
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
const { JW4DeptAnncmnt } = require("@models/JW4DeptAnncmnt");

const MJUHomeScraperClient = require("@scrapers/MJUHomeScraperClient");
const EclassScraperClient = require("@scrapers/EclassScraperClient");
const LMSScraperClient = require("@scrapers/LMSScraperClient");
const JW4DeptScraperClient = require("@scrapers/JW4DeptScraperClient");
const MyiwebScraperClient = require("@scrapers/MyiwebScraperClient");

const jw4DeptCode = require("@config/jw4DeptCode");

const sendNotification = require("./sendNotification");

async function getMJUHomeAnncmnts(homeClient, methodName, homeAnncmntType) {
  let retData, p, tempData, tempRet;

  try {
    retData = await homeClient[methodName](1);
    tempData = retData.data;
    for (p in tempData) {
      const { postId, title, boardUri, uploadedAt, isFileAttached } =
        tempData[p];

      try {
        tempRet = await Post.create({
          postId,
          title,
          boardUri,
          uploadedAt,
        });

        tempRet = await GeneralAnncmnt.create({
          PostId: tempRet.id,
          anncmntType: 3,
          isFileAttached,
        });

        await MJUHomeAnncmnt.create({
          GeneralAnncmntId: tempRet.id,
          homeAnncmntType,
        });
      } catch (err) {
        const { original } = err;
        if (original) {
          const { code } = original;
          if (code !== "ER_DUP_ENTRY") {
            throw err;
          }
        }
      }
    }
  } catch (err) {
    throw err;
  }
}

async function updateData(userId) {
  const serviceQueue = new ServiceQueue("UpdateData");

  try {
    await serviceQueue.initTable();

    const userSetting = await UserSetting.findOne({
      where: {
        UserId: userId,
      },
    });
    serviceQueue.addServiceToUser(userId, userSetting.updateInterval);

    serviceQueue.runServices(async (userId) => {
      try {
        const user = await User.findByPk(userId);
        const studId = user.studId;
        const studPwd = user.decryptStudPassword();

        const boards = await BoardDisplaySetting.findAll({
          where: {
            UserId: userId,
          },
        });

        let retData;

        for (let i in boards) {
          const boardType = boards[i].getBoardTypeName();

          switch (boardType) {
            case "MJUHome":
              const homeClient = new MJUHomeScraperClient(studId, studPwd);
              await homeClient.initSSOclient();

              await getMJUHomeAnncmnts(
                homeClient,
                "getGeneralAnncmntsPerPage",
                0
              );
              await getMJUHomeAnncmnts(
                homeClient,
                "getEventAnncmntsPerPage",
                1
              );
              await getMJUHomeAnncmnts(
                homeClient,
                "getAcademicAnncmntsPerPage",
                2
              );
              await getMJUHomeAnncmnts(homeClient, "getEtcAnncmntsPerPage", 3);
              await getMJUHomeAnncmnts(
                homeClient,
                "getScholarshipAnncmntsPerPage",
                4
              );
              await getMJUHomeAnncmnts(
                homeClient,
                "getCareerAnncmntsPerPage",
                5
              );
              break;

            case "Myiweb":
              const myiwebClient = new MyiwebScraperClient(studId, studPwd);
              await myiwebClient.initSSOclient();

              const csrfConfig = await myiwebClient.loginToMyiweb();

              retData = await myiwebClient.getRegisteredCourses(csrfConfig);
              for (let p in retData) {
                const {
                  courseNum,
                  courseCode,
                  courseName,
                  courseProf,
                  courseCredit,
                  courseTime,
                  courseRoom,
                  courseCampus,
                } = retData[p];

                try {
                  const regCourse = await MyiwebRegCourse.build({
                    courseNum,
                    courseCode,
                    courseName,
                    courseProf,
                    courseCredit,
                    courseCampus,
                  });

                  regCourse.setSerializedCourseTimes(courseTime);
                  regCourse.setSerializedCourseRooms(courseRoom);

                  await regCourse.save();
                } catch (err) {
                  const { original } = err;
                  if (original) {
                    const { code } = original;
                    if (code !== "ER_DUP_ENTRY") {
                      throw err;
                    }
                  }
                }
              }

              retData = await myiwebClient.getCurrentCourseGrades(csrfConfig);
              for (let p in retData) {
                const { courseNum, courseGrade } = retData[p];

                try {
                  const regCourse = await MyiwebRegCourse.findOne({
                    where: {
                      courseNum,
                    },
                  });

                  await MyiwebCurrGrade.create({
                    UserId: userId,
                    MyiwebRegCourseId: regCourse.id,
                    courseGrade,
                  });
                } catch (err) {
                  const { original } = err;
                  if (original) {
                    const { code } = original;
                    if (code !== "ER_DUP_ENTRY") {
                      throw err;
                    }
                  }
                }
              }
              break;

            case "LMS":
              const lmsClient = new LMSScraperClient(studId, studPwd);
              await lmsClient.initSSOclient();

              retData = await lmsClient.getCurrentLmsCourses();
              for (let p in retData) {
                const { courseNum, kjkey } = retData[p];

                try {
                  const regCourse = await MyiwebRegCourse.findOne({
                    where: {
                      courseNum,
                    },
                  });

                  const lmsCourse = await LMSCourse.create({
                    MyiwebRegCourseId: regCourse.id,
                    kjkey,
                  });

                  const lmsCourseAnncmnts =
                    await lmsClient.getLmsCourseAnncmnts(kjkey);
                  for (let q in lmsCourseAnncmnts) {
                    const {
                      postId,
                      title,
                      boardUri,
                      uploadedAt,
                      isFileAttached,
                    } = lmsCourseAnncmnts[q];

                    const post = await Post.create({
                      postId,
                      title,
                      boardUri,
                      uploadedAt,
                    });

                    const generalAnncmnt = await GeneralAnncmnt.create({
                      PostId: post.id,
                      anncmntType: 0,
                      isFileAttached,
                    });

                    await LMSCourseAnncmnt.create({
                      GeneralAnncmntId: generalAnncmnt.id,
                      LMSCourseId: lmsCourse.id,
                    });
                  }

                  const lmsCourseAssignment =
                    await lmsClient.getLmsCourseAssignments(kjkey);
                  for (let r in lmsCourseAssignment) {
                    const {
                      postId,
                      title,
                      boardUri,
                      isInProgress,
                      isSubmitted,
                      scorePerPoints,
                      dueDateTime,
                    } = lmsCourseAssignment[r];

                    const lmsAssignment = await Assignment.create({
                      postId,
                      title,
                      boardUri,
                      dueDateTime,
                    });

                    await LMSCourseAssignment.create({
                      UserId: userId,
                      AssignmentId: lmsAssignment.id,
                      LMSCourseId: lmsCourse.id,
                      isInProgress,
                      isSubmitted,
                      scorePerPoints,
                    });
                  }
                } catch (err) {
                  const { original } = err;
                  if (original) {
                    const { code } = original;
                    if (code !== "ER_DUP_ENTRY") {
                      throw err;
                    }
                  }
                }
              }
              break;

            case "Eclass":
              const eclassClient = new EclassScraperClient(studId, studPwd);
              await eclassClient.initSSOclient();

              let eclassCourse;

              retData = await eclassClient.getEclassCourseData();
              for (let courseName in retData) {
                const {
                  courseTime,
                  courseUri,
                  anncmntUri,
                  homeworkUri,
                  boardUri,
                } = retData[courseName];

                try {
                  eclassCourse = await EclassCourse.build({
                    courseName,
                    courseUri,
                    anncmntUri,
                    homeworkUri,
                    boardUri,
                  });
                  eclassCourse.setSerializedCourseTimes(courseTime);
                  await eclassCourse.save();

                  await EclassStudent.create({
                    EclassCourseId: eclassCourse.id,
                    UserId: userId,
                  });
                } catch (err) {
                  const { original } = err;
                  if (original) {
                    const { code } = original;
                    if (code === "ER_DUP_ENTRY") {
                      eclassCourse = await EclassCourse.findOne({
                        where: {
                          courseUri,
                        },
                      });
                    } else {
                      throw err;
                    }
                  }
                }

                const anncmnts = await eclassClient.getAnncmntsByUri(
                  anncmntUri
                );
                for (let p in anncmnts) {
                  const {
                    postId,
                    title,
                    boardUri,
                    uploadedAt,
                    isFileAttached,
                  } = anncmnts[p];

                  try {
                    const post = await Post.create({
                      postId,
                      title,
                      boardUri,
                      uploadedAt,
                    });

                    const courseAnncmnt = await EclassCourseAnncmnt.build({
                      PostId: post.id,
                      EclassCourseId: eclassCourse.id,
                      isFileAttached,
                    });
                    courseAnncmnt.setAnncmntTypeByName("EclassCourseAnncmnt");
                    await courseAnncmnt.save();
                  } catch (err) {
                    const { original } = err;
                    if (original) {
                      const { code } = original;
                      if (code !== "ER_DUP_ENTRY") {
                        throw err;
                      }
                    }
                  }
                }

                const boards = await eclassClient.getBoardPostsByUri(boardUri);
                for (let q in boards) {
                  const {
                    postId,
                    title,
                    boardUri,
                    uploadedAt,
                    isFileAttached,
                  } = anncmnts[q];

                  try {
                    const post = await Post.create({
                      postId,
                      title,
                      boardUri,
                      uploadedAt,
                    });

                    const courseBoard = await EclassCourseAnncmnt.build({
                      PostId: post.id,
                      EclassCourseId: eclassCourse.id,
                      isFileAttached,
                    });
                    courseBoard.setAnncmntTypeByName("EclassCourseBoard");
                    await courseBoard.save();
                  } catch (err) {
                    const { original } = err;
                    if (original) {
                      const { code } = original;
                      if (code !== "ER_DUP_ENTRY") {
                        throw err;
                      }
                    }
                  }
                }

                const assignments = await eclassClient.getHomeworksByUri(
                  homeworkUri
                );
                for (let r in assignments) {
                  const {
                    postId,
                    title,
                    boardUri,
                    dueDateTime,
                    status,
                    score,
                  } = assignments[r];

                  try {
                    const assignment = await Assignment.create({
                      postId,
                      title,
                      boardUri,
                      dueDateTime,
                    });

                    await EclassCourseAssignment.create({
                      UserId: userId,
                      AssignmentId: assignment.id,
                      EclassCourseId: eclassCourse.id,
                      status,
                      score,
                    });
                  } catch (err) {
                    const { original } = err;
                    if (original) {
                      const { code } = original;
                      if (code !== "ER_DUP_ENTRY") {
                        throw err;
                      }
                    }
                  }
                }
              }
              break;

            case "JW4Dept":
              if (!user.majorDeptCode) {
                break;
              }

              const jw4DeptClient = new JW4DeptScraperClient(
                studId,
                studPwd,
                user.majorDeptCode,
                jw4DeptCode[user.majorDeptCode].boardUri
              );
              await jw4DeptClient.initSSOclient();

              const deptAnncmnts = await jw4DeptClient.getDeptAnncmnts();
              for (let p in deptAnncmnts) {
                const { postId, title, boardUri, uploadedAt, isFileAttached } =
                  deptAnncmnts[p];

                try {
                  const post = await Post.create({
                    postId,
                    title,
                    boardUri,
                    uploadedAt,
                  });

                  const generalAnncmnt = await GeneralAnncmnt.build({
                    PostId: post.id,
                    isFileAttached,
                  });
                  generalAnncmnt.setAnncmntTypeByName("JW4DeptAnncmnt");
                  await generalAnncmnt.save();

                  await JW4DeptAnncmnt.create({
                    GeneralAnncmntId: generalAnncmnt.id,
                    deptCode: user.majorDeptCode,
                  });
                } catch (err) {
                  const { original } = err;
                  if (original) {
                    const { code } = original;
                    if (code !== "ER_DUP_ENTRY") {
                      throw err;
                    }
                  }
                }
              }
              break;
          }
        }

        const userSetting = await UserSetting.findOne({
          where: {
            UserId: userId,
          },
        });
        serviceQueue.addServiceToUser(userId, userSetting.updateInterval);

        await sendNotification(userId);
      } catch (err) {
        console.error(err);
        throw err;
      }
    });
  } catch (err) {
    throw err;
  }
}

module.exports = updateData;
