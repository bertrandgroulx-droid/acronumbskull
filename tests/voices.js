// The voice chips must pick the voice, preview it, and re-point the clip mid-game.
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

// a fake Audio that records what the page asked for
const made = [];
function Audio(src){ made.push(src); this.src=src; this.preload=''; this.currentTime=0;
  this.play=function(){ this.played=true; return {catch(){}}; }; this.pause=function(){}; }

new Function('document','localStorage','window','navigator','Audio',words+'\n'+script)
  (document, localStorage, {scrollTo(){},prompt(){}}, {}, Audio);

const ok=(c,m)=>{ if(!c) throw new Error('FAIL: '+m); };
const NAMES=['emma','isabella','alice','lily'];

// default voice, nothing played at startup
ok(els['voice-emma'].getAttribute('aria-pressed')==='true', 'Emma should be the default');
ok(made.length===0, 'no audio should load before the player asks for it');

// tapping a chip selects it, previews it, and deselects the others
NAMES.forEach(v => {
  made.length = 0;
  els['voice-'+v].handlers.click();
  ok(els['voice-'+v].getAttribute('aria-pressed')==='true', v+' should read as selected');
  NAMES.filter(o=>o!==v).forEach(o =>
    ok(els['voice-'+o].getAttribute('aria-pressed')==='false', 'only one voice may be selected'));
  ok(made.some(s => s === 'audio/'+v+'/scuba.mp3'), v+' should preview an acronym: got '+JSON.stringify(made));
  ok(JSON.parse(store['acronumbskull.voice'])===v, v+' should be remembered');
});

// in play, the clip for the word on screen comes from the chosen voice
els['voice-alice'].handlers.click();
made.length = 0;
els['btn-start'].handlers.click();
const word = els.acronym.textContent;
ok(made.some(s => s === 'audio/alice/'+word+'.mp3'),
   'clip should be loaded from the chosen voice, got '+JSON.stringify(made));

// switching voice mid-game re-points the current acronym straight away
made.length = 0;
els['voice-lily'].handlers.click();
ok(made.some(s => s === 'audio/lily/'+word+'.mp3'),
   'changing voice mid-game should reload the current acronym, got '+JSON.stringify(made));

// and the next card follows the new voice too
els['btn-real'].handlers.click();
made.length = 0;
els['btn-next'].handlers.click();
const next = els.acronym.textContent;
ok(made.some(s => s === 'audio/lily/'+next+'.mp3'), 'later cards should use the chosen voice');

console.log('all voice-selection checks passed');
