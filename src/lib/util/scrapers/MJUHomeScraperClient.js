const MJUScraperClient = require("./MJUScraperClient");

/**
 * @class MJUHomeScraperClient
 * @extends MJUScraperClient
 */
class MJUHomeScraperClient extends MJUScraperClient {
  constructor(userId, userPwd) {
    const mjuHomeRedirectUri = "https://www.mju.ac.kr/mjukr/index.do";

    super(userId, userPwd, mjuHomeRedirectUri, null);
  }

  async getAnncmntsPerPage(anncmntTypeNum, page) {
    try {
      await this.httpPost(
        `/bbs/mjukr/${anncmntTypeNum}/artclList.do`,
        this.qsBody({ page })
      );

      const $ = this.loadCheerioFromResData();
      const anncmnts = [];

      $("table.artclTable > tbody > tr").each((i, tr) => {
        const boardUrl = $(tr).find("td._artclTdTitle > a").attr("href");
        const postId = boardUrl.split("/")[4];
        const [yr, mth, dt] = $(tr)
          .find("td._artclTdRdate")
          .text()
          .split(".")
          .map((dtv) => parseInt(dtv));

        const anncmnt = {
          postId,
          title: $(tr).find("td._artclTdTitle > a > strong").text(),
          boardUrl,
          uploadedAt: new Date(yr, mth - 1, dt).getTime(),
          isNew: $(tr).find("td._artclTdTitle > a > span").text() !== "",
          isFileAttached:
            $(tr).find("td._artclTdAtchFile > span").text() !== "",
        };

        anncmnts.push(anncmnt);
      });

      return {
        page,
        lastPage: this.getLastAnncmntInCurPage(),
        data: anncmnts,
      };
    } catch (err) {
      throw err;
    }
  }

  getLastAnncmntInCurPage() {
    const $ = this.loadCheerioFromResData();

    return parseInt($("a._last").attr("href").split("'")[1]);
  }

  async getGeneralAnncmntsPerPage(page) {
    try {
      const anncmnts = await this.getAnncmntsPerPage(141, page);

      return anncmnts;
    } catch (err) {
      throw err;
    }
  }

  async getEventAnncmntsPerPage(page) {
    try {
      const anncmnts = await this.getAnncmntsPerPage(142, page);

      return anncmnts;
    } catch (err) {
      throw err;
    }
  }

  async getAcademicAnncmntsPerPage(page) {
    try {
      const anncmnts = await this.getAnncmntsPerPage(143, page);

      return anncmnts;
    } catch (err) {
      throw err;
    }
  }

  async getEtcAnncmntsPerPage(page) {
    try {
      const anncmnts = await this.getAnncmntsPerPage(144, page);

      return anncmnts;
    } catch (err) {
      throw err;
    }
  }

  async getScholarshipAnncmntsPerPage(page) {
    try {
      const anncmnts = await this.getAnncmntsPerPage(145, page);

      return anncmnts;
    } catch (err) {
      throw err;
    }
  }

  async getCareerAnncmntsPerPage(page) {
    try {
      const anncmnts = await this.getAnncmntsPerPage(146, page);

      return anncmnts;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = MJUHomeScraperClient;
