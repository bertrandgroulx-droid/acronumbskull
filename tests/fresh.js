// How many games can a player get through before any word comes round again?
const { boot, bank, ok, hidden: isHidden } = require('./lib/harness');
const { els, store } = boot();
const hidden = id => isHidden(els, id);
const localStorage = { getItem: k => (k in store ? store[k] : null) };

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
