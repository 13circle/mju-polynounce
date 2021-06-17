const { Post } = require("@models/Post");
const { GeneralAnncmnt } = require("@models/GeneralAnncmnt");
const { MJUHomeAnncmnt } = require("@models/MJUHomeAnncmnt");

const MJUHomeScraperClient = require("@scrapers/MJUHomeScraperClient");

const homeAnncmntMethods = [
  "getGeneralAnncmntsPerPage",
  "getEventAnncmntsPerPage",
  "getAcademicAnncmntsPerPage",
  "getEtcAnncmntsPerPage",
  "getScholarshipAnncmntsPerPage",
  "getCareerAnncmntsPerPage",
];

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

async function MJUHomeService(studId, studPwd) {
  try {
    const homeClient = new MJUHomeScraperClient(studId, studPwd);
    await homeClient.initSSOclient();

    for (let i = 0, l = homeAnncmntMethods.length; i < l; i++) {
      await getMJUHomeAnncmnts(homeClient, homeAnncmntMethods[i], i);
    }
  } catch (err) {
    throw err;
  }
}

module.exports = MJUHomeService;
