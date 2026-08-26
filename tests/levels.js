// Every word dealt must belong to the chosen difficulty, and each level must
// hold enough words to play a decent run without repeats.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..') + '/';
const words  = fs.readFileSync('' + ROOT + 'acronyms.js','utf8');
const html   = fs.readFileSync('' + ROOT + 'index.html','utf8');
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

function makeEl(id){ const set=new Set(); return { id, textContent:'', innerHTML:'', disabled:false, className:'', hidden:false,
  classList:{add:c=>set.add(c),remove:c=>set.delete(c),contains:c=>set.has(c),toggle:(c,on)=>{on?set.add(c):set.delete(c);}},
  attrs:{}, setAttribute(k,v){this.attrs[k]=v;}, getAttribute(k){return this.attrs[k];},
  handlers:{}, addEventListener(e,f){this.handlers[e]=f;}, focus(){} }; }
const els={}; const document={getElementById:id=>(els[id]=els[id]||makeEl(id)),addEventListener:()=>{}};
const store={}; const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=v;}};
new Function('document','localStorage','window','navigator',words+'\n'+script)(document,localStorage,{scrollTo(){},prompt(){}},{});

const bank = new Function(words + '; return {r:REAL_ACRONYMS,k:FAKE_ACRONYMS};')();
const lvlOf = new Map([...bank.r, ...bank.k].map(x => [x.w, x.lvl]));
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };

[1, 2, 3].forEach(level => {
  const name = ['', 'Easy', 'Tricky', 'Fiendish'][level];
  els['lvl-' + level].handlers.click();
  ok(els['lvl-' + level].getAttribute('aria-pressed') === 'true', name + ' should read as selected');
  [1,2,3].filter(o => o !== level).forEach(o =>
    ok(els['lvl-' + o].getAttribute('aria-pressed') === 'false', 'only one level may be selected'));
  ok(!!els['level-note'].textContent, name + ' should describe itself');

  const seen = new Set();
  let realCounts = new Set();
  for (let g = 0; g < 40; g++) {
    els['btn-start'].handlers.click();
    let reals = 0;
    for (let i = 0; i < 10; i++) {
      const w = els.acronym.textContent;
      ok(lvlOf.get(w) === level, `"${w}" is level ${lvlOf.get(w)} but was dealt at ${name}`);
      seen.add(w);
      els['btn-real'].handlers.click();
      if (els['truth'].textContent === 'Real meaning') reals++;
      els['btn-next'].handlers.click();
    }
    realCounts.add(reals);
    ok(String(els['split'].textContent).startsWith(name), 'results should name the level played');
  }
  const pool = [...bank.r, ...bank.k].filter(x => x.lvl === level).length;
  console.log(`${name.padEnd(8)} pool ${pool} acronyms | ${seen.size} distinct over 40 games | real-per-game varied across ${realCounts.size} values`);
  ok(realCounts.size > 3, name + ' should still randomise the split');
});

// the stored choice must survive a reload
ok(JSON.parse(store['acronumbskull.level']) === 3, 'chosen level should be remembered');
console.log('all difficulty checks passed');
