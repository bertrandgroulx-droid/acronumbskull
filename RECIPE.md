# Building another game like this one

Acronumbskull is a real-or-fake guessing game: ten cards, each a claim, and you decide
which are genuine. Nothing about that shape is specific to acronyms. The same machine
works for fake laws, invented company names, made-up medical conditions, imaginary
Wikipedia articles, plausible-sounding historical events, fake bird names, invented
cocktail recipes.

This file is the brief for building one. It exists because most of what makes this
game work is not in the code — it is in the rules about *content*, every one of which
was learned by getting it wrong first.

## Start by copying, not from scratch

The mechanics are done and debugged. Clone this repository and replace the content:

```sh
git clone https://github.com/bertrandgroulx-droid/acronumbskull.git newgame
cd newgame && rm -rf .git && git init -b main
```

Then rewrite `acronyms.js` for the new subject and rename the game in `index.html`
and `README.md`. Everything else — the game loop, difficulty levels, review
navigation, results screen, per-level bests, theming, tests, the audit — carries over
unchanged. Two files hold the whole game, and one of them is the content.

## What is in the box

| file | what it is |
|---|---|
| `index.html` | the whole game: markup, styles, logic. No build step, no dependencies |
| `acronyms.js` | the content: two arrays, `REAL_ACRONYMS` and `FAKE_ACRONYMS` |
| `tools/audit.js` | the fairness audit — run it after every batch |
| `tools/screen.js` | screens a candidate against a reference list *before* you write it up |
| `tests/` | seven suites that drive the real game logic against a DOM stub |
| `.github/workflows/pages.yml` | an Actions deploy, dormant here — see **Deploy** below |

A real entry carries `ex`, the example sentence. Fakes must not, because the example
is what makes the example appear:

```js
{ w: "posslq", say: "possel cue", cat: "government",
  def: "person of the opposite sex sharing living quarters",
  note: "Real. The US Census Bureau coined it in the 1970s to count couples who would not call themselves one.",
  ex: "For one census the country was full of <em>POSSLQs</em>, and then the form changed.",
  lvl: 3 }
```

`lvl` is 1 Easy, 2 Tricky, 3 Fiendish. Real vs fake comes from which array the entry
is in, so there is no flag to get wrong. `cat` is the field printed on the card, and
`say` records how the acronym is read aloud — nothing displays it, but the audit
counts it (see rule 5).

## Two kinds of fake

The most useful decision in this game, and the one that took three attempts: **a fake
can be fake at more than one level.** Here a card is either a genuine acronym under an
invented meaning:

```js
{ w: "nasa", say: "nassa", cat: "space",
  def: "National Aeronautics and Space Agency",
  note: "Fake. NASA stands for National Aeronautics and Space Administration — <em>administration</em>. …",
  lvl: 1 }
```

or an acronym nobody has ever issued, marked `coined: true`:

```js
{ w: "qrb", say: "Q R B", cat: "transport",
  def: "quiet route bypass",
  note: "Fake. QRB is real as a quality review board, and as the radio Q code for \"what is your distance?\"",
  coined: true, lvl: 1 }
```

With only the first kind, a player who recognises every acronym has one question left
instead of two. With only the second, recognising the letters wins the card outright.
Mixed, neither half of that knowledge settles anything on its own. Whatever your
subject, look for the equivalent split — a real thing wrongly described, and a thing
that does not exist at all.

It pays off twice, because the two kinds leak in opposite directions and cancel.
Invented acronyms came out word-shaped 69% of the time (you reach for birds and tools)
against the real half's 52%; the genuine-acronym fakes came out at 41%. Mixed: 50%.

## The rules that matter

Everything below was a bug found in play, usually by the person the game was built
for. They are the whole difficulty of this project.

**1. Screen every invention before you write a word of it.** With obscure words the
danger is that your invention turns out to be real. With acronyms it is worse: every
short letter string already stands for several things, so the question is not whether
it exists but whether the meaning you are about to invent is already taken.

```sh
curl -sL -o acronyms-ref.csv https://raw.githubusercontent.com/krishnakt031990/Crawl-Wiki-For-Acronyms/master/AcronymsFile.csv
curl -sL -o words.txt https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt
tr -d '\r' < words.txt > dict.txt        # the file ships with CRLF line endings
node tools/screen.js --ref acronyms-ref.csv --dict dict.txt NASA GCHQ TACAMO
node tools/audit.js --ref acronyms-ref.csv --dict dict.txt
```

About one pairing in six died at this step. MPEG "motion picture experts group" is
what the reference list already says. FIDO "fog intensive dispersal operation" was the
RAF's own later reading. ALGOL "algebraic oriented language" is on Britannica. CINCPAC
"Commander in Chief, Pacific Command" *is* CINCPAC. STRATCOM "Strategic Communications
Command" was a real US Army command until 1973. TEAL survived a whole draft as an
invention before the audit pointed out it was Tasman Empire Airways Limited.

A candidate that means something *else* is fine, and keeps the game fair: a player who
knows FOB is free on board correctly rejects "freight on board".

**2. Never use a backronym as a fake.** SOS, WI-FI, POSH, SCRAM, TEMPEST — expansions
invented after the fact and repeated ever since. Half your players have met them and
will call them real, and they are not wrong to. The opposite is a gift: ISO, SIGSALY
and TESCO are in the bank precisely because the note can say *this stands for nothing
at all*.

