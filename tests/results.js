// The results screen: expandable word details, and Play again returning to the options.
const { boot, bank, ok, hidden: isHidden } = require('./lib/harness');
const { els, store } = boot();
const hidden = id => isHidden(els, id);
const localStorage = { getItem: k => (k in store ? store[k] : null) };

const byWord = new Map([...bank.r, ...bank.k].map(x => [x.w, x]));

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
// the expansion is marked up letter by letter in the recap, so strip that to compare
const detailPlain = detailHtml.replace(/<\/?b>/g, '');
seen.forEach((s, i) => {
  const entry = byWord.get(s.w);
  ok(detailPlain.includes(entry.def), `expansion for "${s.w}" missing from the recap`);
  ok(detailHtml.includes(entry.note), `note for "${s.w}" missing from the recap`);
  if (entry.ex) ok(detailHtml.includes(entry.ex), `example for real expansion "${s.w}" missing`);
  ok(detailHtml.includes('You answered ' + (s.guessedReal ? 'Real' : 'Fake')),
     `the answer given for "${s.w}" should be shown`);
});
const fakes = seen.filter(s => !byWord.get(s.w).ex).length;
console.log(`recap details verified for 10 acronyms (${10-fakes} real with examples, ${fakes} fake without)`);


// a random game's results offer the random buttons, not the daily's
ok(hidden('btn-again') && !hidden('btn-today'), 'a random result offers Today\u2019s puzzle, not Play it again');
ok(els['btn-random'].textContent === 'More random puzzles', 'the primary button should offer more random puzzles');
ok(hidden('saved') && !hidden('best-line-2'), 'a random result shows the personal best, not the daily saved line');
ok(String(els['split'].textContent).startsWith('Tricky'), 'a random result names its level');

// More random puzzles goes back to the options rather than dealing immediately
els['btn-random'].handlers.click();
ok(!hidden('start'), 'More random puzzles should show the level picker');
ok(hidden('results') && hidden('game'), 'only the start screen should be visible');
ok(!!els['lvl-1'].getAttribute('aria-pressed'), 'difficulty options should be on that screen');
console.log('all results-screen checks passed');
