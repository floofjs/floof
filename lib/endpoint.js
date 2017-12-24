const {FloofRequest, Stoof, Floop} = require('./objects.js');
const httpStatus = require('http-status');

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
          adapted = await this.adaptQuery(paramType.type, value);
        } catch (e) {
          throw new Floop(400);
        }
        parsedParams.set(key, adapted);
      }
    }
    for (const [key, {req}] of this.endpoint.query) {
      if (req && !params.has(key)) throw new Floop(400);
    }
    let wrapped = new FloofRequest(this, req, path, pathParams, parsedParams);
    wrapped = new Proxy(wrapped, {
      has(target, key) {
        return target.hasOwnProperty(key) || pathParams.has(key) || parsedParams.has(key);
      },
      get(target, key) {
        return pathParams.get(key) || parsedParams.get(key) || target[key];
      },
    });
    const renderer = this.floof.renderer.contextualize(this.parent, wrapped);
    await this.parent.befores.run(wrapped);
    let response = await this.endpoint.executor(wrapped, renderer);
    if (!(response instanceof Stoof)) response = new Stoof(200, response);
    await this.parent.afters.run(wrapped, response);
    return response;
  }
  
  async parseBody(req) {
    if (!this.endpoint.body) return null;
    const adapter = this.floof.bodyParsers.get(this.endpoint.body);
    if (!adapter) throw new Error(`No such body parser ${this.endpoint.body}`);
    return await adapter(req);
  }
  
  async adaptQuery(type, value) {
    if (!type) return value;
    const adapter = this.floof.typeAdapters.get(type);
    if (!adapter) throw new Error(`No such query adapter ${type}`);
    return await adapter(value);
  }
}

class EndpointNode {
  constructor(floof, endpoint = null) {
    this.floof = floof;
    this.strong = new Map();
    this.weak = null;
    this.weakName = null;
    this.weakType = null;
    this.endpoint = endpoint;
  }
  
  stepTo(steps) {
    if (!steps.length) return this;
    if (steps[0].startsWith(':')) {
      if (!this.weak) {
        this.weak = new EndpointNode(this.floof);
        this.weakName = steps[0].substring(1);
        const index = this.weakName.indexOf('|');
        if (~index) {
          this.weakType = this.weakName.substring(index + 1);
          this.weakName = this.weakName.substring(0, index);
        }
      }
      return this.weak.stepTo(steps.slice(1));
    }
    let child = this.strong.get(steps[0]);
    if (!child) this.strong.set(steps[0], child = new EndpointNode(this.floof));
    return child.stepTo(steps.slice(1));
  }
  
  async getStrongestNode(steps, params = new Map()) {
    const next = steps.slice(1);
    const strong = this.strong.get(steps[0]);
    if (!steps.length) {
      return {
        endpoint: this.endpoint,
        pathParams: params,
      };
    }
    if (strong) {
      const result = await strong.getStrongestNode(next, params);
      if (result) return result;
    }
    if (this.weak) {
      const result = await this.weak.getStrongestNode(next, params);
      if (result) {
        let value = steps[0];
        if (this.weakType) {
          const adapter = this.floof.typeAdapters.get(this.weakType);
          if (!adapter) throw new Error(`Unknown path param type ${this.weakType}`);
          value = await adapter(value);
        }
        params.set(this.weakName, value);
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
    if (!root) this.roots.set(method, root = new EndpointNode(this.floof));
    return root.stepTo(steps);
  }
  
  async resolve(method, path) {
    const root = this.roots.get(method);
    if (!root) return null;
    const steps = path.substring(1).split('/');
    return await root.getStrongestNode(steps);
  }
  
  async error(req, msg, endpoint) {
    if (!msg) msg = httpStatus[req.statusCode];
    const response = await this.doError(req, msg, endpoint);
    if (!(response instanceof Stoof)) return new Stoof(req.statusCode, response);
    return response;
  }
  
  async doError(req, msg, endpoint) {
    if (endpoint) {
      for (const error of endpoint.parent.errors) {
        if (error.matches(req.statusCode)) {
          const renderer = this.floof.renderer.contextualize(endpoint.parent);
          return await error.executor(req, msg, renderer);
        }
      }
    }
    for (const error of this.floof.errors) {
      if (error.matches(req.statusCode)) {
        const self = this;
        req.delegateError = async function(floofball) {
          for (const error of floofball.errors) {
            if (error.matches(req.statusCode)) {
              const renderer = self.floof.renderer.contextualize(floofball);
              return await error.executor(req, msg, renderer);
            }
          }
          return msg;
        };
        return await error.executor(req, msg, this.floof.renderer);
      }
    }
    return msg;
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

module.exports = EndpointRegistry;