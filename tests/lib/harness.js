// Boots the real game against a minimal DOM stub, the way every suite here does.
//
// The page carries three inline scripts: the github.io redirect at the top, the
// game at the bottom, and the kit tag between them (which has a src, so it is not
// inline). The game is the last inline one. It needs `ShozDaily` from
// shozbot-daily.js, a `location` to route from and a `history` to write to.
//
//   const { boot } = require('./lib/harness');
//   const { els, store, location } = boot({ store: {}, search: '?daily=2026-03-04' });
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..') + '/';
const words = fs.readFileSync(ROOT + 'acronyms.js', 'utf8');
const html  = fs.readFileSync(ROOT + 'index.html', 'utf8');
const inline = [...html.matchAll(/<script>\n([\s\S]*?)<\/script>/g)].map(m => m[1]);
const script = inline[inline.length - 1];
const ShozDaily = require(ROOT + 'shozbot-daily.js');

function makeEl(id) {
  const set = new Set();
  return {
    id, textContent: '', innerHTML: '', disabled: false, className: '', hidden: false, open: false,
    classList: { add: c => set.add(c), remove: c => set.delete(c), contains: c => set.has(c),
                 toggle: (c, on) => { on ? set.add(c) : set.delete(c); } },
    attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
    removeAttribute(k) { delete this.attrs[k]; },
    handlers: {}, addEventListener(e, f) { this.handlers[e] = f; }, focus() {},
    showModal() { this.open = true; }, close() { this.open = false; if (this.handlers.close) this.handlers.close(); }
  };
}

function boot(opts) {
  opts = opts || {};
  const store = opts.store || {};
  const els = {};
  const docHandlers = {};
  const document = {
    getElementById: id => (els[id] = els[id] || makeEl(id)),
    addEventListener: (e, f) => { docHandlers[e] = f; }
  };
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    key: i => Object.keys(store)[i], get length() { return Object.keys(store).length; }
  };
  const location = {
    search: opts.search || '', protocol: 'https:', hostname: 'shozbot.com',
    origin: 'https://shozbot.com', pathname: '/acronumbskull/', url: null
  };
  const history = { replaceState(s, t, url) { location.url = url; } };
  const copied = [];
  const navigator = opts.navigator || {};
  const window = { scrollTo() {}, prompt(label, text) { copied.push(text); }, localStorage };
  new Function('document', 'localStorage', 'window', 'navigator', 'location', 'history', 'ShozDaily',
    words + '\n' + script)(document, localStorage, window, navigator, location, history, ShozDaily);
  return { els, store, location, history, docHandlers, copied, ShozDaily };
}

const bank = new Function(words + '; return {r:REAL_ACRONYMS,k:FAKE_ACRONYMS};')();
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };
const hidden = (els, id) => els[id].classList.contains('hidden');

module.exports = { boot, bank, ok, hidden, words, script, ROOT };
