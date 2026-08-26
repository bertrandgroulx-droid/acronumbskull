#!/usr/bin/env node
/* Fairness audit for the acronym bank.
 *
 * The game is only honest if a player cannot tell real from fake without
 * thinking about the meaning. With words the leaks were spelling habits; with
 * acronyms they are these:
 *
 *   - length:    inventing tends to produce five- and six-letter pronounceable
 *                strings, while the household real ones are three letters
 *   - fit:       real expansions cheat — they skip "and", "of", "the", and take
 *                two letters out of one word (RADAR, MODEM, COMECON). An
 *                invented one that lines up perfectly is a tell
 *   - style:     expansion length, commas, capitalised names, trailing gloss
 *   - subject:   if every medical entry is real, the field name gives it away
 *
 *   node tools/audit.js [--dict dict.txt] [--ref acronyms-ref.csv]
 *
 * --dict  a large English word list; used to measure how often the acronym
 *         spells a real word, which must happen at the same rate on both sides
 * --ref   a list of known acronyms ("XYZ - what it stands for" per line); every
 *         invented entry is checked against it. See tools/screen.js.
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
if (odd.length) flag('acronyms that are not plain lowercase (audio filenames break): ' + odd.join(', '));
const notes = bank.fake.filter(x => !/^Fake/.test(x.note));
if (notes.length) flag('invented notes not opening "Fake": ' + notes.map(x => x.w).join(', '));
const badSay = all.filter(x => !/^[A-Za-z][A-Za-z '-]*$/.test(x.say));
if (badSay.length) flag('spoken forms with characters the renderer will trip on: ' + badSay.map(x => x.w).join(', '));
if (!problems) console.log('  clean');

/* ---------- does the expansion actually produce the acronym? ---------- */
// Real acronyms cheat, and they cheat in patterns: they drop the small words
// (RADAR takes nothing from "and"), and they take a run of letters out of one
// word (MODEM is modulator-demodulator). An invented set where every letter is
// the first letter of its own word is a set a player can spot at a glance.
const SMALL = new Set(['and', 'of', 'the', 'for', 'to', 'a', 'an', 'in', 'on', 'at', 'by', 'or', 'with', 'is', 'it', 'that', 'what', 'you', 'see', 'my', 'i', 'as', 'soon', 'possible']);
function fit(entry) {
  const letters = entry.w.toLowerCase().split('');
  const src = entry.def.split(/[^A-Za-z]+/).filter(Boolean).map(w => w.toLowerCase());
  const memo = new Map();
  const cost = x => x.skips * 1000 + x.multi * 100 + x.gapped * 10 + x.small;
  // Every word may give up a run of its letters, in order but not necessarily
  // adjacent — that is how AWOL gets its O out of "withOut" and QUASAR its AR
  // out of "stellAR". Words may also be passed over entirely.
  function takes(word, li) {
    // all the ways this word can supply 1+ of the next acronym letters
    const out = [];
    let wi = 0, taken = 0, gaps = 0;
    while (wi < word.length && li + taken < letters.length) {
      if (word[wi] === letters[li + taken]) {
        if (taken > 0 && out.length && wi !== out[out.length - 1].at + 1) gaps = 1;
        taken++;
        out.push({ take: taken, gapped: gaps || (taken > 1 && wi !== out[out.length - 1].at + 1) ? 1 : 0, at: wi });
      }
      wi++;
    }
    // recompute "gapped" honestly: a run is gapped if the letters were not adjacent
    let last = -2, gapped = 0;
    return out.map((o, i) => {
      if (i > 0 && o.at !== out[i - 1].at + 1) gapped = 1;
      return { take: o.take, gapped };
    });
  }
  function walk(wi, li) {
    if (li === letters.length) return { skips: 0, multi: 0, gapped: 0, small: 0 };
    if (wi === src.length) return null;
    const key = wi + ':' + li;
    if (memo.has(key)) return memo.get(key);
    let best = null;
    const consider = c => { if (c && (!best || cost(c) < cost(best))) best = c; };
    const skipped = walk(wi + 1, li);
    if (skipped) consider({
      skips: skipped.skips + (SMALL.has(src[wi]) ? 0 : 1),
      multi: skipped.multi, gapped: skipped.gapped,
      small: skipped.small + (SMALL.has(src[wi]) ? 1 : 0),
    });
    for (const t of takes(src[wi], li)) {
      const rest = walk(wi + 1, li + t.take);
      if (rest) consider({
        skips: rest.skips, multi: rest.multi + (t.take > 1 ? 1 : 0),
        gapped: rest.gapped + t.gapped, small: rest.small,
      });
    }
    memo.set(key, best);
    return best;
  }
  return walk(0, 0);
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
  const hits = bank.fake.filter(x => ref.has(x.w));
  if (hits.length) {
    console.log('  invented acronyms the reference list already knows (check the meanings):');
    hits.forEach(x => console.log(`    ${x.w.toUpperCase()} — ours: ${x.def} | theirs: ${ref.get(x.w).join(' / ')}`));
  } else console.log(`  none of the ${bank.fake.length} invented acronyms appear in the list`);
  const unconfirmed = bank.real.filter(x => !ref.has(x.w));
  console.log(`  real acronyms not in the list (judge these yourself): ${unconfirmed.length} of ${bank.real.length}`);
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
