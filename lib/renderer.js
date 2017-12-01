const ejs = require('ejs');
const fs = require('fs');

class ContextualizedRenderer {
  constructor(parent, floofball, req) {
    this.parent = parent;
    this.floofball = floofball;
    this.req = req;
  }
  
  async render(file, context) {
    return await this.parent.render(file, {
      ...this.floofball.defaultContext,
      ...context,
      req: this.req,
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

const extendsPattern = /^<\?\s*extends\s*(.+)\?>$/;
const blockPattern = /<\?\s*(block\s*.+?|def\s*.+?|undef)\s*\?>/;

class FloofRenderer {
  constructor(floof) {
    this.floof = floof;
    this.cache = new Map();
    this.recompile();
  }
  
  recompile() {
    const files = new Map();
    // First pass: read files and tokenize
    for (const file of crawlDir('templates')) {
      let contents = fs.readFileSync(file, 'utf8').trim();
      let extend = false;
      let firstNewLine = contents.indexOf('\n');
      if (~firstNewLine) {
        const firstLine = contents.substring(0, firstNewLine).trim();
        extend = extendsPattern.exec(firstLine);
        if (extend) {
          extend = extend[1].trim();
          contents = contents.substring(firstNewLine);
        }
      }
      let tokens = [];
      let match;
      while (match = blockPattern.exec(contents)) {
        tokens.push(contents.substring(0, match.index));
        if (match[1] === 'undef') {
          tokens.push(false);
        } else {
          const pair = match[1].split(/\s+/, 2);
          tokens.push({
            type: pair[0],
            id: pair[1].trim(),
          });
        }
        contents = contents.substring(match.index + match[0].length);
      }
      tokens.push(contents);
      files.set(file.substring(10), {tokens, extend});
    }
    // Second pass: collect and strip defines
    const cleanedFiles = new Map();
    for (const [name, {tokens, extend}] of files) {
      let cleaned = [];
      let defines = {};
      let ctx = {
        parent: null,
        consumer: s => cleaned.push(s),
        base: true,
      };
      for (const token of tokens) {
        if (token === false) {
          ctx = ctx.parent;
          if (!ctx) throw new Error('Negatively imbalanced def blocks!');
        } else if (typeof token === 'string') {
          ctx.consumer(token);
        } else if (token.type === 'def') {
          defines[token.id] = [];
          ctx = {
            parent: ctx,
            consumer: s => defines[token.id].push(s),
          };
        } else if (token.type === 'block') {
          ctx.consumer(token);
        }
      }
      if (!ctx.base) throw new Error('Positively imbalanced def blocks!');
      cleanedFiles.set(name, {tokens: cleaned, defines, extend});
    }
    // Third pass: expand child templates and blocks, then compile
    for (let [name, {tokens, defines, extend}] of cleanedFiles) {
      function expandChild(tokens, extend) {
        if (!extend) return tokens;
        const parent = cleanedFiles.get(extend);
        if (!parent) throw new Error(`Undefined template ${extend}`);
        return [...expandChild(parent.tokens, parent.extend), ...tokens];
      }
      tokens = expandChild(tokens, extend);
      let ctx = null;
      function constructBody(tokens) {
        let body = '';
        for (const token of tokens) {
          if (typeof token === 'string') {
            body += token;
          } else {
            body += resolveDef(token.id);
          }
        }
        return body;
      }
      function resolveDef(id) {
        if (!ctx) {
          ctx = id;
        } else if (ctx === id) {
          throw new Error(`Circular def ${id}`);
        }
        const tokens = defines[id];
        if (!tokens) return `block ${id}`;
        return constructBody(tokens);
      }
      const body = constructBody(tokens);
      const compiled = ejs.compile(body, {
        cache: true,
        filename: name,
        delimiter: '?',
      });
      this.cache.set(name, compiled);
    }
  }
  
  contextualize(floofball, req) {
    return new ContextualizedRenderer(this, floofball, req);
  }
  
  async render(file, context) {
    const cached = this.cache.get(file);
    if (!cached) throw new Error(`No such template ${file}`);
    return cached(context);
  }
}

module.exports = FloofRenderer;