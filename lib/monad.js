class EndpointHandler {
  constructor() {
    this.query = new Map();
    this.body = null;
    this.executor = null;
  }
  
  withQuery(key, type = null, req = false) {
    if (typeof type === 'boolean') {
      this.query.set(key, {type: null, req: type});
    } else {
      this.query.set(key, {type: type.toLowerCase(), req});
    }
    return this;
  }
  
  withBody(type) {
    this.body = type.toLowerCase();
    return this;
  }
  
  exec(func) {
    this.executor = func;
  }
}

class ErrorHandler {
  constructor() {
    this.filters = [];
    this.executor = null;
  }
  
  forCode(...code) {
    this.filters.push(...code);
    return this;
  }
  
  forCodes(startIncl, endExcl) {
    this.filters.push([startIncl, endExcl]);
    return this;
  }
  
  matches(code) {
    return !this.filters.length || this.filters.some(f => {
      if (typeof f === 'number') return f === code;
      return code >= f[0] && code < f[1];
    });
  }
  
  exec(func) {
    this.executor = func;
  }
}

class AroundHandler {
  constructor() {
    this.queue = [];
  }
  
  when(filter) {
    this.queue.push({
      type: 'filter',
      func: filter,
    });
    return this;
  }
  
  exec(func) {
    this.queue.push({
      type: 'exec',
      func: func,
    });
  }
}

class AroundHandlerQueue {
  constructor() {
    this.queue = [];
  }
  
  push(handler) {
    this.queue.push(handler);
  }
  
  run() {
    for (const elem of this.queue) {
      inner: for (const action of elem.queue) {
        switch (action.type) {
          case 'filter':
            if (!action.func(...arguments)) break inner;
            break;
          case 'exec':
            action.func(...arguments);
            break;
        }
      }
    }
  }
}

module.exports = {EndpointHandler, AroundHandler, AroundHandlerQueue};