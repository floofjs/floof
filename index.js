const fs = require('fs');
const micro = require('micro');
const {serve, send, buffer, text, json} = micro;
const sendStatic = require('send');
const FloofBall = require('./lib/floofball.js');
const {FloofRenderer, getBaseDir} = require('./lib/renderer.js');
const {ErrorHandler, AroundHandler, AroundHandlerQueue} = require('./lib/monad.js');
const {FloofRequest, Stoof, redirect, Floop} = require('./lib/objects.js');
const EndpointRegistry = require('./lib/endpoint.js')

function defaultBodyParsers(adapters = new Map()) {
  adapters.set('json', async req => await json(req));
  adapters.set('str', async req => await text(req));
  adapters.set('buf', async req => await buffer(req));
  adapters.set('form', async req => {
    const entries = {};
    for (const entry of (await text(req)).split('&')) {
      const index = entry.indexOf('=');
      entries[entry.substring(0, index)]
        = decodeURIComponent(entry.substring(index + 1).replace(/\+/g, ' '));
    }
    return entries;
  });
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
    throw new Error('Not a boolean!');
  });
  return adapters;
}

class Floof {
  constructor() {
    this.bodyParsers = defaultBodyParsers();
    this.typeAdapters = defaultTypeAdapters();
    this.befores = new AroundHandlerQueue();
    this.afters = new AroundHandlerQueue();
    this.errors = [];
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
    this.befores.push(handler);
    return handler;
  }
  
  after() {
    const handler = new AroundHandler();
    this.afters.push(handler);
    return handler;
  }
  
  error() {
    const handler = new ErrorHandler();
    this.errors.push(handler);
    return handler;
  }
  
  ball(floofball) {
    this.floofballs.push(floofball);
    this.endpoints.register(floofball);
    return this;
  }
  
  go(host = '0.0.0.0', port = 8080) {
    const server = micro(async (req, res) => {
      console.log(`<= ${req.method} -- ${req.url}`); // TODO better logging
      if (req.url.startsWith('/static')) {
        sendStatic(req, getBaseDir(req.url.substring(1))).pipe(res);
      } else {
        const {path, params} = EndpointRegistry.parsePrelim(req.url);
        await this.befores.run(req, params);
        let response = await this.doRender(req, path, res, params);
        await this.afters.run(req, response, params);
        for (const [key, value] of response.headers) {
          res.setHeader(key, value);
        }
        if (typeof response.body === 'string' && !response.body.endsWith('\n')) {
          response.body += '\n';
        }
        send(res, response.code, response.body);
      }
    });
    return new Promise((resolve, reject) => server.listen(port, host, resolve));
  }
  
  async doRender(req, path, res, params) {
    const resolved = await this.endpoints.resolve(req.method, path);
    if (!resolved) return await this.endpoints.error(404, `Resource not found: ${path}`);
    try {
      return await resolved.endpoint.render(req, path, resolved.pathParams, params);
    } catch (e) {
      if (e instanceof Floop) return await this.endpoints.error(e.code, e.message, resolved.endpoint);
      console.error(e);
      return await this.endpoints.error(500, null, resolved.endpoint);
    }
  }
}

module.exports = {Floof, FloofBall, Floop, Stoof, redirect};