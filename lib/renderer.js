const ejs = require('ejs');
const fs = require('fs');

class ContextualizedRenderer {
  constructor(parent, floofball) {
    this.parent = parent;
    this.floofball = floofball;
  }
  
  async render(file, context) {
    return await this.parent.render(file, {
      ...this.floofball.defaultContext,
      ...context,
    });
  }
}

function crawlDir(dir, files = []) {
  for (const file of fs.readdirSync(dir)) {
    const fname = `${dir}/${file}`;
    const stat = fs.statSync(fname);
    if (stat.isDirectory()) {
      crawlDir(fname, files);
    } else {
      files.push(fname);
    }
  }
  return files;
}

class FloofRenderer {
  constructor(floof) {
    this.floof = floof;
    this.cache = new Map();
    this.contexts = new Map();
    this.recompile();
  }
  
  recompile() {
    for (const file of crawlDir('templates')) {
      const contents = fs.readFileSync(file, 'utf8');
      const compiled = ejs.compile(contents, {
        cache: true,
        filename: file,
        delimiter: '?',
      });
      this.cache.set(file.substring(10), compiled);
    }
  }
  
  contextualize(floofball) {
    let renderer = this.contexts.get(floofball);
    if (!renderer) {
      renderer = new ContextualizedRenderer(this, floofball);
      this.contexts.set(floofball, renderer);
    }
    return renderer;
  }
  
  async render(file, context) {
    const cached = this.cache.get(file);
    if (!cached) throw new Error(`No such template ${file}`);
    return cached(context);
  }
}

module.exports = FloofRenderer;