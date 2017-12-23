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
  constructor(filo = false) {
    this.queue = [];
    this.queue.iterate = filo ? async function(visitor) {
      for (let i = this.length - 1; i >= 0; i--) {
        await visitor(this[i]);
      }
    } : async function(visitor) {
      for (const elem of this) await visitor(elem);
    };
  }
  
  push(handler) {
    this.queue.push(handler);
  }
  
  async run() {
    await this.queue.iterate(async (elem) => {
      inner: for (const action of elem.queue) {
        switch (action.type) {
          case 'filter':
            if (!(await action.func(...arguments))) break inner;
            break;
          case 'exec':
            await action.func(...arguments);
            break;
        }
      }
    });
  }
}

module.exports = {EndpointHandler, AroundHandler, ErrorHandler, AroundHandlerQueue};