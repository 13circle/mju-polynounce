const MJUScraperClient = require("./MJUScraperClient");

/**
 * @class JW4DeptScraperClient
 * @extends MJUScraperClient
 */
class JW4DeptScraperClient extends MJUScraperClient {
  #boardUri;

  constructor(userId, userPwd, jw4DeptCode, boardUri) {
    const deptRedirectUri = `http://jw4.mju.ac.kr/user/${jw4DeptCode}/index.action`;

    super(userId, userPwd, deptRedirectUri, null);

    this.#boardUri = boardUri;
  }

  async getDeptAnncmnts() {
    const anncmnts = [];

    try {
      await this.httpGet(this.#boardUri);

      const $ = this.loadCheerioFromResData();

      $("table > tbody > tr").each((i, tr) => {
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
          postId: parseInt($(tr).find("td:first-child").text().trim()) || 0,
          title: $(tr).find("td:nth-child(2) > a").text().trim(),
          boardUri: `/user/${$(tr).find("td:nth-child(2) > a").attr("href")}`,
          uploadedAt,
          isFileAttached: $(tr).find("td:last-child > a").length > 0,
        });
      });

      return anncmnts;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = JW4DeptScraperClient;
