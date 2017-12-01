const cookie = require('cookie');

function parseCookie(header) {
  return header ? cookie.parse(header) : {};
}

class FloofRequest {
  constructor(endpoint, req, path, params, queries) {
    this.path = endpoint.path;
    this.body = null;
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
    return this.backing.headers[key] || null;
  }
  
  param(key) {
    return this.params.get(key);
  }
  
  query(key) {
    return this.queries.get(key);
  }
  
  cookie(key) {
    return this.cookies.get(key);
  }
  
  async body() {
    if (this.body) return this.body;
    return this.body = await this.endpoint.parseBody(this.backing);
  }
}

class Stoof {
  constructor(code, body) {
    if (!body) {
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
}

const validRedirCodes = [301, 302, 303, 305, 307];

function redirect(url, code = 302) {
  if (!validRedirCodes.includes(code)) throw new Error(`Invalid redirect ${code}`);
  return new Stoof(code, '').header('Location', url);
}

class Floop extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

module.exports = {FloofRequest, Stoof, redirect, Floop};