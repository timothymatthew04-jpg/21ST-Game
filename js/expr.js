/*
 * expr.js — a tiny, safe expression language for story conditions.
 *
 *   hana >= 3 and not met_rei
 *   top("hana", "rei", "miko") == "hana"
 *   persistent.cleared or visited("secret_room")
 *
 * No eval / new Function, so it runs under strict Content-Security-Policies.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  const TOKEN_RE = /\s*(?:(\d+(?:\.\d+)?)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)|(==|!=|<=|>=|&&|\|\||[-+*/%<>!(),]))/y;

  const WORD_OPS = { and: '&&', or: '||', not: '!' };
  const LITERALS = { true: true, false: false, null: null, none: null };

  function unescape(s) {
    return s.replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c));
  }

  function tokenize(src) {
    const text = src.trim();
    const tokens = [];
    let pos = 0;
    while (pos < text.length) {
      TOKEN_RE.lastIndex = pos;
      const m = TOKEN_RE.exec(text);
      if (!m) throw new Error(`Unexpected "${text[pos]}" in expression: ${src}`);
      pos = TOKEN_RE.lastIndex;
      if (m[1] !== undefined) tokens.push({ t: 'num', v: parseFloat(m[1]) });
      else if (m[2] !== undefined) tokens.push({ t: 'str', v: unescape(m[2].slice(1, -1)) });
      else if (m[3] !== undefined) {
        const w = m[3];
        if (w in WORD_OPS) tokens.push({ t: 'op', v: WORD_OPS[w] });
        else if (w in LITERALS) tokens.push({ t: 'lit', v: LITERALS[w] });
        else tokens.push({ t: 'id', v: w });
      } else tokens.push({ t: 'op', v: m[4] });
    }
    return tokens;
  }

  const BINARY = {
    '||': 1, '&&': 2,
    '==': 3, '!=': 3,
    '<': 4, '<=': 4, '>': 4, '>=': 4,
    '+': 5, '-': 5,
    '*': 6, '/': 6, '%': 6,
  };

  function parse(src) {
    const tokens = tokenize(src);
    let i = 0;
    const peek = () => tokens[i];
    const next = () => tokens[i++];
    const expectOp = (v) => {
      const t = next();
      if (!t || t.t !== 'op' || t.v !== v) throw new Error(`Expected "${v}" in expression: ${src}`);
    };

    function primary() {
      const t = next();
      if (!t) throw new Error(`Unexpected end of expression: ${src}`);
      if (t.t === 'num' || t.t === 'str' || t.t === 'lit') return { k: 'val', v: t.v };
      if (t.t === 'id') {
        const p = peek();
        if (p && p.t === 'op' && p.v === '(') {
          next();
          const args = [];
          if (!(peek() && peek().t === 'op' && peek().v === ')')) {
            for (;;) {
              args.push(expr(0));
              const s = peek();
              if (s && s.t === 'op' && s.v === ',') { next(); continue; }
              break;
            }
          }
          expectOp(')');
          return { k: 'call', name: t.v, args };
        }
        return { k: 'var', name: t.v };
      }
      if (t.t === 'op' && t.v === '(') {
        const e = expr(0);
        expectOp(')');
        return e;
      }
      if (t.t === 'op' && (t.v === '!' || t.v === '-' || t.v === '+')) {
        return { k: 'un', op: t.v, a: expr(7) };
      }
      throw new Error(`Unexpected "${t.v}" in expression: ${src}`);
    }

    function expr(minPrec) {
      let left = primary();
      for (;;) {
        const t = peek();
        if (!t || t.t !== 'op' || !(t.v in BINARY)) break;
        const prec = BINARY[t.v];
        if (prec < minPrec) break;
        next();
        const right = expr(prec + 1);
        left = { k: 'bin', op: t.v, a: left, b: right };
      }
      return left;
    }

    const ast = expr(0);
    if (i < tokens.length) throw new Error(`Unexpected "${tokens[i].v}" in expression: ${src}`);
    return ast;
  }

  function evaluate(n, ctx) {
    switch (n.k) {
      case 'val': return n.v;
      case 'var': return ctx.get(n.name);
      case 'call': return ctx.call(n.name, n.args.map((a) => evaluate(a, ctx)));
      case 'un': {
        const a = evaluate(n.a, ctx);
        if (n.op === '!') return !a;
        if (n.op === '-') return -a;
        return +a;
      }
      case 'bin': {
        if (n.op === '&&') return evaluate(n.a, ctx) && evaluate(n.b, ctx);
        if (n.op === '||') return evaluate(n.a, ctx) || evaluate(n.b, ctx);
        const a = evaluate(n.a, ctx);
        const b = evaluate(n.b, ctx);
        switch (n.op) {
          // eslint-disable-next-line eqeqeq
          case '==': return a == b;
          // eslint-disable-next-line eqeqeq
          case '!=': return a != b;
          case '<': return a < b;
          case '<=': return a <= b;
          case '>': return a > b;
          case '>=': return a >= b;
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return a / b;
          case '%': return a % b;
        }
      }
    }
    throw new Error('Bad expression node');
  }

  const cache = new Map();

  /** Compile once, evaluate many times: compile(src)(ctx). Throws on syntax errors. */
  function compile(src) {
    let fn = cache.get(src);
    if (!fn) {
      const ast = parse(src);
      fn = (ctx) => evaluate(ast, ctx);
      cache.set(src, fn);
    }
    return fn;
  }

  VN.expr = { compile, tokenize, parse };
})();
