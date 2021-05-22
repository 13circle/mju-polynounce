/**
 * @module MJUScraperClient
 *
 * @typedef {import("axios").AxiosRequestConfig} AxiosRequestConfig
 * @typedef {import("axios").AxiosResponse} AxiosResponse
 * @typedef {import("axios").AxiosError} AxiosError
 * @typedef {import("cheerio").CheerioAPI} CheerioAPI
 */

/**
 * @package axios
 * @description REST client
 */
 const axios = require("axios").default;

 /**
  * @package axios-cookiejar-support
  * @description Plugin package to implement CookieJar in Axios
  */
 const axiosCookieJarSupport = require("axios-cookiejar-support").default;
 
 /**
  * @package cheerio
  * @description HTML-to-DOM parser using jQuery syntax
  */
 const cheerio = require("cheerio");
 
 /**
  * @package qs
  * @description Query string parser for application/x-www-form-urlencoded
  */
 const qs = require("qs");
 
 /**
  * @package tough-cookie
  * @description Package to implement browser cookie in Node.js
  */
 const toughCookie = require("tough-cookie");
 
 /**
  * @class MJUScraperClient
  */
 class MJUScraperClient {
   /**
    * @name #userId
    * @readonly
    * @type {string}
    * @description MJU SSO user ID (i.e. Student ID)
    */
   #userId;
 
   /**
    * @name #userPwd
    * @private
    * @type {string}
    * @description MJU SSO user password
    */
   #userPwd;
 
   /**
    * @name #ssoClient
    * @private
    * @type {string}
    * @description Axios instance as REST client
    */
   #ssoClient;
 
   /**
    * @name #cookieJar
    * @private
    * @type {string}
    * @description Cookie Jar for SSO session management
    */
   #cookieJar;
 
   /**
    * @name axiosRes
    * @private
    * @type {AxiosResponse}
    * @description Field for temporary AxiosResponse object
    */
   #axiosRes;
 
   /**
    * @name _isUserValid
    * @readonly
    * @type {boolean}
    * @description Boolean field to verify user validation
    */
   #isUserValid;
 
   /**
    * @name redirectUri
    * @public
    * @type {string}
    * @description Redirection URI used after SSO login
    */
   redirectUri;
 
   /**
    * @name defaultAxiosConfigs
    * @public
    * @type {AxiosRequestConfig}
    * @description Default AxiosRequest configuration object
    */
   defaultAxiosConfigs;
 
   /**
    * @constructs MJUScraperClient
    * @description Initialize new REST client manager
    *
    * @param {string} userId MJU SSO user ID (i.e. Student ID)
    * @param {string} userPwd MJU SSO user password
    * @param {string} redirectUri Redirection URI used after SSO login
    * @param {AxiosRequestConfig} [defaultAxiosConfigs] Default AxiosRequest configuration object
    */
   constructor(userId, userPwd, redirectUri, defaultAxiosConfigs) {
     this.#userId = userId;
     this.#userPwd = userPwd;
     this.redirectUri = redirectUri;
     this.defaultAxiosConfigs = this.defaultAxiosConfigs ||
       defaultAxiosConfigs || {
         withCredentials: true,
         timeout: 5000,
         baseURL: "https://sso1.mju.ac.kr",
       };
 
     this.#isUserValid = false;
   }
 
   /**
    * @name userId
    * @readonly
    * @type {string}
    * @description String getter for userId (i.e. student ID)
    */
   get userId() {
     return this.#userId;
   }
 
   /**
    * @name isUserValid
    * @readonly
    * @type {boolean}
    * @description Boolean getter verifying user validation
    */
   get isUserValid() {
     return this.#isUserValid;
   }
 
   /**
    * @method handleAxiosError
    * @description
    * #### Case 1: `err` is AxiosError
    *   - Returns as follow:
    *    ```
    *    {
    *      // boolean, AxiosResponse.isAxiosError
    *      isAxiosError,
    *
    *      // string, Requested URL (base URL is excluded)
    *      url,
    *
    *      // string, HTTP request method
    *      method,
    *
    *      // string, Response data from AxiosResponse.data
    *      data,
    *
    *      // Object, Header fields in AxiosResponse.headers
    *      headers,
    *    }
    *    ```
    * #### Case 2: `err` is not AxiosError
    *   - Returns normal `Error` object with stacktraces
    *
    * @param {AxiosError|Error} err Error object
    * @returns {Object|Error} Custom error analysis object or Error object
    */
   handleAxiosError(err) {
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
 
       return errObj;
     } else {
       return err;
     }
   }
 
   /**
    * @method getBaseUrl
    * @description Extract base URL from `url`
    *
    * @param {string} url URL to extract base URL
    * @returns {string} base URL extracted from `url`
    */
   getBaseUrl(url) {
     const urlStrs = url.split("/");
 
     return `${urlStrs[0]}//${urlStrs[2]}`;
   }
 
   /**
    * @method loadCheerio
    * @description Load CheerioAPI to parse `html` to DOM
    *
    * @param {string} html Plaintext HTML
    * @returns {CheerioAPI} CheerioAPI instance
    */
   loadCheerio(html) {
     return cheerio.load(html, { decodeEntities: false });
   }
 
   /**
    * @method qsBody
    * @description Serialize `obj` to query string for application/x-www-form-urlencoded
    *
    * @param {Object} obj Data to be parsed into query string
    * @returns {string} Serialized query string data parsed from `obj`
    */
   qsBody(obj) {
     return qs.stringify(obj);
   }
 
   /**
    * @method initSSOclient
    * @description Initialize Axios instance for MJU SSO authentication
    *
    * @returns {Promise<void>}
    */
   async initSSOclient() {
     this.#ssoClient = axios.create(this.defaultAxiosConfigs);
     this.#cookieJar = new toughCookie.CookieJar();
 
     axiosCookieJarSupport(this.#ssoClient);
     this.#ssoClient.defaults.jar = this.#cookieJar;
 
     try {
       await this.#ssoClient.get(`/login.do?redirect_uri=${this.redirectUri}`);
 
       this.#axiosRes = await this.#ssoClient.post(
         "/mju/userCheck.do",
         this.qsBody({
           id: this.#userId,
           passwrd: this.#userPwd,
         })
       );
 
       const { error, error_message } = this.#axiosRes.data;
 
       if (error !== "0000" && error !== "VL-3130") {
         this.#isUserValid = false;
         console.log(error_message);
         return;
       }
 
       const userObj = {
         user_id: this.#userId,
         user_pwd: this.#userPwd,
         redirect_uri: this.redirectUri,
       };
 
       await this.#ssoClient.post(
         "/login/ajaxActionLogin2.do",
         this.qsBody(userObj)
       );
 
       await this.#ssoClient.post("/oauth2/token2.do", this.qsBody(userObj));
 
       this.#ssoClient.defaults.baseURL = this.getBaseUrl(this.redirectUri);
 
       await this.#ssoClient.get(this.redirectUri);
 
       this.#isUserValid = true;
     } catch (err) {
       console.log(this.handleAxiosError(err));
     }
   }
 
   /**
    * @method httpGet
    * @description Use REST client to request HTTP GET
    * 
    * @param {string} url GET request URL
    * @param {AxiosRequestConfig} [axiosConfigs] Axios configurations for the request
    * @returns {Promise<AxiosResponse>} AxiosResponse from HTTP GET request
    */
   async httpGet(url, axiosConfigs) {
     this.#axiosRes = await this.#ssoClient.get(url, axiosConfigs || {});
 
     return this.#axiosRes;
   }
 
   /**
    * @method httpGet
    * @description Use REST client to request HTTP POST
    * 
    * @param {string} url POST request URL
    * @param {Object} body Payload to send at POST request
    * @param {AxiosRequestConfig} [axiosConfigs] Axios configurations for the request
    * @returns {Promise<AxiosResponse>} AxiosResponse from HTTP POST request
    */
   async httpPost(url, body, axiosConfigs) {
     this.#axiosRes = await this.#ssoClient.post(url, body, axiosConfigs || {});
 
     return this.#axiosRes;
   }
 
   /**
    * @method getResHeaders
    * @description Get HTTP response header fields
    * 
    * @returns {Object} AxiosResponse.headers
    */
   getResHeaders() {
     return this.#axiosRes.headers;
   }
 
   /**
    * @method getResData
    * @description Get HTTP response data
    * 
    * @returns {Object} AxiosResponse.data
    */
   getResData() {
     return this.#axiosRes.data;
   }

   /**
    * @method loadCheerioFromResData
    * @description Load CheerioAPI from HTML reponse data
    * 
    * @returns {CheerioAPI} CheerioAPI based on this.#axiosRes.data
    */
   loadCheerioFromResData() {
     return this.loadCheerio(this.getResData());
   }
 }
 
 module.exports = MJUScraperClient;
 