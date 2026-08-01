# Kaltmiete

**How out of touch are you with what Berlin actually costs?**

Two daily games built on 300 real, scraped Berlin rental listings. Everyone gets
the same flats each day.

Built solo for the 8x Hackathon, Berlin.

---

## Why this exists

Everyone in Berlin has an opinion about rent. Almost nobody has a calibrated one.
Ask a room what a 21m² studio in Friedrichshain goes for and you'll hear €600.
It's €1,015 — €48 per square metre.

Kaltmiete turns that gap into a game.

## The two modes

### Precision · 6 flats · 10s each
See a real flat and guess its monthly Kaltmiete before the timer runs out. Scored
on a linear decay — every 1% off costs 2 points, zero at 50% off, no cliff edges.
Flats more than 40% from the median €/m² are flagged as **tricky** and pay 1.5×.

The payoff isn't the score, it's the **bias**: accuracy tells you how wrong you
were, bias tells you *which direction*. Guess low every round and you're not bad
at trivia — you're priced out.

### Streak · 20 flats · 5s each · 2 lives
Higher or lower than the previous flat? Points scale with how close the two rents
are, because tight calls are the skilful ones, and a streak multiplier builds
every three correct calls.

**The chain is deliberately curated.** Across all possible pairings the bigger
flat is also the pricier one 83% of the time, so a naive higher/lower game is
just "pick the larger number". Every consecutive pair is matched to within 25% in
size *and* the sequence is balanced so "bigger means pricier" holds only about
half the time. Measured over 30 simulated days that heuristic wins **52.6%** of
calls — statistically worthless. You have to read districts, quality and the
möbliert flag instead.

## Reading a flat

The card is built in four tiers, and **visual weight tracks price impact**:

1. **Spec line** — m², rooms, floor, year. The numbers you reason with.
2. **Quality badge** — interior quality and condition. The strongest single price signal.
3. **Distorters** — 🛋 möbliert, 🔥 hohe Nachfrage, Neubau. The only colour on the card.
4. **Comfort chips** — Balkon, Aufzug, Einbauküche, Keller, Garten. Muted.

Möbliert earns its own emoji because it's the biggest trap in the deck: furnished
flats in this dataset run **€26.7/m² against €21.4 unfurnished**, a 25% premium,
and the signal only exists in the listing copy — there's no data field for it.

## Daily decks, local scores

The deck is seeded from the date, so every player gets identical flats in an
identical order — including the slider's starting position. The two modes never
share a flat on the same day.

Only your **first run of the day** counts toward your best score and your streak;
after that you can replay as much as you like. Everything is stored on-device —
there is no server, no account and no leaderboard call.

---

## Architecture

All the intelligence happens at **build time**. The shipped app makes zero
network calls.

```
pipeline/build_listings.py
  ├── pulls the scraped dataset from Apify
  ├── normalises + filters to guessable listings
  ├── detects "möbliert" from title and description copy
  ├── downloads one photo per listing
  └── emits  app/src/data/listings.json
             app/src/data/images.ts     (static require map for Metro)
                        │
                        ▼
app/  — reads the local deck, no API keys, no backend, no accounts
```

| | |
|---|---|
| **Works offline** | Airplane mode is fine. Conference wifi is irrelevant. |
| **Zero latency** | No spinners, no dead air during a 5-second round. |
| **No secrets** | Nothing to leak in a public repo — there are no API keys in the app. |
| **~$1 to build** | The only cost was Apify credit to scrape 420 listings. |

## Stack

- **Expo SDK 57** / React Native 0.86 / TypeScript (strict)
- `@react-native-community/slider`, `@expo/vector-icons`, `@react-native-async-storage/async-storage`
- React Native `Animated` for the reveal — no animation dependency
- **Python 3** stdlib only for the pipeline — no pip install required
- **Apify** (`memo23/immobilienscout24-scraper`) for the source data

## Running it

```bash
cd app
npm install
npx expo start
```

Scan the QR with **Expo Go**, or press `w` to run it in a browser. The deck is
committed, so it runs immediately.

To rebuild the deck from a fresh scrape:

```bash
python3 pipeline/build_listings.py
```

---

## Data

300 Berlin rental listings scraped from ImmobilienScout24 via Apify, across all
12 boroughs. Median asking price **€23.40/m²**. 88% carry floor data, 66% carry
interior-quality data, 32% are furnished.

Listing photos are included so the repo runs standalone. They remain the property
of their respective listing agents and are used here only as demo content for a
non-commercial hackathon project.
