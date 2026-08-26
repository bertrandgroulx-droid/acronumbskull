# 🔤 Acronumbskull

**Ten acronyms. Some of them are fake.**

Acronumbskull shows you an acronym and what it supposedly stands for. You decide:
**REAL** or **MADE UP**. Ten a game, one point each, score out of 10.

How many of the ten are genuine is random — every card flips its own coin, so a round
might hold three real acronyms or eight, and counting won't help you. The rest were
invented for this game: the letters stand for nothing, no committee ever agreed them,
and nobody uses them. After each guess you get the truth, plus a note — where the real
one comes from, or which real acronym the invented one is standing next to.

Some of them are harder than they look. PELICAN and PUFFIN crossings are real
acronyms. So are POSSLQ, WOMBAT and ERNIE. Meanwhile TROUT, KESTREL and HOBNAIL are
not, however much they sound like something the Admiralty would have signed off in
1943.

## Features

- 10 acronyms per game with a random real/made-up split, freshly shuffled.
- Three difficulty levels — Easy, Tricky and Fiendish — each with its own real
  acronyms and its own inventions. Your choice is remembered.
- Instant reveal after each answer — **Correct** or **Wrong**, the card's status, and
  a note with the history, or with what those letters really stand for.
- Back and Forward buttons to step through the ones you have already answered.
- Score out of 10 with a rank and a copyable emoji result grid.
- A per-card recap where any row can be tapped open for the expansion, the note, the
  example sentence, the answer you gave, and a speaker to hear it again.
- Play again returns to the options, so difficulty and voice can be changed between
  games.
- Personal best saved per difficulty, and labelled with the level it was set at.
- A speaker button that reads the acronym aloud in a recorded British female voice —
  the same voice on every device, not the phone's robotic built-in one. Acronyms said
  as words are said as words; initialisms are spelled out.
- Four voices to choose from — Emma, Isabella, Alice and Lily. Tapping one plays an
  acronym in it, and the choice is remembered.
- Every real acronym comes with an example sentence, shown whether you got it right
  or not.
- Keyboard play: `←` real, `→` made up, `S` to hear it; once answered, the arrows move
  through your answers and `Enter` goes on.
- Light and dark themes, following whatever your phone is set to.
- No build step, no dependencies, no tracking.

The clips are rendered offline with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx)
(Apache-2.0) and shipped with the game, because device speech synthesis sounds
robotic on phones — iOS ships compact voices by default. If a clip will not play, the
browser's own synthesis takes over: the game asks for `en-GB` and works down a list of
the good British female voices that ship on common platforms, then any British voice
that is not obviously male, then any British voice at all. A device with no speech
support simply hides the button.

## Run it locally

It's a static site — serve the folder (the audio needs a server, so opening the file
directly will fall back to synthesis):

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

This repo ships `.github/workflows/pages.yml`, which publishes the site on every push
to `main`. One-time setup: **Settings → Pages → Build and deployment → Source →
GitHub Actions**. The workflow tries to enable Pages itself and cannot — an automated
token is not allowed to — so the first run fails until a human clicks it. The site
then lives at `https://<your-username>.github.io/acronumbskull/`.

## Tests and audits

