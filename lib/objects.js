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
  }
  
  header(key) {
    return this.req.headers[key] || null;
  }
  
  param(key) {
    return this.params.get(key);
  }
  
  query(key) {
    return this.queries.get(key);
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
    this.headers = new Map();
  }
  
  header(key, value) {
    this.headers.set(key, value);
    return this;
  }
}

class Floop extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

module.exports = {FloofRequest, Stoof, Floop};