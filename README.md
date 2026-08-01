# Kaltmiete

**How out of touch are you with what Berlin actually costs?**

A mobile game built on real, live rental listings. You see a genuine Berlin flat —
photo, district, size, rooms, features — and guess its monthly *Kaltmiete* before
the reveal. Six flats later you get a verdict on how far your instincts have
drifted from the actual market.

Built solo in 4 hours for the 8x Hackathon, Berlin.

---

## Why this exists

Everyone in Berlin has an opinion about rent. Almost nobody has a calibrated one.
Ask a room what a 21m² studio in Friedrichshain goes for and you'll hear €600.
It's €1,015 — €48 per square metre.

Kaltmiete turns that gap into a game. Not a listings app, not a price comparison
tool: a reality check you can finish in ninety seconds.

## How it works

1. **See a real flat** — scraped from ImmobilienScout24, not invented
2. **Commit to a number** — drag the slider, lock it in, no take-backs
3. **The reveal** — actual rent counts up, your bias is measured in percent
4. **The verdict** — six rounds produce a signed bias score

The scoring separates *accuracy* from *bias*: you can be wildly wrong in both
directions, but consistently guessing low means something specific — you're
pricing the city as it was, not as it is.

---

## Architecture

The interesting decision here is that **all the intelligence happens at build
time**. The shipped app makes zero network calls.

```
pipeline/build_listings.py
  ├── pulls the scraped dataset from Apify
  ├── normalises + filters to guessable listings
  ├── downloads one photo per listing
  └── emits  app/src/data/listings.json
             app/src/data/images.ts     (static require map for Metro)
                        │
                        ▼
app/  — reads the local deck, no API keys, no backend, no accounts
```

This buys four things that matter for a live demo:

| | |
|---|---|
| **Works offline** | Airplane mode is fine. Conference wifi is irrelevant. |
| **Zero latency** | No spinners, no dead air during the reveal animation. |
| **No secrets** | Nothing to leak in a public repo — there are no API keys in the app. |
| **€0 to run** | The only cost was ~$0.05 of Apify credit to scrape 60 listings. |

## Stack

- **Expo SDK 57** / React Native 0.86 / TypeScript (strict)
- `@react-native-community/slider` for the guess input
- React Native `Animated` for the reveal — no animation dependency
- **Python 3** stdlib only for the pipeline — no pip install required
- **Apify** (`azzouzana/immobilienscout-immoscout-scraper`) for the source data

## Running it

```bash
cd app
npm install
npx expo start
```

Scan the QR code with **Expo Go**. The deck is committed, so it runs immediately.

To rebuild the deck from a fresh scrape:

```bash
python3 pipeline/build_listings.py
```

---

## Data

30 Berlin rental listings, scraped from ImmobilienScout24 via Apify.
Median asking price in the deck: **€22.80/m²**.

Listing photos are included so the repo runs standalone. They remain the property
of their respective listing agents and are used here only as demo content for a
non-commercial hackathon project.
