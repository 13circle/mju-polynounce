/**
 * @module EclassScraperClient
 */

/**
 * @module MJUScraperClient
 * @description Superclass of LMSScraperClient
 */
const MJUScraperClient = require("./MJUScraperClient");

/**
 * @class EclassScraperClient
 * @extends MJUScraperClient
 */
class EclassScraperClient extends MJUScraperClient {
  /**
   * @constructs EclassScraperClient
   * @description Initialize new REST client manager for MJU Eclass
   *
   * @param {string} userId MJU SSO user ID (i.e. Student ID)
   * @param {string} userPwd MJU SSO user password
   */
  constructor(userId, userPwd) {
    const eclassRedirectUri = "https://home.mju.ac.kr/user/index.action";

    super(userId, userPwd, eclassRedirectUri, null);
  }

  /**
   * @method getEclassCourseData
   * @description Get the list of board URIs of each Eclass courses
   *
   * @returns {Object[]} List of board URIs of each Eclass courses
   */
  async getEclassCourseData() {
    try {
      await this.httpGet("/course/courseList.action", {
        params: {
          command: "main",
          tab: "course",
        },
      });

      const $ = this.loadCheerioFromResData();
      const courseList = {};

      $("table.list > tbody > tr").each((i, e) => {
        const courseName = $(e).find("td:nth-child(2)").text().trim();
        const courseTime = $(e)
          .find("td:nth-child(3)")
          .text()
          .trim()
          .replace("&nbsp;", "");

        if (!courseList.hasOwnProperty(courseName)) {
          courseList[courseName] = {
            courseTime: [],
            courseUri: $(e).find("td:nth-child(4) > span > a").attr("href"),
            anncmntUri: "",
            homeworkUri: "",
            boardUri: "",
          };
        }

        courseList[courseName].courseTime.push(courseTime);
      });

      for (let courseName in courseList) {
        await this.httpGet(courseList[courseName].courseUri);

        const $ = this.loadCheerioFromResData();

        courseList[courseName].anncmntUri = $(
          "#MENU > li:nth-child(5) > a"
        ).attr("href");
        courseList[courseName].homeworkUri = $(
          "#MENU > li:nth-child(3) > a"
        ).attr("href");
        courseList[courseName].boardUri = $("#MENU > li:nth-child(7) > a").attr(
          "href"
        );
      }

      return courseList;
    } catch (err) {
      console.log(this.handleAxiosError(err));

      return null;
    }
  }

  async getAnncmntsByUri(anncmntUri) {
    const anncmnts = [];

    try {
      await this.httpGet(anncmntUri);

      const $ = this.loadCheerioFromResData();

      $("form[name=frm] > table > tbody > tr").each((i, tr) => {
        const dateVals = $(tr)
          .find("td:nth-child(4)")
          .text()
          .trim()
          .split("-")
          .map((d) => parseInt(d));
        const uploadedAt = new Date(
          dateVals[0],
          dateVals[1] - 1,
          dateVals[2]
        ).getTime();

        anncmnts.push({
          postId: parseInt($(tr).find("td:first-child").text().trim()),
          title: $(tr).find("td:nth-child(2) > a").text().trim(),
          boardUri: $(tr).find("td:nth-child(2) > a").attr("href"),
          uploadedAt,
          isFileAttached: $(tr).find("td:last-child").text().trim() !== "-",
        });
      });

      return anncmnts;
    } catch (err) {
      throw err;
    }
  }

  async getHomeworksByUri(homeworkUri) {
    const homeworks = [];

    try {
      await this.httpGet(homeworkUri);

      const $ = this.loadCheerioFromResData();

      $("form[name=frm] > table > tbody > tr").each((i, tr) => {
        const dateTimeStrs = $(tr)
          .find("td:nth-child(4)")
          .text()
          .trim()
          .replace("시", "")
          .split(" ");
        const dateVals = dateTimeStrs[0].split("-").map((d) => parseInt(d));
        const dueDateTime = new Date(
          dateVals[0],
          dateVals[1] - 1,
          dateVals[2],
          parseInt(dateTimeStrs[1])
        ).getTime();

        const score = parseInt($(tr).find("td:last-child").text().trim());

        homeworks.push({
          postId: parseInt($(tr).find("td:first-child").text().trim()),
          title: $(tr).find("td:nth-child(2) > a").text().trim(),
          boardUri: $(tr).find("td:nth-child(2) > a").attr("href"),
          dueDateTime,
          status: $(tr).find("td:nth-child(6)").text().trim(),
          score: isNaN(score) ? 0 : score,
        });
      });

      return homeworks;
    } catch (err) {
      throw err;
    }
  }

  async getBoardPostsByUri(boardUri) {
    try {
      const boardPosts = await this.getAnncmntsByUri(boardUri);

      return boardPosts;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = EclassScraperClient;
