const {EndpointHandler, ErrorHandler, AroundHandler, AroundHandlerQueue} = require('./monad.js');
const httpVerbs = require('./verbs.js');

class FloofBall {
  constructor() {
    this.defaultBodyType = null;
    this.defaultContext = null;
    this.before = new AroundHandlerQueue();
    this.after = new AroundHandlerQueue();
    this.endpoints = [];
    this.errors = [];
    for (const verb of httpVerbs) {
      this[verb.toLowerCase()] = this.endpoint.bind(this, verb);
    }
  }
  
  adaptBody(type) {
    this.defaultBodyType = type;
    return this;
  }
  
  context(ctx) {
    this.defaultContext = ctx;
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
  
  endpoint(method, path) {
    const e = new EndpointHandler();
    this.endpoints.push({
      method, path, endpoint: e,
    });
    return e;
  }
  
  error() {
    const e = new ErrorHandler();
    this.errors.push(e);
    return e;
  }
}

module.exports = FloofBall;