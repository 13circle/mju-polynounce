/**
 * @module LMSScraperClient
 */

/**
 * @module MJUScraperClient
 * @description Superclass of LMSScraperClient
 */
const MJUScraperClient = require("./MJUScraperClient");

/**
 * @class LMSScraperClient
 * @extends MJUScraperClient
 */
class LMSScraperClient extends MJUScraperClient {
  /**
   * @constructs LMSScraperClient
   * @description Initialize new REST client manager for MJU LMS
   * 
   * @param {string} userId MJU SSO user ID (i.e. Student ID)
   * @param {string} userPwd MJU SSO user password
   */
  constructor(userId, userPwd) {
    const { LMS_REDIRECT_URI } = process.env;

    super(userId, userPwd, LMS_REDIRECT_URI, null);
  }

  /**
   * @method parseLmsAttendenceDates
   * @description
   * 
   * - Parse `datesIntvStr` into valid attendence `startDate` and `dueDate`
   * - e.g.
   *   ```
   *   datesIntvStr = "2021.05.18 오전 12:00 ~ 2021.05.31 오후 11:59";
   *   const {
   *     startDate, // msec value at 00:00 AM in May 18th, 2021
   *     dueDate,   // msec value at 11:59 PM in May 31st, 2021
   *   } = this.parseLmsAttendenceDates(datesIntvStr);
   *   ```
   * 
   * @param {string} datesIntvStr Attendence dates string
   * @returns {Object} `startDate` and `dueDate` of the lecture
   */
  parseLmsAttendenceDates(datesIntvStr) {
    const attdDateTimes = datesIntvStr
      .trim()
      .split("~")
      .map((dStr) => {
        const dtStrs = dStr.trim().split(" ");

        dtStrs[0] = dtStrs[0].split(".").map((v) => parseInt(v));
        dtStrs[0][1] -= 1;
        dtStrs[2] = dtStrs[2].split(":").map((v) => parseInt(v));

        if (dtStrs[1] === "오후") {
          dtStrs[2][0] += 12;
        } else if (dtStrs[2][0] === 12) {
          dtStrs[2][0] = 0;
        }

        return dtStrs;
      });

    return {
      startDate: new Date(
        attdDateTimes[0][0][0],
        attdDateTimes[0][0][1],
        attdDateTimes[0][0][2],
        attdDateTimes[0][2][0],
        attdDateTimes[0][2][1]
      ).getTime(),
      dueDate: new Date(
        attdDateTimes[1][0][0],
        attdDateTimes[1][0][1],
        attdDateTimes[1][0][2],
        attdDateTimes[1][2][0],
        attdDateTimes[1][2][1]
      ).getTime(),
    };
  }

  /**
   * @method getCurrentLmsCourses
   * @description Get the list of information of LMS courses
   * 
   * @returns {Object[]} List of `name` and `kjkey` of LMS courses
   */
  async getCurrentLmsCourses() {
    try {
      await this.httpGet("/ilos/bandi/sso/index.jsp");

      await this.httpGet("/ilos/lo/login_bandi_sso.acl");

      await this.httpGet("/ilos/main/main_form.acl");

      await this.httpGet("/ilos/mp/course_register_list_form.acl");

      const currDate = new Date(this.getResHeaders().date);
      const YEAR = currDate.getFullYear().toString();
      const mth = currDate.getMonth() + 1;
      const TERM =
        3 <= mth && mth <= 6 ? "1" : 9 <= mth && mth <= 12 ? "2" : "";

      await this.httpPost(
        "/ilos/mp/course_register_list.acl",
        this.qsBody({
          YEAR,
          TERM,
          encoding: "utf-8",
        })
      );

      const $ = this.loadCheerioFromResData();
      const courses = [];

      $("span.content-title").each((i, e) => {
        courses.push({
          name: $(e).text(),
          kjkey: $(e).parent().attr("onclick").split("'")[1],
        });
      });

      return courses;
    } catch (err) {
      console.log(this.handleAxiosError(err));

      return null;
    }
  }

