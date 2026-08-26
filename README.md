# 🔤 Acronumbskull

**Ten acronyms. Some of them are fake.**

Acronumbskull shows you an acronym and what it supposedly stands for. You decide:
**REAL** or **FAKE**. Ten a game, one point each, score out of 10.

A card can be fake in two ways, and you cannot tell which until the answer. Either the
acronym is genuine and the meaning under it is not — NASA is real, the National
Aeronautics and Space *Agency* is not — or nobody has ever issued the acronym at all.
So recognising the letters does not settle it, and neither does not recognising them.

How many of the ten are genuine is random — every card flips its own coin, so a round
might hold three real acronyms or eight, and counting won't help you. The fakes spell
out their letters in the same cheating way real ones do, and sound like the sort of
thing a committee would have agreed. After each guess you get the truth, plus a note:
where the real one comes from, or what those letters really stand for instead.

Some of them are harder than they look. NASA is Administration, not Agency. The FBI is
Investigation, not Intelligence. ISO stands for nothing at all. And WOMBAT really is
Weapon Of Magnesium, Battalion, Anti-Tank, however much it sounds like something
invented for a quiz.

## Features

- 10 acronyms per game with a random real/fake split, freshly shuffled.
- Three difficulty levels — Easy, Tricky and Fiendish — each with its own acronyms and
  its own fakes. Your choice is remembered.
- Instant reveal after each answer — **Correct** or **Wrong**, the card's status, and a
  note with the history, or with what those letters really stand for.
- Back and Forward buttons to step through the ones you have already answered.
- Score out of 10 with a rank and a copyable emoji result grid.
- A per-card recap where any row can be tapped open for the expansion, the note, the
  example sentence and the answer you gave.
- Play again returns to the options, so the difficulty can be changed between games.
- Personal best saved per difficulty, and labelled with the level it was set at.
- Every real acronym comes with an example sentence, shown whether you got it right
  or not.
- Keyboard play: `←` real, `→` fake; once answered, the arrows move through your
  answers and `Enter` goes on.
- Light and dark themes, following whatever your phone is set to.
- No build step, no dependencies, no tracking. One HTML file and one data file.

## Run it locally

It's a static site — double-click `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

The site is static and lives at the root of the repo, so the simplest route is the one
this repo uses: **Settings → Pages → Build and deployment → Source → Deploy from a
branch**, branch `main`, folder `/ (root)`. GitHub builds it on every push to `main`,
with no workflow involved, and serves it at
`https://<your-username>.github.io/acronumbskull/`.

`.github/workflows/pages.yml` is the other route, for anyone who wants the deploy to
run as an Action. Switching **Source → GitHub Actions** and changing the workflow's
trigger back to `push: branches: [main]` is all it takes — it is set to
`workflow_dispatch` only here so that it does not fail on every push while the branch
source is doing the work. Note that the workflow cannot enable Pages for you: it asks
GitHub to create the site (`enablement: true`) and an automated token is not permitted
to, so the source has to be set by hand first either way.

## Tests and audits

```sh
node tests/run-all.js                # seven suites, driving the real game logic
node tools/audit.js --dict dict.txt --ref acronyms-ref.csv    # fairness audit
node tools/screen.js --ref acronyms-ref.csv ZMP PLOD KESTREL  # screen candidates
```

The reference files are fetched, not committed:

```sh
curl -sL -o words.txt https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt
tr -d '\r' < words.txt > dict.txt
curl -sL -o acronyms-ref.csv https://raw.githubusercontent.com/krishnakt031990/Crawl-Wiki-For-Acronyms/master/AcronymsFile.csv
```

Run the suites after touching `index.html`, and the audit after touching
`acronyms.js`.

## Adding acronyms

All the content is in `acronyms.js` — two arrays, `REAL_ACRONYMS` (109 entries) and
`FAKE_ACRONYMS` (163), 272 in all. Each level holds between 85 and 94 of them, which is
about nine games before one comes round again.

A real entry looks like this:

```js
{
  w: "posslq",
  say: "possel cue",
  cat: "government",
  def: "person of the opposite sex sharing living quarters",
  note: "Real. The US Census Bureau coined it in the 1970s to count couples who would not call themselves one.",
  ex: "For one census the country was full of <em>POSSLQs</em>, and then the form changed.",
  lvl: 3
}
```

A fake entry comes in two kinds. A **borrowed** one is a genuine acronym under a
meaning that is not its own — 109 of the 163:

```js
{
  w: "nasa",
  say: "nassa",
  cat: "space",
  def: "National Aeronautics and Space Agency",
  note: "Fake. NASA stands for National Aeronautics and Space Administration — <em>administration</em>. It is a civilian agency of government, but the A is for Administration.",
  lvl: 1
}
```

A **coined** one is an acronym nobody has ever issued, carrying `coined: true` — 54 of
the 163:

