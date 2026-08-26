#!/usr/bin/env node
/* Fairness audit for the acronym bank.
 *
 * A card is an acronym and what it supposedly stands for, and it can be fake in
 * two ways: a genuine acronym under an invented meaning (borrowed), or an
 * acronym nobody ever issued (coined, and marked `coined: true`). The game is
 * only honest if none of that is visible before the answer. The leaks are these:
 *
 *   - familiarity: if the borrowed fakes are hung on obscure acronyms and the
 *                  reals on household ones, the acronym alone decides it.
 *                  Measured against the reference list with --ref, over the
 *                  borrowed fakes only — a coined one is meant to be absent
 *   - length:      a bank of three-letter reals and six-letter fakes gives
 *                  itself away without a word being read
 *   - fit:         real expansions cheat. They skip "and", "of", "the", and take
 *                  two letters out of one word (RADAR, MODEM, COMECON). An
 *                  invented one that lines up one-letter-per-word is a tell, so
 *                  the invented ones have to cheat at the same rate
 *   - shape:       inventing an acronym pulls towards word-shaped strings and
 *                  vowel-less clusters at once; both have to match the real half
 *   - style:       expansion length, commas, capitalised names, trailing gloss.
 *                  Inventing pulls towards tidy capitalised organisation names
 *   - subject:     if every medical entry is real, the field name gives it away
 *
 *   node tools/audit.js [--dict dict.txt] [--ref acronyms-ref.csv]
 *
 * --dict  a large English word list; used to measure how often the acronym
 *         spells a real word, which must happen at the same rate on both sides
 * --ref   a list of known acronyms ("XYZ - what it stands for" per line). Used
 *         twice: to catch an invented expansion that is really one of the
 *         acronym's own meanings, and to compare how well known the two halves
 *         are. See tools/screen.js.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const arg = name => { const i = process.argv.indexOf(name); return i === -1 ? null : process.argv[i + 1]; };
const bank = new Function(fs.readFileSync(path.join(ROOT, 'acronyms.js'), 'utf8') +
  '; return {real: REAL_ACRONYMS, fake: FAKE_ACRONYMS};')();

const all = [...bank.real, ...bank.fake];
const base = bank.fake.length / all.length;
const pct = n => Math.round(100 * n);
const share = (arr, test) => pct(arr.filter(test).length / arr.length);
const words = x => x.def.split(/\s+/).length;
let problems = 0;
const flag = msg => { problems++; console.log('  ** ' + msg); };
const row = (label, r, k, limit) => {
  const gap = Math.abs(r - k);
  console.log(`  ${label.padEnd(30)} ${String(r).padStart(4)} ${String(k).padStart(5)} ${String(gap).padStart(5)}${gap > limit ? '  **' : ''}`);
  if (gap > limit) problems++;
};

console.log(`BANK: ${bank.real.length} real + ${bank.fake.length} fake = ${all.length} (${pct(base)}% fake)`);
[1, 2, 3].forEach(l => {
  const r = bank.real.filter(x => x.lvl === l).length, k = bank.fake.filter(x => x.lvl === l).length;
  console.log(`  level ${l}: ${r} real + ${k} fake`);
});

/* ---------- integrity ---------- */
console.log('\nINTEGRITY');
const names = all.map(x => x.w);
const dupes = names.filter((w, i) => names.indexOf(w) !== i);
if (dupes.length) flag('duplicate acronyms: ' + dupes.join(', '));
const missing = all.filter(x => !x.w || !x.say || !x.cat || !x.def || !x.note || !x.lvl);
if (missing.length) flag('entries missing a field: ' + missing.map(x => x.w || '??').join(', '));
const noEx = bank.real.filter(x => !x.ex);
if (noEx.length) flag('real acronyms with no example: ' + noEx.map(x => x.w).join(', '));
const fakeEx = bank.fake.filter(x => x.ex);
if (fakeEx.length) flag('invented acronyms carrying an example: ' + fakeEx.map(x => x.w).join(', '));
const odd = names.filter(w => !/^[a-z]+$/.test(w));
if (odd.length) flag('acronyms that are not plain lowercase: ' + odd.join(', '));
const notes = bank.fake.filter(x => !/^Fake/.test(x.note));
if (notes.length) flag('invented notes not opening "Fake": ' + notes.map(x => x.w).join(', '));
const badSay = all.filter(x => !/^[A-Za-z][A-Za-z '-]*$/.test(x.say));
if (badSay.length) flag('spoken forms that are not plain letters: ' + badSay.map(x => x.w).join(', '));
// `spell` overrides the automatic reading, so it has to be the same words with the
// acronym's own letters bracketed — a typo here would light the wrong letters.
const badSpell = all.filter(x => x.spell && (
  x.spell.replace(/[\[\]]/g, '') !== x.def ||
  (x.spell.match(/\[([^\]]*)\]/g) || []).join('').replace(/[\[\]]/g, '').toLowerCase() !== x.w));
if (badSpell.length) flag('spell overrides that do not match their entry: ' + badSpell.map(x => x.w).join(', '));
if (!problems) console.log('  clean');

/* ---------- does the expansion actually produce the acronym? ---------- */
// Real acronyms cheat, and they cheat in patterns: they drop the small words
// (RADAR takes nothing from "and"), and they take a run of letters out of one
// word (MODEM is modulator-demodulator). An invented set where every letter is
// the first letter of its own word is a set a player can spot at a glance.
/* The game marks the letters that make the acronym when a card is answered, and it
 * has to agree with this audit about how they were taken. So rather than keeping a
 * second matcher here, pull the shipped one out of index.html and measure that.
 */
const gameScript = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  .match(/<script>\n([\s\S]*?)<\/script>/)[1];
const game = new Function(
  gameScript.slice(gameScript.indexOf('var SMALL ='), gameScript.indexOf('/* ---------- screens')) +
  '; return { reading: reading, SMALL_SET: SMALL_SET };')();

// Where the letters landed, as the game would light them.
function litPositions(entry) {
  if (entry.spell) {
    const lit = new Set();
    let i = 0, inside = false;
    for (const ch of entry.spell) {
      if (ch === '[') { inside = true; continue; }
      if (ch === ']') { inside = false; continue; }
      if (inside) lit.add(i);
      i++;
    }
    return lit;
  }
  const path = game.reading(entry.w, entry.def);
  if (!path) return null;
  const lit = new Set();
  path.forEach(p => p.pos.forEach(o => lit.add(p.at + o)));
  return lit;
}

/* How the letters were taken, in the terms that matter for fairness: one per word, a
 * word giving up two or more, letters lifted from inside a word, a small word skipped
 * over, a word that matters skipped over. Anything the matcher cannot read at all
 * comes back null.
 */
function fit(entry) {
  const lit = litPositions(entry);
  if (!lit) return null;
  const counts = { skips: 0, multi: 0, gapped: 0, small: 0 };
  const words = [];
  const re = /[A-Za-z]+/g;
  let m;
  while ((m = re.exec(entry.def)) !== null) {
    const pos = [];
    for (let k = 0; k < m[0].length; k++) if (lit.has(m.index + k)) pos.push(k);
    words.push({ text: m[0].toLowerCase(), pos });
  }
  const used = words.map((w, i) => (w.pos.length ? i : -1)).filter(i => i !== -1);
  if (!used.length) return null;
  words.forEach((w, i) => {
    if (w.pos.length > 1) {
      counts.multi++;
      for (let k = 1; k < w.pos.length; k++) if (w.pos[k] !== w.pos[k - 1] + 1) { counts.gapped++; break; }
    } else if (w.pos.length === 1 && w.pos[0] !== 0) {
      counts.gapped++;                       // one letter, taken from inside the word
    }
    // a word passed over between the first and last contribution
    if (!w.pos.length && i > used[0] && i < used[used.length - 1]) {
      if (game.SMALL_SET[w.text]) counts.small++; else counts.skips++;
    }
  });
  return counts;
}

console.log('\nDOES THE EXPANSION SPELL THE ACRONYM?');
const misfitFake = bank.fake.filter(x => !fit(x));
if (misfitFake.length) flag('invented expansion does not spell its acronym: ' + misfitFake.map(x => x.w).join(', '));
const misfitReal = bank.real.filter(x => !fit(x));
// A handful of genuine acronyms were respelled after the fact — PELICAN was
// PELICON until someone preferred the bird. Those are worth knowing about, but
// they are not errors; an invented one that does not spell out is.
if (misfitReal.length) console.log('  real acronyms that were respelled and no longer spell out: ' + misfitReal.map(x => x.w).join(', '));
if (!misfitFake.length && !misfitReal.length) console.log(`  all ${all.length} expansions produce their acronym`);
const fits = x => fit(x) || { skips: 0, multi: 0, small: 0 };
console.log('\nHOW THE LETTERS ARE TAKEN         real  fake   gap');
row('one letter per word, in order', share(bank.real, x => fits(x).multi === 0 && fits(x).skips === 0 && fits(x).gapped === 0),
    share(bank.fake, x => fits(x).multi === 0 && fits(x).skips === 0 && fits(x).gapped === 0), 12);
row('skips "and", "of", "the"', share(bank.real, x => fits(x).small > 0), share(bank.fake, x => fits(x).small > 0), 12);
row('takes 2+ letters from a word', share(bank.real, x => fits(x).multi > 0), share(bank.fake, x => fits(x).multi > 0), 12);
row('takes letters from inside a word', share(bank.real, x => fits(x).gapped > 0), share(bank.fake, x => fits(x).gapped > 0), 12);
row('skips a word that matters', share(bank.real, x => fits(x).skips > 0), share(bank.fake, x => fits(x).skips > 0), 12);

/* ---------- reference screen ---------- */
const refPath = arg('--ref');
if (refPath && fs.existsSync(refPath)) {
  const ref = new Map();
  fs.readFileSync(refPath, 'utf8').split('\n').forEach(line => {
    const at = line.indexOf(' - ');
    if (at === -1) return;
    const key = line.slice(0, at).trim().toLowerCase();
    if (key) ref.set(key, (ref.get(key) || []).concat(line.slice(at + 3).trim()));
  });
  console.log('\nREFERENCE SCREEN');
  /* Three different questions, because a fake can be fake in two ways.
   *
   * A *borrowed* fake is a genuine acronym under an invented meaning. For those:
   * does the invented meaning collide with a meaning the acronym really has? Then
   * it is not a fake at all, and a player who knows it is punished for being
   * right. And are those acronyms as familiar as the real half's? If the borrowed
   * ones came from obscure corners, the acronym alone answers the card.
   *
   * A *coined* fake is an acronym that does not exist. For those the old question
   * applies: does the string already stand for something well known? Then it is
   * not coined, it is borrowed by accident, and the note is wrong.
   */
  const borrowed = bank.fake.filter(x => !x.coined);
  const coined = bank.fake.filter(x => x.coined);
  const norm = t => t.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  const stop = new Set(['the', 'of', 'for', 'and', 'a', 'an', 'in', 'on', 'to', 'united', 'states', 'national', 'international', 'system', 'service']);
  const keyed = t => norm(t).split(' ').filter(w => w && !stop.has(w));
  const collides = (mine, theirs) => {
    const a = keyed(mine), b = keyed(theirs);
    if (!a.length || !b.length) return false;
    return a.filter(w => b.includes(w)).length / Math.max(a.length, b.length) > 0.8;
  };
  const clashes = borrowed.filter(x => (ref.get(x.w) || []).some(t => collides(x.def, t)));
  if (clashes.length) {
    flag('invented meanings that are already a real meaning of the acronym:');
    clashes.forEach(x => console.log(`    ${x.w.toUpperCase()} — ours: ${x.def} | theirs: ${ref.get(x.w).join(' / ')}`));
  } else console.log(`  none of the ${borrowed.length} invented meanings match a meaning the list knows`);
  const taken = coined.filter(x => ref.has(x.w));
  if (taken.length) {
    flag('coined acronyms the reference list already knows (check the meanings):');
    taken.forEach(x => console.log(`    ${x.w.toUpperCase()} — ours: ${x.def} | theirs: ${ref.get(x.w).join(' / ')}`));
  } else console.log(`  none of the ${coined.length} coined acronyms appear in the list`);
  const known = arr => pct(arr.filter(x => ref.has(x.w)).length / arr.length);
  const kr = known(bank.real), kb = known(borrowed), kgap = Math.abs(kr - kb);
  console.log(`  borrowed acronym is in the list    ${String(kr).padStart(4)} ${String(kb).padStart(5)} ${String(kgap).padStart(5)}${kgap > 15 ? '  **' : ''}`);
  if (kgap > 15) { problems++; console.log('    ** the borrowed acronyms are more obscure than the real ones, so the acronym answers the card'); }
}

/* ---------- shape ---------- */
const dictPath = arg('--dict');
console.log('\nSHAPE                             real  fake   gap');
if (dictPath && fs.existsSync(dictPath)) {
  const dict = new Set(fs.readFileSync(dictPath, 'utf8').split('\n').map(s => s.trim()).filter(Boolean));
  row('spells an English word', share(bank.real, x => dict.has(x.w)), share(bank.fake, x => dict.has(x.w)), 12);
}
row('has no vowel (a e i o u y)', share(bank.real, x => !/[aeiouy]/.test(x.w)), share(bank.fake, x => !/[aeiouy]/.test(x.w)), 12);
row('read aloud as letters', share(bank.real, x => / /.test(x.say) && x.say === x.say.toUpperCase()),
    share(bank.fake, x => / /.test(x.say) && x.say === x.say.toUpperCase()), 12);
[1, 2, 3].forEach(l => {
  const r = bank.real.filter(x => x.lvl === l), k = bank.fake.filter(x => x.lvl === l);
  const rl = r.reduce((a, c) => a + c.w.length, 0) / r.length;
  const kl = k.reduce((a, c) => a + c.w.length, 0) / k.length;
  const gap = Math.abs(rl - kl);
  console.log(`  level ${l} mean letters`.padEnd(32) + `${rl.toFixed(1).padStart(4)} ${kl.toFixed(1).padStart(5)} ${gap.toFixed(1).padStart(5)}${gap > 0.6 ? '  **' : ''}`);
  if (gap > 0.6) problems++;
});

/* ---------- expansion style ---------- */
console.log('\nEXPANSION STYLE                   real  fake   gap');
const markers = [
  ['contains a comma', x => x.def.includes(',')],
  ['contains "and"', x => /\band\b/.test(x.def)],
  ['contains "of"', x => /\bof\b/.test(x.def)],
  ['contains a capitalised word', x => /(^|\s)[A-Z]/.test(x.def)],
  ['under 4 words', x => words(x) < 4],
  ['over 7 words', x => words(x) > 7],
  ['ends in a noun of process', x => /(ing|ion|ment|ance|ence)$/.test(x.def.split(/\s+/).pop())],
];
markers.forEach(([label, test]) => row(label, share(bank.real, test), share(bank.fake, test), 12));
[1, 2, 3].forEach(l => {
  const r = bank.real.filter(x => x.lvl === l), k = bank.fake.filter(x => x.lvl === l);
  const rm = r.reduce((a, c) => a + words(c), 0) / r.length;
  const km = k.reduce((a, c) => a + words(c), 0) / k.length;
  const gap = Math.abs(rm - km);
  console.log(`  level ${l} mean words`.padEnd(32) + `${rm.toFixed(1).padStart(4)} ${km.toFixed(1).padStart(5)} ${gap.toFixed(1).padStart(5)}${gap > 1.5 ? '  **' : ''}`);
  if (gap > 1.5) problems++;
});

/* ---------- endings ---------- */
console.log('\nACRONYM ENDINGS (8+ entries, more than 30 points off the base rate)');
const counts = {};
const tally = (w, side) => {
  for (const n of [2, 3]) {
    if (w.length <= n + 1) continue;
    const s = w.slice(-n);
    counts[s] = counts[s] || { real: 0, fake: 0 };
    counts[s][side]++;
  }
};
bank.real.forEach(x => tally(x.w, 'real'));
bank.fake.forEach(x => tally(x.w, 'fake'));
const skewed = Object.entries(counts)
  .filter(([, c]) => c.real + c.fake >= 8)
  .map(([s, c]) => ({ s, ...c, share: c.fake / (c.real + c.fake) }))
  .filter(x => Math.abs(x.share - base) > 0.3)
  .sort((a, b) => b.share - a.share);
if (skewed.length) skewed.forEach(x => flag(`-${x.s}: ${x.real} real / ${x.fake} fake = ${pct(x.share)}% fake`));
else console.log('  none');

/* ---------- subject matter ---------- */
// The field is printed on the card, so a field that is 90% real is a free answer.
console.log('\nFIELDS (6+ entries, more than 25 points off the base rate)');
const cats = {};
all.forEach(x => {
  cats[x.cat] = cats[x.cat] || { real: 0, fake: 0 };
  cats[x.cat][bank.real.includes(x) ? 'real' : 'fake']++;
});
const catRows = Object.entries(cats).sort((a, b) => (b[1].real + b[1].fake) - (a[1].real + a[1].fake));
catRows.forEach(([name, c]) => {
  const n = c.real + c.fake, s = c.fake / n;
  const off = Math.abs(s - base) > 0.25 && n >= 6;
  console.log(`  ${name.padEnd(14)} ${String(c.real).padStart(3)} real ${String(c.fake).padStart(3)} fake  ${String(pct(s)).padStart(3)}% fake${off ? '  **' : ''}`);
  if (off) problems++;
});
const biggest = catRows[0];
if (biggest && biggest[1].real + biggest[1].fake > all.length * 0.2)
  flag(`"${biggest[0]}" is ${pct((biggest[1].real + biggest[1].fake) / all.length)}% of the bank — no field should dominate`);

console.log(problems ? `\n${problems} thing(s) to fix` : '\nnothing to fix');
process.exit(problems ? 1 : 0);
