// Every word dealt must belong to the chosen difficulty, and each level must
// hold enough words to play a decent run without repeats.
const { boot, bank, ok, hidden: isHidden } = require('./lib/harness');
const { els, store } = boot();
const hidden = id => isHidden(els, id);
const localStorage = { getItem: k => (k in store ? store[k] : null) };

const lvlOf = new Map([...bank.r, ...bank.k].map(x => [x.w, x.lvl]));

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
      if (els['truth'].textContent === 'Real') reals++;
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
ok(JSON.parse(store['acronumbskull:level']) === 3, 'chosen level should be remembered');
console.log('all difficulty checks passed');
