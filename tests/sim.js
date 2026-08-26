// Drive the game's real logic against a minimal DOM stub, playing perfectly and then terribly.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..') + '/';
const words = fs.readFileSync('' + ROOT + 'acronyms.js','utf8');
const html  = fs.readFileSync('' + ROOT + 'index.html','utf8');
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

function makeEl(id){
  const set = new Set();
  return { id, textContent:'', innerHTML:'', disabled:false, className:'',
    classList:{ add:c=>set.add(c), remove:c=>set.delete(c), contains:c=>set.has(c),
                toggle:(c,on)=>{ on?set.add(c):set.delete(c); } },
    attrs:{}, setAttribute(k,v){this.attrs[k]=v;}, getAttribute(k){return this.attrs[k];},
    handlers:{}, addEventListener(ev,fn){ this.handlers[ev]=fn; }, focus(){} };
}
const els = {};
const document = {
  getElementById: id => (els[id] = els[id] || makeEl(id)),
  addEventListener: () => {},
};
const store = {};
const localStorage = { getItem:k=>k in store?store[k]:null, setItem:(k,v)=>{store[k]=v;} };
const window = { scrollTo(){}, prompt(){} };
const navigator = {};

const run = new Function('document','localStorage','window','navigator', words + '\n' + script);
run(document, localStorage, window, navigator);

function playGame(strategy){
  els['btn-start'].handlers.click();
  const seen = [];
  for (let i=0;i<10;i++){
    const w = els.acronym.textContent;
    const isReal = REAL.has(w);
    seen.push({w, isReal, def: els.def.textContent, pos: els.field.textContent, ruling: null});
    if (!els.def.textContent || !els.field.textContent) throw new Error('empty card fields for '+w);
    const strategyReal = strategy(isReal);
    els[strategyReal ? 'btn-real' : 'btn-fake'].handlers.click();
    seen[i].ruling = els['ruling-text'].textContent;
    const said = strategyReal;
    const expectRuling = (said === isReal) ? 'Correct' : 'Wrong';
    const expectTruth  = isReal ? 'Real meaning' : 'Fake meaning';
    if (els['ruling-text'].textContent !== expectRuling) throw new Error('ruling said "'+els['ruling-text'].textContent+'", expected '+expectRuling+' on '+w);
    if (els['truth'].textContent !== expectTruth) throw new Error('truth said "'+els['truth'].textContent+'", expected '+expectTruth+' on '+w);
    if (!els['ruling-icon'].innerHTML || !els['note'].innerHTML) throw new Error('incomplete reveal for '+w);
    // real words must show a usage example; fakes must not
    const exShown = !els['example'].classList.contains('hidden') && !!els['example'].innerHTML;
    if (isReal && !exShown) throw new Error('real expansion "'+w+'" showed no example sentence');
    if (!isReal && exShown) throw new Error('invented acronym "'+w+'" showed an example sentence');
    if (isReal && !els['example'].innerHTML.includes('<em>')) throw new Error('example for "'+w+'" lost its emphasis markup');
    els['btn-next'].handlers.click();
  }
  // every recap row must be one colour: the tick/cross and the real-or-fake pill agree
  const rows = els.recap.innerHTML.split('<li>').slice(1);
  rows.forEach((row, i) => {
    const rightMark = row.includes('mark hit'), wrongMark = row.includes('mark miss');
    const rightPill = row.includes('t right'), wrongPill = row.includes('t wrong');
    if (rightMark !== rightPill || wrongMark !== wrongPill)
      throw new Error('recap row ' + (i + 1) + ' has mismatched colours: ' + row.slice(0, 120));
    const wasRight = seen[i].ruling === 'Correct';
    if (rightMark !== wasRight)
      throw new Error('recap row ' + (i + 1) + ' colour disagrees with the score');
  });
  return { score: Number(els.final.textContent), rank: els.rank.textContent, seen };
}

const bank = new Function(words + '; return {r:REAL_ACRONYMS,k:FAKE_ACRONYMS};')();
const REAL = new Set(bank.r.map(x=>x.w));

let perfect = playGame(isReal => isReal);
let awful   = playGame(isReal => !isReal);
console.log('perfect game ->', perfect.score, '|', perfect.rank);
console.log('worst game   ->', awful.score, '|', awful.rank);

// 200 games: check composition, uniqueness within a game, and repeat pressure across games
let realCounts = {}, dupeFail = 0;
const freq = {};
for (let g=0; g<200; g++){
  const r = playGame(() => Math.random() < 0.5);
  const rc = r.seen.filter(s=>s.isReal).length; realCounts[rc]=(realCounts[rc]||0)+1;
  if (new Set(r.seen.map(s=>s.w)).size !== 10) dupeFail++;
  r.seen.forEach(s => freq[s.w] = (freq[s.w]||0)+1);
}
console.log('distribution of real-words-per-game over 200 games:');
Object.keys(realCounts).sort((a,b)=>a-b).forEach(k=>console.log('   ',k,'real:',realCounts[k],'games'));
console.log('games with a repeated acronym:', dupeFail);
const counts = Object.values(freq);
console.log('distinct acronyms used over 200 games:', counts.length, 'of', bank.r.length+bank.k.length,
            '| min/max appearances:', Math.min(...counts), Math.max(...counts));
console.log('bests by level:', localStorage.getItem('acronumbskull.bests'));