```js
{
  w: "qrb",
  say: "Q R B",
  cat: "transport",
  def: "quiet route bypass",
  note: "Fake. QRB is real as a quality review board, and as the radio Q code for \"what is your distance?\"",
  coined: true,
  lvl: 1
}
```

Having both kinds is what stops the acronym itself being the answer. With only
borrowed fakes, a player who recognises every acronym on sight only ever has to judge
the meaning; with only coined ones, recognising the letters wins the card outright.
Mixed, neither half of that knowledge settles anything on its own.

- `w` is the acronym, lowercase — it is displayed in capitals.
- `say` records how it is read aloud: SCUBA as a word, PDF as `"P D F"`. Nothing
  displays it; the audit reads it, because an acronym said as a word and one spelled
  out are visibly different things and have to be split evenly across both sides.
- `spell` is optional, and only five entries carry it. See below.
- `cat` is the field printed on the card.
- `def` is the expansion the player is judging: the real one in `REAL_ACRONYMS`, an
  invented one in `FAKE_ACRONYMS`.
- `note` gives the game away afterwards. On a fake it has to say what the letters
  really stand for, or that they stand for nothing — that is the payoff of the round.
- `coined: true` marks a fake whose acronym is invented too. The game does not read
  it; `tools/audit.js` does, because the two kinds have to be screened differently.
- `ex` belongs on real entries only — it is what makes the example sentence appear,
  so a fake entry must not have one.
- `lvl` is the difficulty: 1 Easy, 2 Tricky, 3 Fiendish.

The game works out real vs. fake from which array the entry is in, so there is no flag
to get wrong. By convention a real note opens "Real" and a fake one opens "Fake".

### Answering a card shows how the letters were taken

Once you have answered, the expansion lights up the letters that make the acronym:
SNOBOL is **StriNg** **O**riented sym**bo**lic **l**anguage, GESTAPO is **Ge**heime
**Sta**ats**po**lizei. That is most of the payoff of the round, and the game works it
out for itself — the same matcher the audit uses, searching for the cheapest honest
reading rather than assuming one letter per word.

Cheapest is not always truest, so five entries carry a `spell` field that overrides
it — the expansion with the acronym's own letters in brackets:

```js
{ w: "quasar", …, def: "quasi-stellar radio source",
  spell: "[qua]si-[s]tell[ar] radio source", … }
```

QUASAR really takes its AR from stell**ar**; left alone, the matcher preferred one
letter each from *radio* and *source*, which spells the same word by luck. The others
are SAMPLE, SCART, SPECTRE and TASER. The audit checks every override against its own
entry, so a typo in one cannot light the wrong letters.

### An invented expansion still has to spell the acronym

`tools/audit.js` checks every fake expansion against its own letters and refuses any
that does not produce them, because an expansion that does not spell the acronym is
not a wrong answer, it is a typo. Two real entries fail this check on purpose and are
listed rather than flagged: PELICAN, whose "pedestrian light controlled" was
retro-fitted to a bird's name and never quite lined up, and YUPPIE, which is "young
urban professional" plus a suffix nobody voted on.

### Screen the pairing before you write the expansion

This is the rule that costs the most time and saves the game, and each kind of fake
fails it differently.

For a **borrowed** fake the question is "is the meaning I am about to invent already
one of this acronym's meanings?" Almost every short letter string stands for several
things, so it often is. If it is, the entry is not a fake at all, and the player who
knows it is marked wrong for being right.

For a **coined** fake the question is the parent project's original one turned up a
notch: does the string already stand for something well known? Four in ten candidates
died here — inventing a plausible acronym mostly means reinventing somebody's. TEAL
survived a whole draft before the audit pointed out it was Tasman Empire Airways
Limited.

`tools/screen.js` prints everything the reference list already knows a candidate
stands for, and `tools/audit.js` re-runs both questions over the whole bank on every
build. Anything the list does not know still needs a web check, because it holds a few
thousand acronyms and not all of their meanings. Screening for the borrowed half threw
out about one pairing in six:

| pairing | intended expansion | why it went in the bin |
|---|---|---|
| MPEG | motion picture experts group | the reference list gives Motion Pictures (Coding) Experts Group — the same thing |
| FIDO | fog intensive dispersal operation | the RAF's own later reading was "Fog, Intensive Dispersal Of" |
| ALGOL | algebraic oriented language | Britannica lists it as an alternative name for the language |
| SABRE | Semi-Automatic Booking and Reservation Environment | the real one is given as both Business Research and Business Reservations Environment; too close to either |
| CINCPAC | Commander in Chief, Pacific Command | that *is* CINCPAC. The Fleet version is CINCPACFLT |
| STRATCOM | Strategic Communications Command | the US Army Strategic Communications Command was exactly that, 1964–73 |
| NICE | National Institute for Clinical Excellence | its own former name |
| CERN | Centre Européen pour la Recherche Nucléaire | a genuine historical variant of Conseil |
| PASCAL | primary algorithmic scientific commercial application language | an existing backronym, and the language is named after Blaise Pascal |
| TEMPEST | anything at all | the NSA's own backronym already spells it |
| SOS, WI-FI, SCRAM, POSH | anything at all | famous backronyms: the "invented" answer is the one everybody has already heard |

