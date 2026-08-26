// The results screen: expandable word details, and Play again returning to the options.
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
const played=[];
function Audio(src){ played.push(src); this.play=function(){return {catch(){}};}; this.pause=function(){}; this.currentTime=0; this.preload=''; }
new Function('document','localStorage','window','navigator','Audio',words+'\n'+script)
  (document, localStorage, {scrollTo(){},prompt(){}}, {}, Audio);

const bank = new Function(words + '; return {r:REAL_ACRONYMS,k:FAKE_ACRONYMS};')();
const byWord = new Map([...bank.r, ...bank.k].map(x => [x.w, x]));
const ok=(c,m)=>{ if(!c) throw new Error('FAIL: '+m); };
const hidden = id => els[id].classList.contains('hidden');

// play a full game, alternating answers so both outcomes appear
els['btn-start'].handlers.click();
const seen=[];
for (let i=0;i<10;i++){
  seen.push({ w: els.acronym.textContent, guessedReal: i % 2 === 0 });
  els[i % 2 === 0 ? 'btn-real' : 'btn-fake'].handlers.click();
  els['btn-next'].handlers.click();
}
ok(!els.recap.innerHTML.includes('undefined'), 'recap must not render undefined fields');

// every row starts collapsed
for (let i=0;i<10;i++){
  ok(els['recap-row-'+i].getAttribute('aria-expanded')==='false', 'row '+i+' should start collapsed');
  ok(hidden('recap-detail-'+i), 'detail '+i+' should start hidden');
}

// opening a row shows that word's details and nothing else
els['recap-row-3'].handlers.click();
ok(els['recap-row-3'].getAttribute('aria-expanded')==='true', 'row 3 should open');
ok(!hidden('recap-detail-3'), 'detail 3 should be visible');
els['recap-row-7'].handlers.click();
ok(hidden('recap-detail-3'), 'opening another row should close the first');
ok(!hidden('recap-detail-7'), 'row 7 should now be open');
els['recap-row-7'].handlers.click();
ok(hidden('recap-detail-7'), 'clicking an open row should close it');
ok(els['recap-row-7'].getAttribute('aria-expanded')==='false', 'aria-expanded should follow');

// the detail carries the real content for that word
const detailHtml = els.recap.innerHTML;
seen.forEach((s, i) => {
  const entry = byWord.get(s.w);
  ok(detailHtml.includes(entry.def), `expansion for "${s.w}" missing from the recap`);
  ok(detailHtml.includes(entry.note), `note for "${s.w}" missing from the recap`);
  if (entry.ex) ok(detailHtml.includes(entry.ex), `example for real acronym "${s.w}" missing`);
  ok(detailHtml.includes('You answered ' + (s.guessedReal ? 'Real' : 'Fake')),
     `the answer given for "${s.w}" should be shown`);
});
const fakes = seen.filter(s => !byWord.get(s.w).ex).length;
console.log(`recap details verified for 10 acronyms (${10-fakes} real with examples, ${fakes} fake without)`);

// the speaker inside a row plays that word in the chosen voice
played.length = 0;
els['recap-speak-5'].handlers.click({ stopPropagation(){} });
ok(played.some(p => p === 'audio/emma/' + seen[5].w + '.mp3'),
   'row speaker should play its own acronym, got ' + JSON.stringify(played));

// Play again goes back to the options rather than dealing immediately
els['btn-again'].handlers.click();
ok(!hidden('start'), 'Play again should show the start screen');
ok(hidden('results') && hidden('game'), 'only the start screen should be visible');
ok(!!els['lvl-1'].getAttribute('aria-pressed'), 'difficulty options should be on that screen');
console.log('all results-screen checks passed');
