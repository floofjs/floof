const cookie = require('cookie');
const httpStatus = require('http-status');

function parseCookie(header) {
  return header ? cookie.parse(header) : {};
}

class FloofRequest {
  constructor(endpoint, req, path, params, queries) {
    this.path = endpoint.path;
    this.bodyCached = null;
    this.bodyParserFunc = endpoint.parseBody.bind(endpoint);
    this.backing = req;
    this.method = req.method;
    this.code = req.statusCode;
    this.status = req.statusMessage;
    this.rawUrl = req.url;
    this.url = path;
    this.params = params;
    this.queries = queries;
    this.cookies = parseCookie(this.header('Cookie'));
  }
  
  header(key) {
    return this.backing.headers[key.toLowerCase()] || null;
  }
  
  param(key) {
    return this.params.get(key);
  }
  
  query(key) {
    return this.queries.get(key);
  }
  
  cookie(key) {
    return this.cookies[key] || null;
  }
  
  async body() {
    if (this.bodyCached) return this.bodyCached;
    return this.bodyCached = await this.bodyParserFunc(this.backing);
  }
}

const epochDate = new Date(0);

class Stoof {
  constructor(code, body) {
    if (body === undefined) {
      this.code = 200;
      this.body = code;
    } else {
      this.code = code;
      this.body = body;
    }
    this.headers = [];
  }
  
  header(key, value) {
    this.headers.push([key, value]);
    return this;
  }
  
  cookie(key, value, maxAge = null, path = null) {
    const opts = {};
    if (maxAge) opts['maxAge'] = maxAge;
    if (path) opts['path'] = path;
    return this.header('Set-Cookie', cookie.serialize(key, value, opts));
  }
  
  uncookie(key, path = null) {
    const opts = {expires: epochDate};
    if (path) opts['path'] = path;
    return this.header('Set-Cookie', cookie.serialize(key, '', opts));
  }
}

const validRedirCodes = [301, 302, 303, 305, 307];

function redirect(url, code = 302) {
  if (!validRedirCodes.includes(code)) throw new Error(`Invalid redirect ${code}`);
  return new Stoof(code, '').header('Location', url);
}

class Floop extends Error {
  constructor(code, message = null) {
    super(message || httpStatus[code]);
    this.code = code;
  }
}

module.exports = {FloofRequest, Stoof, redirect, Floop};