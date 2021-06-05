"use strict";

require("./init.test");

const { TEST_USER_ID, TEST_USER_PASSWORD, TEST_DEPT } = process.env;

if (!TEST_USER_ID || !TEST_USER_PASSWORD || !TEST_DEPT) {
  throw Error("TEST_USER_ID, TEST_USER_PASSWORD & TEST_DEPT must be specified");
}

const MJUHomeScraperClient = require("@scrapers/MJUHomeScraperClient");
const EclassScraperClient = require("@scrapers/EclassScraperClient");
const LMSScraperClient = require("@scrapers/LMSScraperClient");
const JW4DeptScraperClient = require("@scrapers/JW4DeptScraperClient");
const MyiwebScraperClient = require("@scrapers/MyiwebScraperClient");

const jw4DeptCode = require("@config/jw4DeptCode");

describe("Scraper Test", function () {
  this.timeout(30000);

  it("MJUHomeScraperClient", async () => {
    const homeClient = new MJUHomeScraperClient(
      TEST_USER_ID,
      TEST_USER_PASSWORD
    );
    try {
      await homeClient.initSSOclient();
      await homeClient.getGeneralAnncmntsPerPage(1);
      await homeClient.getEventAnncmntsPerPage(1);
      await homeClient.getAcademicAnncmntsPerPage(1);
      await homeClient.getEtcAnncmntsPerPage(1);
      await homeClient.getScholarshipAnncmntsPerPage(1);
      await homeClient.getCareerAnncmntsPerPage(1);
    } catch (err) {
      throw err;
    }
  });

  it("EclassScraperClient", async () => {
    const eclassClient = new EclassScraperClient(
      TEST_USER_ID,
      TEST_USER_PASSWORD
    );
    try {
      await eclassClient.initSSOclient();
      const courses = await eclassClient.getEclassCourseData();
      const { anncmntUri, homeworkUri, boardUri } =
        courses[Object.keys(courses)[0]];
      await eclassClient.getAnncmntsByUri(anncmntUri);
      await eclassClient.getHomeworksByUri(homeworkUri);
      await eclassClient.getBoardPostsByUri(boardUri);
    } catch (err) {
      throw err;
    }
  });

  it("JW4DeptScraperClient", async () => {
    const deptClient = new JW4DeptScraperClient(
      TEST_USER_ID,
      TEST_USER_PASSWORD,
      jw4DeptCode[TEST_DEPT]
    );
    try {
      await deptClient.initSSOclient();
      await deptClient.getDeptAnncmnts();
    } catch (err) {
      throw err;
    }
  });

  it("LMSScraperClient", async () => {
    const lmsClient = new LMSScraperClient(TEST_USER_ID, TEST_USER_PASSWORD);
    try {
      await lmsClient.initSSOclient();
      const courses = await lmsClient.getCurrentLmsCourses();
      const { kjkey } = courses[0];
      await lmsClient.getLmsCourseData(kjkey);
      await lmsClient.getLmsCourseAnncmnts(kjkey);
      await lmsClient.getLmsCourseAssignments(kjkey);
      await lmsClient.getLmsAnncmnts();
    } catch (err) {
      throw err;
    }
  });

  it("MyiwebScraperClient", async () => {
    const myiwebClient = new MyiwebScraperClient(
      TEST_USER_ID,
      TEST_USER_PASSWORD
    );
    try {
      await myiwebClient.initSSOclient();
      const csrfConfig = await myiwebClient.loginToMyiweb();
      await myiwebClient.getRegisteredCourses(csrfConfig);
      await myiwebClient.getCurrentCourseGrades(csrfConfig);
    } catch (err) {
      throw err;
    }
  });
});
