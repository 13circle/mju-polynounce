const {
  getAccessibleClient,
  handleAxiosError,
  loadCheerio,
  qsBody,
} = require("./mju-scraper-client");

function parseLmsAttendenceDates(datesIntvStr) {
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

async function getCurrentLmsCourses(lmsClient) {
  let axiosRes = null;

  try {
    await lmsClient.get("/ilos/bandi/sso/index.jsp");

    await lmsClient.get("/ilos/lo/login_bandi_sso.acl");

    await lmsClient.get("/ilos/main/main_form.acl");

    axiosRes = await lmsClient.get("/ilos/mp/course_register_list_form.acl");

    const currDate = new Date(axiosRes.headers.date);
    const YEAR = currDate.getFullYear().toString();
    const mth = currDate.getMonth() + 1;
    const TERM = 3 <= mth && mth <= 6 ? "1" : 9 <= mth && mth <= 12 ? "2" : "";

    axiosRes = await lmsClient.post(
      "/ilos/mp/course_register_list.acl",
      qsBody({
        YEAR,
        TERM,
        encoding: "utf-8",
      })
    );

    const $ = loadCheerio(axiosRes.data);
    const courses = [];

    $("span.content-title").each((i, e) => {
      courses.push({
        name: $(e).text(),
        kjkey: $(e).parent().attr("onclick").split("'")[1],
      });
    });

    return courses;
  } catch (err) {
    handleAxiosError(err);
    return null;
  }
}

async function getLmsCourseData(lmsClient, user_id, KJKEY) {
  let axiosRes = null;

  try {
    axiosRes = await lmsClient.post(
      "/ilos/st/course/eclass_room2.acl",
      qsBody({
        KJKEY,
        FLAG: "mp",
        returnURI: "/ilos/st/course/submain_form.acl",
        encoding: "utf-8",
      })
    );

    const { isError, message } = axiosRes.data;

    if (isError) {
      console.log(message);
      return null;
    }

    axiosRes = await lmsClient.get("/ilos/st/course/online_list_form.acl");

    const $ = loadCheerio(axiosRes.data);
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
      axiosRes = await lmsClient.post(
        "/ilos/st/course/online_list.acl",
        qsBody({
          ud: user_id,
          ky: KJKEY,
          WEEK_NO: wkArr[i].wkNum,
          encoding: "utf-8",
        })
      );

      const $ = loadCheerio(axiosRes.data);

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
                _KJKEY: KJKEY,
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

        const { startDate, dueDate } = parseLmsAttendenceDates(
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
    handleAxiosError(err);
    return null;
  }
}

async function getLmsCourseAnncmnts(lmsClient, user_id, KJKEY) {
  let axiosRes = null, $;

  try {
    axiosRes = await lmsClient.get("/ilos/st/course/notice_list_form.acl");

    $ = loadCheerio(axiosRes.data);
    const SCH_VALUE = $("#SCH_VALUE").val();

    axiosRes = await lmsClient.post(
      "/ilos/st/course/notice_list.acl",
      qsBody({
        start: "",
        display: "1",
        SCH_VALUE,
        ud: user_id,
        ky: KJKEY,
        encoding: "utf-8",
      })
    );

    $ = loadCheerio(axiosRes.data);
    const anncmnts = [];

    $("td.left").each((i, e) => {
      anncmnts.push({
        subject: $(e).find("a.site-link > div:first-child").text(),
        url: $(e).attr("onclick").split("'")[1],
        view: "",
      });
    });

    for (let i in anncmnts) {
      axiosRes = await lmsClient.get(anncmnts[i].url);
      $ = loadCheerio(axiosRes.data);
      anncmnts[i].view = `<table border="1">${$("table.bbsview").html()}</table>`;
    }

    return anncmnts;
  } catch (err) {
    handleAxiosError(err);
    return null;
  }
}

async function getLmsAnncmnts(lmsClient) {
  let axiosRes = null, $;

  try {
    axiosRes = await lmsClient.get("/ilos/community/notice_list_form.acl");

    $ = loadCheerio(axiosRes.data);

    axiosRes = await lmsClient.post(
      "/ilos/community/notice_list.acl",
      qsBody({
        SCH_KEY: $("#SCH_KEY").val(),
        SCH_VALUE: $("#SCH_VALUE").val(),
        start: "",
        encoding: "utf-8",
      })
    );

    $ = loadCheerio(axiosRes.data);

    const anncmnts = [];

    $("td.left > a.site-link").each((i, e) => {
      anncmnts.push({
        title: $(e).text(),
        url: $(e).attr("href"),
      });
    });

    return anncmnts;
  } catch (err) {
    handleAxiosError(err);

    return null;
  }
}

async function getLmsClient(user_id, user_pwd) {
  const lmsClient = await getAccessibleClient(
    user_id,
    user_pwd,
    "http://lms.mju.ac.kr/ilos/bandi/sso/index.jsp",
    "https://lms.mju.ac.kr",
    null
  );

  return lmsClient;
}

module.exports = {
  getCurrentLmsCourses,
  getLmsCourseData,
  getLmsCourseAnncmnts,
  getLmsAnncmnts,
  getLmsClient,
};
