// How many games can a player get through before any word comes round again?
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..') + '/';
const words  = fs.readFileSync('' + ROOT + 'acronyms.js','utf8');
const html   = fs.readFileSync('' + ROOT + 'index.html','utf8');
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
function makeEl(id){ const set=new Set(); return { id, textContent:'', innerHTML:'', disabled:false, className:'',
  classList:{add:c=>set.add(c),remove:c=>set.delete(c),contains:c=>set.has(c),toggle:(c,on)=>{on?set.add(c):set.delete(c);}},
  attrs:{}, setAttribute(k,v){this.attrs[k]=v;}, getAttribute(k){return this.attrs[k];},
    attrs:{}, setAttribute(k,v){this.attrs[k]=v;}, getAttribute(k){return this.attrs[k];}, handlers:{}, addEventListener(e,f){this.handlers[e]=f;}, focus(){} }; }
const els={}; const document={getElementById:id=>(els[id]=els[id]||makeEl(id)),addEventListener:()=>{}};
const store={}; const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=v;}};
new Function('document','localStorage','window','navigator',words+'\n'+script)(document,localStorage,{scrollTo(){},prompt(){}},{});

const seen = new Set(); let games = 0, firstRepeat = null;
while (games < 60) {
  els['btn-start'].handlers.click();
  games++;
  for (let i = 0; i < 10; i++) {
    const w = els.acronym.textContent;
    if (seen.has(w) && firstRepeat === null) firstRepeat = games;
    seen.add(w);
    els['btn-real'].handlers.click();
    els['btn-next'].handlers.click();
  }
}
console.log('first repeated acronym appeared in game', firstRepeat, '— distinct acronyms seen over 60 games:', seen.size);
