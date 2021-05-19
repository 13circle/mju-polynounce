const {
  getAccessibleClient,
  handleAxiosError,
  loadCheerio,
  qsBody,
} = require("./mju-scraper-client");

async function getEclassCourseData(eclassClient) {
  let axiosRes;

  try {
    axiosRes = await eclassClient.get("/course/courseList.action", {
      params: {
        command: "main",
        tab: "course",
      },
    });

    const $ = loadCheerio(axiosRes.data);

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
      axiosRes = await eclassClient.get(courseList[courseName].courseUri);

      const $ = loadCheerio(axiosRes.data);

      courseList[courseName].anncmntUri = $("#MENU > li:nth-child(5) > a").attr(
        "href"
      );
      courseList[courseName].homeworkUri = $(
        "#MENU > li:nth-child(3) > a"
      ).attr("href");
      courseList[courseName].boardUri = $("#MENU > li:nth-child(7) > a").attr(
        "href"
      );
    }

    return courseList;
  } catch (err) {
    handleAxiosError(err);
    return null;
  }
}

async function getEclassClient(user_id, user_pwd) {
  const eclassClient = await getAccessibleClient(
    user_id,
    user_pwd,
    "https://home.mju.ac.kr/user/index.action",
    "https://home.mju.ac.kr",
    null
  );

  return eclassClient;
}

module.exports = {
  getEclassCourseData,
  getEclassClient,
};
