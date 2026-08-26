// The spoken form is a separate field from the acronym itself: the clip is
// named for the acronym, but a synthesiser has to be handed the letters spaced
// out or it tries to pronounce "PDF" as a word.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..') + '/';
const bankSrc = fs.readFileSync('' + ROOT + 'acronyms.js', 'utf8');
const html    = fs.readFileSync('' + ROOT + 'index.html', 'utf8');
const script  = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

function makeEl(id){ const set=new Set(); return { id, textContent:'', innerHTML:'', disabled:false, className:'', hidden:false,
  classList:{add:c=>set.add(c),remove:c=>set.delete(c),contains:c=>set.has(c),toggle:(c,on)=>{on?set.add(c):set.delete(c);}},
  attrs:{}, setAttribute(k,v){this.attrs[k]=v;}, getAttribute(k){return this.attrs[k];},
  handlers:{}, addEventListener(e,f){this.handlers[e]=f;}, focus(){} }; }
const els={}; const document={getElementById:id=>(els[id]=els[id]||makeEl(id)),addEventListener:()=>{}};
const store={}; const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=v;}};

// every clip the page asks for, and every phrase it hands to the synthesiser
const requested = [], spoken = [];
let audioWorks = true;
function Audio(src){
  requested.push(src);
  this.src = src; this.preload = ''; this.currentTime = 0;
  this.pause = function(){};
  this.play = function(){
    const self = this;
    return { catch: function (fn) { if (!audioWorks) fn(); return self; } };
  };
}
function SpeechSynthesisUtterance(text){ this.text = text; spoken.push(text); }
const speechSynthesis = {
  speaking:false, pending:false,
  getVoices: () => [],
  speak(u){ this.last = u; },
  cancel(){},
  addEventListener(){},
};
const window = { scrollTo(){}, prompt(){}, speechSynthesis };

new Function('document','localStorage','window','navigator','Audio','SpeechSynthesisUtterance', bankSrc + '\n' + script)
  (document, localStorage, window, {}, Audio, SpeechSynthesisUtterance);

const bank = new Function(bankSrc + '; return {r:REAL_ACRONYMS,k:FAKE_ACRONYMS};')();
const all = [...bank.r, ...bank.k];
const byName = new Map(all.map(x => [x.w, x]));
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };

// --- every entry carries a spoken form, and the acronym is filename-safe ---
all.forEach(x => {
  ok(/^[a-z]+$/.test(x.w), `"${x.w}" is not plain lowercase, so its audio file cannot be named`);
  ok(!!x.say, `"${x.w}" has no spoken form`);
  ok(/^[A-Za-z][A-Za-z '-]*$/.test(x.say), `the spoken form of "${x.w}" has characters the renderer will not read: ${x.say}`);
});
// an initialism must be handed over spaced, or it gets read as a word
const spelled = all.filter(x => x.say === x.say.toUpperCase() && x.say.indexOf(' ') !== -1);
// A bare "A" is read as the article, so the letter A is written "A-"; strip that
// back off before checking the spelling.
const letters = x => x.say.replace(/[ -]/g, '').toLowerCase();
ok(spelled.length > 10, 'some acronyms should be spelled out letter by letter, got ' + spelled.length);
spelled.forEach(x => ok(letters(x) === x.w,
  `"${x.w}" is spelled out as "${x.say}", which is not its own letters`));
console.log(`${all.length} entries carry a spoken form; ${spelled.length} are spelled out letter by letter`);

// --- the clip is named for the acronym, never for the spoken form ---
requested.length = 0;
els['btn-start'].handlers.click();
const first = byName.get(els.acronym.textContent);
ok(requested.some(s => s === 'audio/emma/' + first.w + '.mp3'),
   'the clip should be named for the acronym, got ' + JSON.stringify(requested));
ok(!requested.some(s => s.indexOf(' ') !== -1), 'no clip filename may contain a space: ' + JSON.stringify(requested));

// --- when the clip will not play, the synthesiser gets the spoken form ---
audioWorks = false;
spoken.length = 0;
els['btn-speak'].handlers.click();
ok(spoken.length === 1, 'a failed clip should fall back to synthesis once, got ' + spoken.length);
ok(spoken[0] === first.say,
   `the fallback should say "${first.say}" for ${first.w.toUpperCase()}, said "${spoken[0]}"`);

// --- the same is true of the speaker inside a recap row ---
els['btn-real'].handlers.click();
els['btn-next'].handlers.click();
let played = [byName.get(first.w)];
for (let i = 1; i < 10; i++) {
  played.push(byName.get(els.acronym.textContent));
  els['btn-real'].handlers.click();
  els['btn-next'].handlers.click();
}
spoken.length = 0;
els['recap-speak-4'].handlers.click({ stopPropagation(){} });
ok(spoken[0] === played[4].say,
   `the recap speaker should fall back to "${played[4].say}", said "${spoken[0]}"`);

console.log('all spoken-form checks passed');
