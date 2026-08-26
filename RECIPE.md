# Building another game like this one

Fauxcabulary is a real-or-fake guessing game: ten items, each with a plausible
description, and you decide which are genuine. Nothing about that shape is specific
to words. The same machine works for fake laws, invented company names, made-up
medical conditions, imaginary Wikipedia articles, plausible-sounding historical
events, fake bird names, invented cocktail recipes.

This file is the brief for building one. It exists because most of what makes this
game work is not in the code — it is in the rules about *content*, every one of which
was learned by getting it wrong first.

## Start by copying, not from scratch

The mechanics are done and debugged. Clone this repository and replace the content:

```sh
git clone https://github.com/bertrandgroulx-droid/fauxcabulary.git newgame
cd newgame && rm -rf .git audio && git init -b main
```

Then rewrite `words.js` for the new subject, regenerate the audio if it needs it, and
rename the game in `index.html` and `README.md`. Everything else — the game loop,
difficulty levels, review navigation, results screen, per-level bests, voice picking,
theming, tests, deploy workflow — carries over unchanged.

## What is in the box

| file | what it is |
|---|---|
| `index.html` | the whole game: markup, styles, logic. No build step, no dependencies |
| `words.js` | the content: two arrays, `REAL_WORDS` and `FAKE_WORDS` |
| `audio/<voice>/<word>.mp3` | one spoken clip per item per voice |
| `tools/make-audio.py` | renders the clips with Kokoro |
| `tools/audit.js` | the fairness audit — run it after adding content |
| `tests/` | seven suites that drive the real game logic against a DOM stub |
| `.github/workflows/pages.yml` | deploys to GitHub Pages on push to `main` |

An entry looks like this. Real ones carry `ex`; invented ones must not, because the
example is what makes the example appear:

```js
{ w: "borborygmus", pos: "noun",
  def: "the rumbling noise made by gas moving through the intestines",
  note: "Real. From Greek <em>borborygmos</em> — the word is basically the sound.",
  ex: "The lecture hall fell silent just in time to hear the <em>borborygmus</em>.",
  lvl: 3 }
```

`lvl` is 1 Easy, 2 Tricky, 3 Fiendish. Real vs fake comes from which array the entry
is in, so there is no flag to get wrong.

## The rules that matter

Everything below was a bug found in play, usually by the person the game was built
for. They are the whole difficulty of this project.

**1. Verify the real ones, and verify the invented ones too.** Four words written as
inventions turned out to be genuine — `crepusculine`, `somnifuge`, `fumarine`,
`susurrant`. Screen candidates against a large word list *before* writing definitions
for them. Six sports terms were rejected this way in one batch.

```sh
curl -sL -o words.txt https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt
tr -d '\r' < words.txt > dict.txt        # the file ships with CRLF line endings
node tools/audit.js --dict dict.txt
```

Absence from the list is not proof of fakeness — `petrichor`, `saudade` and `oche` are
all real and all missing from it. Presence *is* proof of realness.

**2. The descriptions must be indistinguishable in style.** An audit found real
definitions carried a semicolon 18% of the time and fakes 0%, because a semicolon
means a second sense and only real entries had been given one. Real used "or" in 23%
against 1%. At Easy, real definitions averaged 5.5 words and fakes 8.6 — so the
shorter one was reliably real. Write invented definitions to the same distribution:
second senses, alternatives, terse three-word entries, occasional long specific ones.
Match **within each difficulty level**, not just overall; the aggregate can look fine
while one level leaks badly.

**3. Anything visible without reading counts.** Three separate surface features leaked:

- **endings**: `-ine` was 89% fake, `-ling` and `-ick` 100%, while `-ous` was 84% real
- **shape**: a word visibly made of two everyday words was 69% fake
- **part of speech**: adverbs were 3% of fakes and 0.3% of reals

Each came from unconscious habit — inventing a word pulls you toward a Latinate ending
or a compound. The fix runs both ways: find real examples in the "fake-shaped" class
(English has hundreds — `hircine`, `quisling`, `scuttlebutt`, `wolfsbane`) and invent
some in the "real-shaped" class. `tools/audit.js` measures all of it.

**4. Keep the categories balanced.** A run of sports terms made the game feel narrow,
and cutting them from 12% of the bank to 5% fixed it. No single subject should
dominate.

## Audio

Device speech synthesis sounds robotic on phones — iOS ships compact voices by
default — so the game ships its own clips. Kokoro is Apache-2.0, so the audio can be
redistributed.

```sh
pip install kokoro-onnx soundfile lameenc mutagen
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
python3 tools/make-audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin
```

Hugging Face may be unreachable from a sandbox; GitHub release downloads work.

**Render each item with no punctuation.** Appending a full stop makes the model treat
it as a whole sentence and release the final consonant into an extra syllable —
`haboob` came out as "haboob-eh" for weeks. Four voices at about 7 MB each is fine for
GitHub Pages.

## Tests

`node tests/run-all.js`. The suites load the real `index.html` script into a minimal
DOM stub and play actual games, so they exercise the shipped logic rather than a copy
of it. They caught a dropped field that would have shipped a broken feature.

Any new mechanic needs a suite. Any content change needs `tools/audit.js`.

## Deploy

Push to `main` and the included workflow publishes to GitHub Pages. **One manual step
the first time:** the repository owner must set Settings → Pages → Source → GitHub
Actions. The workflow tries to enable Pages itself and cannot — an automated token is
not allowed to, so the first run fails until a human clicks it.

## A starting prompt

Paste something like this into a fresh session in the new repository:

> I want to build a real-or-fake guessing game in the shape of Fauxcabulary
> (github.com/bertrandgroulx-droid/fauxcabulary — read its `RECIPE.md` first, it is
> the brief). Same mechanics: ten items a game, a random real/fake split, three
> difficulty levels, spoken clips, review navigation, per-level bests.
>
> The subject is **<your subject>** instead of obscure words.
>
> Follow the content rules in the recipe exactly — screen the invented items against
> a reference source before writing descriptions for them, and run `tools/audit.js`
> after each batch so the descriptions and surface features match on both sides.

Then let it copy the code across and spend the effort where it belongs: on the
content.
