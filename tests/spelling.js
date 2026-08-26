// Answering a card lights up the letters of the expansion that make the acronym:
// SNOBOL is StriNg Oriented symBOlic Language. This drives the real game and checks
// what comes back — the marked letters must be the acronym, in order, and the words
// underneath must survive untouched.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..') + '/';
const words  = fs.readFileSync('' + ROOT + 'acronyms.js', 'utf8');
const html   = fs.readFileSync('' + ROOT + 'index.html', 'utf8');
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

function makeEl(id){ const set=new Set(); return { id, textContent:'', innerHTML:'', disabled:false, className:'', hidden:false,
  classList:{add:c=>set.add(c),remove:c=>set.delete(c),contains:c=>set.has(c),toggle:(c,on)=>{on?set.add(c):set.delete(c);}},
  attrs:{}, setAttribute(k,v){this.attrs[k]=v;}, getAttribute(k){return this.attrs[k];},
  handlers:{}, addEventListener(e,f){this.handlers[e]=f;}, focus(){} }; }
const els={}; const document={getElementById:id=>(els[id]=els[id]||makeEl(id)),addEventListener:()=>{}};
const store={}; const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=v;}};
new Function('document','localStorage','window','navigator',words+'\n'+script)
  (document, localStorage, {scrollTo(){},prompt(){}}, {});

const bank = new Function(words + '; return {r:REAL_ACRONYMS,k:FAKE_ACRONYMS};')();
const byWord = new Map([...bank.r, ...bank.k].map(x => [x.w, x]));
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };

const strip = h => h.replace(/<\/?b>/g, '');
const marked = h => (h.match(/<b>([^<]*)<\/b>/g) || [])
  .map(t => t.replace(/<\/?b>/g, '')).join('').toLowerCase();

// PELICAN and YUPPIE had their expansions fitted to an existing word, so their letters
// do not come out in order. They are allowed to render plain rather than wrong.
const UNREADABLE = new Set(['pelican', 'yuppie']);

let checked = 0, cheats = 0;
[1, 2, 3].forEach(lvl => {
  els['lvl-' + lvl].handlers.click();
  for (let game = 0; game < 3; game++) {
    els['btn-start'].handlers.click();
    for (let i = 0; i < 10; i++) {
      const w = els.acronym.textContent;
      const entry = byWord.get(w);

      // before answering, the expansion gives nothing away about its own construction
      ok(!/<b>/.test(els.def.innerHTML || ''),
         `"${w}" should show a plain expansion before it is answered`);

      els['btn-real'].handlers.click();

      const shown = els.def.innerHTML;
      ok(strip(shown) === entry.def,
         `"${w}" should still read "${entry.def}", got "${strip(shown)}"`);

      const letters = marked(shown);
      if (UNREADABLE.has(w)) {
        ok(letters === '' || letters === w,
           `"${w}" cannot be read out and should stay plain, got "${letters}"`);
      } else {
        ok(letters === w,
           `the lit letters of "${w}" should spell it, got "${letters}"`);
        // the marked letters must be the acronym's own, in the order it has them
        ok(letters.split('').every((c, n) => c === w[n]),
           `"${w}" lit its letters out of order`);
        if (/<b>[^<]{2,}<\/b>/.test(shown)) cheats++;   // a word giving up 2+ letters
        checked++;
      }
      if (i < 9) els['btn-next'].handlers.click();
    }
    els['btn-next'].handlers.click();      // to the results screen
    els['btn-again'].handlers.click();
  }
});

ok(checked > 50, `should have checked a decent sample, only did ${checked}`);
// GESTAPO, RADAR, POSSLQ and friends take more than one letter from a word; if none of
// a ninety-card sample did, the matcher has quietly stopped finding them.
ok(cheats > 0, 'no card took two letters from one word — the matcher is too literal');

// the recap marks them too, so a player can study the whole round at the end
const recap = els.recap.innerHTML;
ok(/<p class="detail-def">[^<]*<b>/.test(recap) || /<b>/.test(recap),
   'the recap should mark the letters as well');

console.log(`ok — ${checked} expansions spelled out their acronym, ${cheats} of them by cheating`);