The last two rows are the trap worth naming. A **backronym** — an expansion invented
after the fact and repeated ever since — is the one kind of fake expansion that must
not go in, because half the players have already met it and will call it real, and
they are not wrong to. ISO, SIGSALY and TESCO are in the bank precisely because their
notes can say *this stands for nothing at all*, which is a better answer than a
backronym.

An acronym that means something *else* is fine, and in fact keeps the game fair: a
player who knows FOB is free on board will correctly reject "freight on board". What
is not fine is an invention that is already the answer.

### The expansions have to cheat at the same rate

Real acronyms cheat. RADAR skips the "and". MODEM takes three letters out of
"modulator". GESTAPO takes two out of each of *Geheime Staatspolizei*. AWOL fishes the
O out of the middle of "withOut". An invented bank where every letter is neatly the
first letter of its own word is a bank a player can spot without reading anything.

`tools/audit.js` measures how the letters are taken on each side — one letter per word,
small words skipped, two-or-more letters from a word, letters taken from inside a word
— and the two halves now agree within six points on every one of them.

### So does everything else you can see without thinking

The same rule as the parent project: **any surface feature a player can see without
engaging with the meaning has to appear at close to the same rate on both sides.** With
two kinds of fake in the bank the leaks come from opposite directions, and they turn
out to cancel each other rather neatly — a borrowed fake carries a real acronym's
shape, a coined one carries the shape you reach for when inventing, and the mix sits
where the real half sits:

- **Familiarity.** The leak that arrives with borrowed fakes. If they hang on obscure
  acronyms while the reals are household names, the acronym alone decides the round
  and the meaning is decoration. Measured against the reference list, and only over
  the borrowed ones, since a coined acronym is *supposed* to be absent: 50% of the
  real half is in the list against 49% of the borrowed fakes.
- **Word shape.** 52% of the real half spells an English word against 50% of the fake
  half. Borrowed fakes came in at 41% and coined ones — invented as birds, tools and
  knots — at 69%, which is exactly the habit the parent project found. Mixed, they
  land on the real half's rate.
- **Vowels.** Coined initialisms come out as consonant clusters (KFL, ZBN, QRB),
  because a made-up initialism has no word behind it to supply an A or an I; borrowed
  ones have vowels because real acronyms do. 16% real against 17% fake.
- **Capitalisation.** The one that leaked hardest in the borrowed half: inventing a
  meaning pulls you towards a tidy capitalised organisation — Agency, Council,
  Association, Command — while real expansions are as often three lowercase words.
  56% against the real half's 32% in the first draft, fixed by swapping a dozen
  organisation fakes for lowercase technical ones (CAT, PET, RICE, FAST, BRAT, FLOPS,
  CMOS, SAD, ADSL, PCR, SITREP) and then, with the coined half added, 35%.
- **Length.** Matched to within 0.1 letters per level, by giving the fake half the
  real half's exact length distribution at every level.
- **Read aloud as letters.** 29% real, 28% fake — or "it's spelled out, so it's real"
  becomes a strategy.
- **Endings.** `-le` was 0 real against 9 coined in an early draft, which is precisely
  the tell the parent project had with `-ling`. Three genuine `-le` acronyms went in —
  ORACLE, the ITV teletext service; SIMPLE, an IETF messaging standard; SAMPLE, the
  six questions an ambulance crew asks. No suffix is now more than 30 points off the
  base rate.
- **Expansion length and commas.** Real expansions are shorter than they look, because
  of the cheating above. Matched now within half a word at every level.
- **Field.** The field is printed on the card, so a field that is 90% real is a free
  answer. Space started at 78% fake and telecoms at 13%; both were fixed by moving
  satellite entries to the field they actually belong to rather than the one that
  sounded best.

Every one of these was introduced by habit rather than decision, and every one was
found by the audit rather than by thinking. Run it after each batch.

### Keep the fields balanced

No single subject should dominate. Military is the largest at 14% of the bank, then
computing at 12%, then medicine and government. When a field starts to feel
repetitive in play, trim it and widen the rest rather than adding more of the same.

## Built from a recipe

`RECIPE.md` is the brief this was built from — a self-contained guide to making a
real-or-fake guessing game in this shape, carried over from
[Fauxcabulary](https://github.com/bertrandgroulx-droid/fauxcabulary), which does the
same trick with obscure words. The mechanics here are Fauxcabulary's, debugged; what
is new is the content, the acronym-specific audits above, and the screening step.

## Ideas for later

- Widen the bank further — seventy per level is seven games, and it wants to be twenty.
- Daily challenge: the same ten for everyone, seeded by the date.
- A mode where the acronym is real but the expansion may not be.
- Streaks, and a stats screen behind the personal best.
