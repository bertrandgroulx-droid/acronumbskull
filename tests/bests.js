// Personal best is tracked and labelled per difficulty level.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..') + '/';
const words  = fs.readFileSync('' + ROOT + 'acronyms.js','utf8');
const html   = fs.readFileSync('' + ROOT + 'index.html','utf8');
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

function harness(store) {
  const els = {};
  const makeEl = id => { const set=new Set(); return { id, textContent:'', innerHTML:'', disabled:false, className:'', hidden:false,
    classList:{add:c=>set.add(c),remove:c=>set.delete(c),contains:c=>set.has(c),toggle:(c,on)=>{on?set.add(c):set.delete(c);}},
    attrs:{}, setAttribute(k,v){this.attrs[k]=v;}, getAttribute(k){return this.attrs[k];},
    handlers:{}, addEventListener(e,f){this.handlers[e]=f;}, focus(){} }; };
  const document={getElementById:id=>(els[id]=els[id]||makeEl(id)),addEventListener:()=>{}};
  const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=v;}};
  new Function('document','localStorage','window','navigator',words+'\n'+script)
    (document, localStorage, {scrollTo(){},prompt(){}}, {});
  return els;
}
const ok=(c,m)=>{ if(!c) throw new Error('FAIL: '+m); };
const playGame = (els, answerReal) => {
  els['btn-start'].handlers.click();
  let right = 0;
  for (let i=0;i<10;i++){
    els[answerReal ? 'btn-real' : 'btn-fake'].handlers.click();
    if (els['ruling-text'].textContent === 'Correct') right++;
    els['btn-next'].handlers.click();
  }
  return right;
};

// --- a fresh player sees nothing ---
let store = {};
let els = harness(store);
ok(els['best-line'].textContent === '', 'a new player should see no best, got: ' + els['best-line'].textContent);

// --- a score at Tricky is recorded and labelled ---
els['lvl-2'].handlers.click();
const scored2 = playGame(els, true);
ok(JSON.parse(store['acronumbskull.bests'])['2'] === scored2, 'the Tricky score should be stored under level 2');
const expect2 = 'Personal best at Tricky — ' + scored2 + '/10';
ok(els['best-line'].textContent === expect2, 'expected "'+expect2+'", got "'+els['best-line'].textContent+'"');
ok(els['best-line-2'].textContent === expect2, 'the results screen should show it too');

// --- switching to a level never played shows nothing, not the other level's score ---
els['lvl-3'].handlers.click();
ok(els['best-line'].textContent === '', 'an unplayed level should not borrow another level\'s best, got: ' + els['best-line'].textContent);
els['lvl-2'].handlers.click();
ok(els['best-line'].textContent === expect2, 'returning to Tricky should show its best again');

// --- a worse score at the same level does not overwrite ---
els['lvl-2'].handlers.click();
const again = playGame(els, false);
const kept = JSON.parse(store['acronumbskull.bests'])['2'];
ok(kept === Math.max(scored2, again), 'the best should be the higher of the two: ' + kept);

// --- each level keeps its own record ---
els['lvl-3'].handlers.click();
const scored3 = playGame(els, true);
const bests = JSON.parse(store['acronumbskull.bests']);
ok(bests['3'] === scored3 && bests['2'] === kept, 'levels should not overwrite each other: ' + JSON.stringify(bests));
ok(els['best-line'].textContent === 'Personal best at Fiendish — ' + scored3 + '/10', 'Fiendish should be labelled');

// --- a score saved before levels existed is kept, without claiming a level ---
els = harness({ 'acronumbskull.best': '9' });
ok(els['best-line'].textContent === 'Earlier best 9/10',
   'a legacy best should show unlabelled, got: ' + els['best-line'].textContent);

console.log('all personal-best checks passed');
