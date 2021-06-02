const MJUScraperClient = require("./MJUScraperClient");

/**
 * @class MyiwebScraperClient
 * @extends MJUScraperClient
 */
class MyiwebScraperClient extends MJUScraperClient {
  constructor(userId, userPwd) {
    const myiwebRedirectUri = "https://myiweb.mju.ac.kr/index_Myiweb.jsp";

    super(userId, userPwd, myiwebRedirectUri, null);
  }

  async loginToMyiweb() {
    let $ = null;

    try {
      await this.httpGet("/servlet/security/MySecurityStart");

      $ = this.loadCheerioFromResData();

      await this.httpPost(
        "/login",
        this.qsBody({
          user_id: this.userId,
          _csrf: $("form#command > input[name=_csrf]").val(),
        })
      );

      $ = this.loadCheerioFromResData();

      const csrfConfig = {
        headers: {
          "X-CSRF-TOKEN": $("form#topform > div > input[name=_csrf]").val(),
        },
      };

      return csrfConfig;
    } catch (err) {
      throw err;
    }
  }

  async getRegisteredCourses(csrfConfig) {
    const regCourses = [];
    let tmpRegCourse = null;

    try {
      if (!csrfConfig) {
        throw Error("Get csrfConfig from loginToMyiweb method");
      }

      await this.httpPost(
        "/servlet/su/sug/sug01/Sug01Svl03sug240_int?attribute=sug240_int",
        this.qsBody({
          sysdiv: "SCH",
          subsysdiv: "SCH",
          folderdiv: 103,
          pgmid: "W_SUG020",
        }),
        csrfConfig
      );

      const $ = this.loadCheerioFromResData();

      $("table.board_list > tbody > tr").each((i, tr) => {
        const $tr = $(tr);
        const tdLen = $tr.find("td").length;
        if (tdLen === 8) {
          const courseRoom = $tr.find("td:nth-child(7)").text().trim();
          tmpRegCourse = {
            courseNum: $tr.find("td:first-child").text().trim(),
            courseCode: $tr.find("td:nth-child(2)").text().trim(),
            courseName: $tr.find("td:nth-child(3)").text().trim(),
            courseProf: $tr.find("td:nth-child(4)").text().trim(),
            courseCredit: $tr.find("td:nth-child(5)").text().trim(),
            courseTime: [$tr.find("td:nth-child(6)").text().trim()],
            courseRoom: courseRoom.length === 0 ? [] : [courseRoom],
            courseCampus: $tr.find("td:last-child").text().trim(),
          };
          regCourses.push(tmpRegCourse);
        } else if (tdLen === 3 && i < 9) {
          const { courseTime, courseRoom } = tmpRegCourse;
          courseTime.push($tr.find("td:first-child").text().trim());
          if (courseRoom.length > 0) {
            courseRoom.push($tr.find("td:nth-child(2)").text().trim());
          }
        }
      });

      return regCourses;
    } catch (err) {
      throw err;
    }
  }

  async getCurrentCourseGrades(csrfConfig) {
    const curCourseGrades = [];

    try {
      if (!csrfConfig) {
        throw Error("Get csrfConfig from loginToMyiweb method");
      }

      await this.httpPost(
        "/servlet/su/suh/suh09/Suh09Svl01showCurrentGrade",
        this.qsBody({
          sysdiv: "SCH",
          subsysdiv: "SCH",
          folderdiv: 103,
          pgmid: "W_SUH015",
        }),
        csrfConfig
      );

      const $ = this.loadCheerioFromResData();

      $("table.board_list > tbody").each((i, tbody) => {
        const $tr = $(tbody).children().first();

        curCourseGrades.push({
          courseNum: $tr.find("input[name=list_courseCls]").val(),
          courseName: $tr.find("input[name=list_curinm]").val(),
          courseCredit: parseInt(
            $tr.find("td:last-child").prev().text().trim()
          ),
          courseGrade: $tr.find("td:last-child").text().trim(),
        });
      });

      return curCourseGrades;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = MyiwebScraperClient;
