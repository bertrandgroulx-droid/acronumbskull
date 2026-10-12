// Exercise the back/forward review flow against the page's real logic.
const { boot, bank, ok, hidden: isHidden } = require('./lib/harness');
const { els, store } = boot();
const hidden = id => isHidden(els, id);
const localStorage = { getItem: k => (k in store ? store[k] : null) };

const REAL = new Set(bank.r.map(x => x.w));

els['btn-start'].handlers.click();

// --- nav is out of the way on the very first word ---
ok(hidden('nav'), 'nav should be hidden on acronym 1');

// --- play three words, always answering "real", recording what we saw ---
const seen = [];
for (let i = 0; i < 3; i++) {
  seen.push({ w: els.acronym.textContent, def: els.def.innerHTML, ruling: null });
  els['btn-real'].handlers.click();
  seen[i].ruling = els['ruling-text'].textContent;
  seen[i].truth  = els['truth'].textContent;
  els['btn-next'].handlers.click();
}
ok(!hidden('nav'), 'nav should be visible once there is history');
ok(els['btn-forward'].disabled, 'forward must be disabled on the live acronym');
ok(!els['btn-back'].disabled, 'back must be enabled with history behind us');
const liveCard = els.acronym.textContent;

// --- step back through all three and check each one redisplays exactly ---
for (let i = 2; i >= 0; i--) {
  els['btn-back'].handlers.click();
  ok(els.acronym.textContent === seen[i].w, `back should show "${seen[i].w}", showed "${els.acronym.textContent}"`);
  // answered cards mark the acronym's letters, so compare with the markup stripped
  const shown = els.def.innerHTML.replace(/<\/?b>/g, '');
  ok(shown === seen[i].def, `expansion should match the reviewed acronym, got "${shown}"`);
  ok(els['ruling-text'].textContent === seen[i].ruling, 'ruling should match what was scored then');
  ok(els['truth'].textContent === seen[i].truth, 'status should match the reviewed acronym');
  ok(els['said'].textContent === 'You answered Real', 'review should show the answer given');
  ok(!hidden('said'), '"You answered" should be visible while reviewing');
  ok(hidden('btn-next'), 'Next must be hidden while reviewing an earlier acronym');
  ok(hidden('controls'), 'the Real/Fake buttons must stay hidden while reviewing');
}
ok(els['btn-back'].disabled, 'back must be disabled at acronym 1');

// --- answering while reviewing must not change the score ---
const before = els['tally'].textContent;
els['btn-real'].handlers.click();
els['btn-fake'].handlers.click();
ok(els['tally'].textContent === before, 'score must not move when clicking during review');
ok(els.acronym.textContent === seen[0].w, 'clicking during review must not advance');

// --- forward walks back to the live word ---
for (let i = 0; i < 3; i++) els['btn-forward'].handlers.click();
ok(els.acronym.textContent === liveCard, 'forward should return to the live acronym');
ok(els['btn-forward'].disabled, 'forward must be disabled again at the live word');
ok(!hidden('controls'), 'the live unanswered acronym should offer Real/Fake again');

// --- and the game still completes correctly from there ---
let played = 3;
while (played < 10) {
  const isReal = REAL.has(els.acronym.textContent);
  els[isReal ? 'btn-real' : 'btn-fake'].handlers.click();
  els['btn-next'].handlers.click();
  played++;
}
// the first three were answered "real" blindly, so only those that were real scored
const expected = seen.filter(x => x.ruling === 'Correct').length + 7;
ok(String(els['final'].textContent) === String(expected),
   `expected ${expected}/10 after reviewing then playing perfectly, got ${els['final'].textContent}`);
ok(els['recap'].innerHTML.split('<li>').length - 1 === 10, 'recap should list all ten acronyms');

console.log('all review-navigation checks passed');