  /**
   * @method getLmsCourseData
   * @description Get weekly data of the LMS course by the given `kjkey`
   * 
   * @param {string} kjkey Unique kjkey of the LMS course
   * @returns {Object[]} List of weekly lecture data w/ progresses
   */
  async getLmsCourseData(kjkey) {
    try {
      await this.httpPost(
        "/ilos/st/course/eclass_room2.acl",
        this.qsBody({
          KJKEY: kjkey,
          FLAG: "mp",
          returnURI: "/ilos/st/course/submain_form.acl",
          encoding: "utf-8",
        })
      );

      const { isError, message } = this.getResData();

      if (isError) {
        console.log(message);
        return null;
      }

      await this.httpGet("/ilos/st/course/online_list_form.acl");

      const $ = this.loadCheerioFromResData();
      const wkArr = [];

      const kj_lect_type = $('form[name="myform"]')
        .find("#kj_lect_type")
        .attr("value");

      $("#chart .wb").each((i, e) => {
        wkArr.push({
          wkNum: parseInt($(e).attr("id").split("-").pop()),
          lectures: [],
        });
      });

      for (let i = 0, l = wkArr.length; i < l; i++) {
        await this.httpPost(
          "/ilos/st/course/online_list.acl",
          this.qsBody({
            ud: this.userId,
            ky: kjkey,
            WEEK_NO: wkArr[i].wkNum,
            encoding: "utf-8",
          })
        );

        const $ = this.loadCheerioFromResData();

        $(".lecture-box").each((j, e) => {
          const videos = [];

          $(e)
            .first()
            .find("ul > li > ol > li:last-child > div > div")
            .each((k, v) => {
              let viewInfo = $("span.site-mouseover-color").attr("onclick");
              if (viewInfo) {
                viewInfo = viewInfo
                  .replace("viewGo('", "")
                  .replace("');", "")
                  .replaceAll(" ", "")
                  .split("','");
              } else {
                viewInfo = [];
              }

              videos.push({
                videoName: $(v).first().find("span").text(),
                viewInfo: {
                  lecture_weeks: viewInfo[1],
                  WEEK_NO: viewInfo[0],
                  _KJKEY: kjkey,
                  kj_lect_type,
                  item_id: viewInfo[4],
                  force: "",
                },
                progress: {
                  percentage: $(v).last().find("div#per_text").text(),
                  detail: $(v).last().find("div#per_text").next().text(),
                },
              });
            });

          const { startDate, dueDate } = this.parseLmsAttendenceDates(
            $(e)
              .find("ul > li > ol > li:nth-child(2) > div:last-child")
              .text()
              .split(" : ")
              .pop()
          );

          wkArr[i].lectures.push({
            lectureName: $(e)
              .first()
              .find("ul > li > ol > li:first-child > div:last-child")
              .text()
              .trim(),
            startDate,
            dueDate,
            videos,
          });
        });
      }

      return wkArr;
    } catch (err) {
      console.log(this.handleAxiosError(err));

      return null;
    }
  }

  /**
   * @method getLmsCourseAnncmnts
   * @description Get the list of anncmnts of the LMS course by the given `kjkey`
   * 
   * @param {string} kjkey Unique kjkey of the LMS course
   * @returns {Object[]} List of `url` and `view` of the course anncmnts
   */
  async getLmsCourseAnncmnts(kjkey) {
    let $ = null;

    try {
      await this.httpPost(
        "/ilos/st/course/eclass_room2.acl",
        this.qsBody({
          KJKEY: kjkey,
          FLAG: "mp",
          returnURI: "/ilos/st/course/submain_form.acl",
          encoding: "utf-8",
        })
      );

      const { isError, message } = this.getResData();

      if (isError) {
        console.log(message);
        return null;
      }

      await this.httpGet("/ilos/st/course/notice_list_form.acl");

      $ = this.loadCheerioFromResData();

      await this.httpPost(
        "/ilos/st/course/notice_list.acl",
        this.qsBody({
          start: "",
          display: "1",
          SCH_VALUE: $("#SCH_VALUE").val(),
          ud: this.userId,
          ky: kjkey,
          encoding: "utf-8",
        })
      );

      $ = this.loadCheerioFromResData();
      const anncmnts = [];

      $("td.left").each((i, e) => {
        anncmnts.push({
          subject: $(e).find("a.site-link > div:first-child").text(),
          url: $(e).attr("onclick").split("'")[1],
          view: "",
        });
      });

      for (let i in anncmnts) {
        await this.httpGet(anncmnts[i].url);
        $ = this.loadCheerioFromResData();
        anncmnts[i].view = `<table border="1">${$(
          "table.bbsview"
        ).html()}</table>`;
      }

      return anncmnts;
    } catch (err) {
      console.log(this.handleAxiosError(err));

      return null;
    }
  }

  /**
   * @method getLmsAnncmnts
   * @description Get the list of common LMS anncmnts for all students
   * 
   * @returns {Object[]} List of `url` and `view` of the anncmnts
   */
  async getLmsAnncmnts() {
    let $ = null;

    try {
      await this.httpGet("/ilos/community/notice_list_form.acl");

      $ = this.loadCheerioFromResData();

      await this.httpPost(
        "/ilos/community/notice_list.acl",
        this.qsBody({
          SCH_KEY: $("#SCH_KEY").val(),
          SCH_VALUE: $("#SCH_VALUE").val(),
          start: "",
          encoding: "utf-8",
        })
      );

      $ = this.loadCheerioFromResData();

      const anncmnts = [];

      $("td.left > a.site-link").each((i, e) => {
        anncmnts.push({
          title: $(e).text(),
          url: $(e).attr("href"),
        });
      });

      return anncmnts;
    } catch (err) {
      console.log(this.handleAxiosError(err));

      return null;
    }
  }
}

module.exports = LMSScraperClient;