```sh
node tests/run-all.js                # eight suites, driving the real game logic
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

## Regenerating the audio

```sh
pip install kokoro-onnx soundfile lameenc mutagen
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
python3 tools/make-audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin
```

Existing clips are left alone, so adding entries only renders the new ones.

## Adding acronyms

All the content is in `acronyms.js` — two arrays, `REAL_ACRONYMS` and
`FAKE_ACRONYMS`, 109 entries each. Each level holds between 68 and 76 of them, which
is about seven games before one comes round again. Each entry looks like this:

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

- `w` is the acronym, lowercase — it is displayed in capitals and it names the audio
  file, so it has to be plain letters.
- `say` is what the speech renderer is handed. SCUBA is a word and is read as one;
  PDF has to arrive as `"P D F"` or the model tries to pronounce it. A bare `A` is
  read as the article, so the letter A is written `A-`.
- `cat` is the field printed on the card.
- `def` is what it stands for.
- `ex` belongs on real entries only — it is what makes the example sentence appear,
  so an invented entry must not have one.
- `lvl` is the difficulty: 1 Easy, 2 Tricky, 3 Fiendish.

The game works out real vs. made-up from which array the entry is in, so there is no
flag to get wrong. By convention a real note opens "Real" and an invented one opens
"Fake".

### Screen the inventions before you write expansions for them

This is the rule that costs the most time and saves the game. With obscure words the
danger is that an invention turns out to be a real word. With acronyms it is worse:
almost every short letter string stands for *something*, so the question is not
whether the string exists but whether the meaning you are about to invent is already
taken.

`tools/screen.js` prints everything the reference list already knows a candidate
stands for. Anything it does not know still needs a web check, because the list holds
a few thousand acronyms and not all of them. Screening the candidate pool for this
bank rejected about four in ten — around eighty candidates went in the bin:

| candidate | intended | what it actually is |
|---|---|---|
| VSL | visual scripting language | exactly that, in game development |
| TVM | tissue volume mapping | exactly that, in MRI |
| CDT | cash deposit terminal | exactly that, sold by several banks |
| GASP | general aviation safety protocol | ICAO's Global Aviation Safety Plan |
| SPRAT | solar power radiant array test | NASA's Space Photovoltaic Research and Technology conference |
| PLOD | police logistics and operations desk | Police Link Officers for Deaf people |
| LUPIN | land use planning index | Land Use Planning Information Network |
| MEDCERT | medical certification register | a European medical-device notified body |
| STOAT | short tactical observation and target | Spatiotemporal Observation Annotation Tool |
| MARLIN | marine radio link and instrument node | a NATO radio networking standard, STANAG 4691 |
| BRISK | broadcast interval signal keeper | Fox Sports' Broadcast Remote IP Studio Kit |
| NSDB | national soil data bank | the Canadian National Soil Database |
| REDCAP | rail emergency duty and casualty assistance point | Research Electronic Data Capture |
| QMT | quiet muscle test | quantitative muscle testing |
| STRUT | structural test and utilisation table | a unit-test generation method |

Two of the birds went the other way and turned out to be genuine: PELICAN and PUFFIN
crossings really are acronyms, so they moved into `REAL_ACRONYMS`.

An acronym that means something *else* is fine, and in fact keeps the game fair — a
player who knows that PND means paroxysmal nocturnal dyspnoea will correctly reject
"patient node diagnosis". What is not fine is an invention whose expansion is already
that acronym's real meaning.

Cheap fakes are cheap for a reason. A generic technical noun phrase — "vehicle speed
profile", "data reference frame", "power quality rating" — is almost always already
somebody's acronym. The candidates that survived were the specific and slightly odd
ones: "hyperlink block index", "cable void notation", "harbour obstruction boom and
net anchorage installation log". Colourful beats plausible, and it screens better too.

### The expansions have to cheat at the same rate

Real acronyms cheat. RADAR skips the "and". MODEM takes three letters out of
"modulator". GESTAPO takes two out of each of *Geheime Staatspolizei*. AWOL fishes the
O out of the middle of "withOut". An invented bank where every letter is neatly the
first letter of its own word is a bank a player can spot without reading anything, and
that is exactly how the first draft of this one came out: 100% clean fits against the
real half's 49%.

`tools/audit.js` measures how the letters are taken on each side — one letter per word,
small words skipped, two-or-more letters from a word, letters taken from inside a word
— and the two halves now agree within nine points on every one of them.

### So does everything else you can see without thinking

The same rule as the parent project: **any surface feature a player can see without
engaging with the meaning has to appear at close to the same rate on both sides.** For
acronyms the ones that leaked were:

- **Length.** Household real acronyms are three letters; inventing pulls you towards
  five- and six-letter pronounceable strings. Fixed by matching the length
  distribution exactly within each level — level 1 is nineteen three-letter entries a
  side, level 3 is eleven seven-letter entries a side.
- **Word shape.** 73% of the inventions spelled an English word against 55% of the
  real ones, because inventing an acronym pulls you towards making it a word. Five
  word-shaped inventions were retired in favour of letter-shaped ones.
- **Vowels.** The invented three-letter entries came out as consonant clusters — KFL,
  ZBN, PZL — 28% of the bank against the real half's 9%, because a made-up initialism
  has no word behind it to supply an A or an I. Eight household real entries were
  swapped for equally household vowel-less ones (PDF for URL, LCD for CAD, HGV for
  GPS) until the two sides met.
- **Endings.** `-le` was 0 real against 9 invented, which is precisely the tell the
  parent project had with `-ling`. Three genuine `-le` acronyms went in — ORACLE, the
  ITV teletext service; SIMPLE, an IETF messaging standard; SAMPLE, the six questions
  an ambulance crew asks — and three ordinary entries came out. `-ac` had the opposite
  problem, 8 real against 1 invented, and three of the obscurer real ones (COSSAC,
  ILLIAC, CINCPAC) were retired with their length-matched partners.
- **"and".** The first draft used "and" in 68% of invented expansions against 23% of
  real ones — a 45-point tell in a single conjunction.
- **Capitalisation.** Real expansions carry proper nouns (National, United Nations,
  Queensland) 30% of the time. The inventions carried none at all.
- **Expansion length.** Real expansions are shorter than they look, because of the
  cheating above. Matched now within half a word at every level.
- **Field.** The field is printed on the card, so a field that is 90% real is a free
  answer. Marine started at 82% invented, government at 20% and media at 17%; all
  three are inside the tolerance now.

Every one of these was introduced by habit rather than decision, and every one was
found by the audit rather than by thinking. Run it after each batch.

### Keep the fields balanced

No single subject should dominate. Military and government are the largest at around
12% of the bank each, then computing and science. When a field starts to feel
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
