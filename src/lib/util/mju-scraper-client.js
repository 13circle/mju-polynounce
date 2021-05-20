const axios = require("axios").default;
const axiosCookieJarSupport = require("axios-cookiejar-support").default;
const cheerio = require("cheerio");
const qs = require("qs");
const { CookieJar } = require("tough-cookie");

function getBaseUrl(url) {
  const urlStrs = url.split("/");

  return `${urlStrs[0]}//${urlStrs[2]}`;
}

function handleAxiosError(err) {
  if (err.config) {
    const { url, method, data, headers } = err.config;
    const { isAxiosError } = err;

    const errObj = {
      isAxiosError,
      url,
      method,
      data,
      headers,
    };

    console.log(errObj);
  } else {
    console.log(err);
  }
}

function loadCheerio(html) {
  return cheerio.load(html, { decodeEntities: false });
}

function qsBody(obj) {
  return qs.stringify(obj);
}

async function getAccessibleClient(
  user_id,
  user_pwd,
  redirect_uri,
  defaultAxiosConfigs
) {
  const ssoClient = axios.create({
    ...(defaultAxiosConfigs || {
      withCredentials: true,
      timeout: 5000,
      baseURL: "https://sso1.mju.ac.kr",
    }),
  });

  axiosCookieJarSupport(ssoClient);

  ssoClient.defaults.jar = new CookieJar();

  let axiosRes;

  try {
    await ssoClient.get(`/login.do?redirect_uri=${redirect_uri}`);

    axiosRes = await ssoClient.post(
      "/mju/userCheck.do",
      qsBody({
        id: user_id,
        passwrd: user_pwd,
      })
    );

    const { error, error_message } = axiosRes.data;

    if (error !== "0000" && error !== "VL-3130") {
      console.log(error_message);
      return null;
    }

    await ssoClient.post(
      "/login/ajaxActionLogin2.do",
      qsBody({
        user_id,
        user_pwd,
        redirect_uri,
      })
    );

    await ssoClient.post(
      "/oauth2/token2.do",
      qsBody({
        user_id,
        user_pwd,
        redirect_uri,
      })
    );

    ssoClient.defaults.baseURL = getBaseUrl(redirect_uri);

    await ssoClient.get(redirect_uri);

    return ssoClient;
  } catch (err) {
    handleAxiosError(err);

    return null;
  }
}

module.exports = {
  handleAxiosError,
  loadCheerio,
  qsBody,
  getAccessibleClient,
};