**3. The descriptions must be indistinguishable in style.** In the parent project,
real definitions carried a semicolon 18% of the time and fakes 0%, because a semicolon
means a second sense and only real entries had been given one. Here the same habit
showed up as capitalisation: inventing a meaning pulls you towards a tidy capitalised
organisation — Agency, Council, Association, Command — and the first draft carried a
proper noun in 56% of fakes against 32% of reals. A 24-point tell in the shape of the
line, before a word of it is read. The fix was a dozen lowercase technical entries:
CAT, PET, RICE, FAST, BRAT, FLOPS, CMOS, SAD, ADSL, PCR, SITREP.

Match **within each difficulty level**, not just overall; the aggregate can look fine
while one level leaks badly.

**4. Match how the answer is built, not just how it reads — and then show your
working.** Real acronyms cheat: RADAR skips the "and", MODEM takes three letters out
of "modulator", GESTAPO takes two from each of *Geheime Staatspolizei*, AWOL fishes
the O out of the middle of "withOut". An invented bank where every letter is neatly
the first letter of its own word is a bank you can win without reading anything — the
first draft came out at 100% clean fits against the real half's 49%. `tools/audit.js`
measures how the letters are taken on each side. Whatever your subject, find its
equivalent: the structural tic that real examples have and tidy inventions don't.

Then show it: answering a card lights up the letters that make the acronym, which is
most of the payoff of a round. The game reads them with the same matcher the audit
uses, and five entries carry a `spell` field for the cases where the cheapest reading
is not the true one.

**5. Anything visible without engaging with the meaning counts.** Every one of these
leaked here, and every one was found by the audit rather than by thinking:

- **familiarity** — if the fakes hang on obscure items and the reals on household
  ones, recognition alone decides the card. Measured against the reference list, over
  the genuine-acronym fakes only, since a coined one is *meant* to be absent: 50% real
  against 49%
- **length** — matched to within 0.1 letters per level, deliberately
- **word shape** — 52% of reals spell an English word against 50% of fakes
- **vowel-less strings** — 16% against 17%; a made-up initialism has no word behind it
  to supply an A or an I
- **said as letters vs said as a word** — 29% against 28%, which is what `say` is for
- **endings** — `-le` was 0 real against 9 invented in an early draft, exactly the tell
  the parent project had with `-ling`. ORACLE, SIMPLE and SAMPLE went in to fix it
- **the field printed on the card** — a field that is 90% real is a free answer

The fix always runs both ways: find real examples in the "fake-shaped" class, and
invent some in the "real-shaped" one.

**6. Keep the fields balanced.** No single subject should dominate. Military is the
largest here at 14% of the bank, then computing at 12%. When a field starts to feel
repetitive in play, trim it and widen the rest rather than adding more of the same.

## Tests

`node tests/run-all.js`. The suites load the real `index.html` script into a minimal
DOM stub and play actual games, so they exercise the shipped logic rather than a copy
of it. They caught a dropped field that would have shipped a broken feature.

Any new mechanic needs a suite. Any content change needs `tools/audit.js`, which exits
non-zero when something is off, so it can gate a commit.

## Deploy

This repo publishes straight from the branch: **Settings → Pages → Build and
deployment → Source → Deploy from a branch**, branch `main`, folder `/ (root)`. The
site is static and lives at the repo root, so GitHub rebuilds it on every push with no
workflow involved.

`.github/workflows/pages.yml` is the other route, for anyone who wants the deploy to
run as an Action. It is set to `workflow_dispatch` only here, because with a branch
source it would fail on every push; switching **Source → GitHub Actions** and putting
the `push` trigger back is all it takes. Either way **a human has to set the source by
hand once** — the workflow asks GitHub to create the Pages site itself and is refused,
because an automated token is not permitted to. Expect the first run to fail until
somebody clicks it.

## Audio, if you want it

This game shipped with 1088 spoken clips — four British voices, one per item —
rendered offline with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx)
(Apache-2.0, so the audio can be redistributed) and then dropped as unnecessary. The
renderer and the clips are in this repo's git history, and the parent project still
ships the feature if you would rather lift it whole.

One lesson worth carrying over if you do: **render each item with no punctuation.**
Appending a full stop makes the model treat it as a whole sentence and release the
final consonant into an extra syllable — `haboob` came out as "haboob-eh" for weeks.
Four voices at about 7 MB each is fine for GitHub Pages.

## A starting prompt

Paste something like this into a fresh session in the new repository:

> I want to build a real-or-fake guessing game in the shape of Acronumbskull
> (github.com/bertrandgroulx-droid/acronumbskull — read its `RECIPE.md` first, it is
> the brief). Same mechanics: ten items a game, a random real/fake split, three
> difficulty levels, review navigation, per-level bests.
>
> The subject is **<your subject>** instead of acronyms.
>
> Follow the content rules in the recipe exactly — screen every invented item against
> a reference source *before* writing it up, give the fakes more than one way to be
> fake, and run `tools/audit.js` after each batch so the descriptions and the surface
> features match on both sides.

Then let it copy the code across and spend the effort where it belongs: on the
content.
