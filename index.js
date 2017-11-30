const {micro, send} = require('micro');
const FloofBall = require('./lib/floofball.js');
const FloofRenderer = require('./lib/renderer.js');

class FloofRequest {
  constructor(endpoint, req, path, params) {
    this.path = endpoint.path;
    this.body = await endpoint.parseBody(req);
    this.backing = req;
    this.method = req.method;
    this.code = req.statusCode;
    this.status = req.statusMessage;
    this.rawUrl = req.url;
    this.url = path;
    this.params = params;
  }
  
  header(key) {
    return this.req.headers[key] || null;
  }
  
  query(key) {
    return this.params.get(key);
  }
}

class Endpoint {
  constructor(floof) {
    this.floof = floof;
    // TODO impl
  }
  
  async render(req, path, params) {
    let wrapped = new FloofRequest(this, req, path, params);
    wrapped = new Proxy(wrapped, {
      // TODO traps
    });
  }
  
  async parseBody(body) {
    // TODO impl
  }
}

class EndpointRegistry {
  constructor(floof) {
    this.floof = floof;
  }
  
  register(floofball) {
    // TODO registration
  }
  
  resolve(path) {
    // TODO resolution
  }
  
  static parsePrelim(url) {
    // TODO parse
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

class Floof {
  constructor(options) {
    this.floofballs = [];
    this.endpoints = new EndpointRegistry(this);
    this.renderer = new FloofRenderer(this);
  }
  
  ball(floofball) {
    this.floofballs.push(floofball);
    this.endpoints.register(floofball);
    return this;
  }
  
  go(host = '127.0.0.1', port = 8080) {
    const server = micro(async (req, res) => {
      let response = await this.doRender(req, res);
      if (response instanceof Stoof) {
        for (const [key, value] of response.headers) {
          res.setHeader(key, value);
        }
        send(res, response.code, response.body);
      } else {
        send(res, 200, response);
      }
    });
    return new Promise((resolve, reject) => server.listen(port, host, resolve));
  }
  
  async doRender(req, res) {
    const {path, params} = EndpointRegistry.parsePrelim(req.url);
    const endpoint = this.endpoints.resolve(req.method, path);
    if (!endpoint) return await this.endpoints.error(404, `Resource not found: ${path}`);
    try {
      return await endpoint.render(req, path, params);
    } catch (e) {
      return e instanceof Floop
        ? await this.endpoints.error(e.code, e.message)
        : await this.endpoints.error(500, 'Internal server error!');
    }
  }
}

class Floop extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

module.exports = {Floof, FloofBall, Floop, Stoof};