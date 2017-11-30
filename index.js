const {micro, send, buffer, text, json} = require('micro');
const FloofBall = require('./lib/floofball.js');
const FloofRenderer = require('./lib/renderer.js');
const {AroundHandler, AroundHandlerQueue} = require('./lib/monad.js');

class FloofRequest {
  constructor(endpoint, req, path, params, queries) {
    this.path = endpoint.path;
    this.body = await endpoint.parseBody(req);
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
}

class WrappedEndpoint {
  constructor(floof, path, floofball, endpoint) {
    this.floof = floof;
    this.path = path;
    this.parent = floofball;
    this.endpoint = endpoint;
  }
  
  async render(req, path, pathParams, params) {
    const parsedParams = new Map();
    for (const [key, value] of params) {
      const paramType = this.endpoint.query.get(key);
      if (!paramType) {
        parsedParams.set(key, value);
      } else {
        let adapted;
        try {
          adapted = this.adaptQuery(paramType.type, value);
        } catch (e) {
          throw new Floop(400, 'Bad request!');
        }
        parsedParams.set(key, adapted);
      }
    }
    let wrapped = new FloofRequest(this, req, path, pathParams, parsedParams);
    wrapped = new Proxy(wrapped, {
      get(key) {
        return pathParams.get(key) || parsedParams.get(key);
      },
    });
    const renderer = this.floof.renderer.contextualize(this.parent);
    await this.parent.before.run(wrapped);
    let response = await this.endpoint.executor(wrapped, renderer);
    if (!(response instanceof Stoof)) response = new Stoof(200, response);
    await this.parent.after.run(wrapped, response);
    return response;
  }
  
  async parseBody(body) {
    if (!this.endpoint.body) return body;
    const adapter = this.floof.bodyParsers.get(this.endpoint.body);
    if (!adapter) throw new Error(`No such body parser ${this.endpoint.body}`);
    return await adapter(body);
  }
  
  async adaptQuery(type, value) {
    if (!type) return value;
    const adapter = this.floof.typeAdapters.get(type);
    if (!adapter) throw new Error(`No such query adapter ${type}`);
    return await adapter(value);
  }
}

class EndpointNode {
  constructor(endpoint = null) {
    this.strong = new Map();
    this.weak = null;
    this.weakName = null;
    this.endpoint = endpoint;
  }
  
  stepTo(steps) {
    if (!steps.length) return this;
    if (steps[0].startsWith(':')) {
      if (!this.weak) {
        this.weak = new EndpointNode();
        this.weakName = steps[0].substring(1);
      }
      return this.weak.stepTo(steps.subarray(1));
    }
    let child = this.strong.get(steps[0]);
    if (!child) this.strong.set(child = new EndpointNode());
    return child.stepTo(steps.subarray(1));
  }
  
  getStrongestNode(steps, params = new Map()) {
    const next = steps.subarray(1);
    const strong = this.strong.get(steps[0]);
    if (!steps.length) {
      return {
        endpoint: this.endpoint,
        pathParams: params,
      };
    }
    if (strong) {
      const result = strong.getStrongestNode(next, params);
      if (result) return result;
    }
    if (this.weak) {
      const result = this.weak.getStrongestNode(next, params);
      if (result) {
        params.set(this.weakName, steps[0]);
        return result;
      }
    }
    return null;
  }
}

class EndpointRegistry {
  constructor(floof) {
    this.floof = floof;
    this.roots = new Map();
  }
  
  register(floofball) {
    for (const {method, path, endpoint} of floofball.endpoints) {
      this.getNode(method, path.substring(1).split('/')).endpoint
        = new WrappedEndpoint(this.floof, path, floofball, endpoint);
    }
  }
  
  getNode(method, steps) {
    let root = this.roots.get(method);
    if (!root) this.roots.set(method, root = new EndpointNode());
    return root.stepTo(steps);
  }
  
  resolve(method, path) {
    const root = this.roots.get(method);
    if (!root) return null;
    const steps = path.substring(1).split('/');
    return root.getStrongestNode(steps);
  }
  
  async error(code, msg, endpoint) {
    for (const error of endpoint.errors) {
      if (error.matches(code)) {
        const renderer = endpoint
          ? this.floof.renderer.contextualize(endpoint.parent)
          : this.floof.renderer;
        return await error.executor(code, msg, renderer);
      }
    }
  }
  
  static parsePrelim(url) {
    const qIndex = url.indexOf('?');
    if (!~qIndex) return {path: url, params: new Map()};
    const params = new Map();
    for (const entry of url.substring(qIndex + 1).split('&')) {
      const eIndex = entry.indexOf('=');
      if (~eIndex) {
        params.set(
          entry.substring(0, eIndex),
          entry.substring(eIndex + 1));
      }
    }
    return {path: url.substring(0, qIndex), params};
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

function defaultBodyParsers(adapters = new Map()) {
  adapters.set('json', async req => await json(req));
  adapters.set('str', async req => await text(req));
  adapters.set('buf', async req => await buffer(req));
  return adapters;
}

function defaultTypeAdapters(adapters = new Map()) {
  adapters.set('str', async s => s);
  adapters.set('int', async s => parseInt(s, 10));
  adapters.set('float', async s => parseFloat(s));
  adapters.set('bool', async s => {
    s = s.toLowerCase();
    if (s === 'true') return true;
    if (s === 'false') return false;
    throw new Error();
  });
  return adapters;
}

class Floof {
  constructor(options) {
    this.bodyParsers = defaultBodyParsers();
    this.typeAdapters = defaultTypeAdapters();
    this.before = new AroundHandlerQueue();
    this.after = new AroundHandlerQueue();
    this.floofballs = [];
    this.endpoints = new EndpointRegistry(this);
    this.renderer = new FloofRenderer(this);
  }
  
  parser(type, parser) {
    this.bodyParsers.set(type.toLowerCase(), parser);
  }
  
  adapter(type, adapter) {
    this.typeAdapters.set(type.toLowerCase(), adapter);
  }
  
  before() {
    const handler = new AroundHandler();
    this.before.push(handler);
    return handler;
  }
  
  after() {
    const handler = new AroundHandler();
    this.after.push(handler);
    return handler;
  }
  
  ball(floofball) {
    this.floofballs.push(floofball);
    this.endpoints.register(floofball);
    return this;
  }
  
  go(host = '127.0.0.1', port = 8080) {
    const server = micro(async (req, res) => {
      const {path, params} = EndpointRegistry.parsePrelim(req.url);
      await this.before.run(req, params);
      let response = await this.doRender(req, path, res, params);
      await this.after.run(req, response, params);
      for (const [key, value] of response.headers) {
        res.setHeader(key, value);
      }
      send(res, response.code, response.body);
    });
    return new Promise((resolve, reject) => server.listen(port, host, resolve));
  }
  
  async doRender(req, path, res, params) {
    const resolved = this.endpoints.resolve(req.method, path);
    if (!resolved) return await this.endpoints.error(404, `Resource not found: ${path}`);
    try {
      return await resolved.endpoint.render(req, path, resolved.pathParams, params);
    } catch (e) {
      if (e instanceof Floop) return await this.endpoints.error(e.code, e.message, resolved);
      console.error(e);
      return await this.endpoints.error(500, 'Internal server error!', resolved);
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