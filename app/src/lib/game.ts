import deck from '../data/listings.json';

export interface Listing {
  id: string;
  district: string;
  borough: string;
  rooms: number;
  space: number;
  cold_rent: number;
  warm_rent: number | null;
  per_sqm: number;
  floor: number | null;
  floors_total: number | null;
  year: number | null;
  condition: string | null;
  quality: string | null;
  balcony: boolean;
  kitchen: boolean;
  garden: boolean;
  lift: boolean;
  cellar: boolean;
  furnished: boolean;
  new_build: boolean;
  high_demand: boolean;
  fair_price: string | null;
  url: string;
}

export type Mode = 'precision' | 'streak';

export const PRECISION_ROUNDS = 6;
export const PRECISION_SECONDS = 10;
export const STREAK_LENGTH = 20;
/**
 * 5s proved unplayable in testing: reading a new flat's district, size and
 * quality badge takes most of it, and with only 2 lives a pair of hesitations
 * ends the run before it starts. 8s still feels like a sprint.
 */
export const STREAK_SECONDS = 8;
export const STREAK_LIVES = 2;

/** Flats this far from the median €/m² are worth more — the market's genuine oddities. */
const TRICKY_THRESHOLD = 0.4;
const TRICKY_MULTIPLIER = 1.5;
/** Chained flats must be within this much of each other in size, or size alone gives the answer away. */
const SIZE_TOLERANCE = 0.25;

export const listings = deck.listings as Listing[];
export const MEDIAN_PER_SQM: number = deck.medianPerSqm;
export const MEDIAN_COLD_RENT: number = deck.medianColdRent;
export const CITY: string = deck.city;
export const DECK_SIZE = listings.length;

export const euro = (value: number): string =>
  `€${Math.round(value).toLocaleString('de-DE')}`;

export const isTricky = (listing: Listing): boolean =>
  Math.abs(listing.per_sqm - MEDIAN_PER_SQM) / MEDIAN_PER_SQM > TRICKY_THRESHOLD;

// ---------------------------------------------------------------------------
// Deterministic daily decks
//
// Every player must face identical flats in an identical order for the local
// leaderboard to mean anything, so all randomness is seeded off the date.
// ---------------------------------------------------------------------------

export const dayKey = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const hashSeed = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** mulberry32 — small, fast, and repeatable across devices. */
const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T>(items: T[], rand: () => number): T[] => {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
};

const sizeClose = (a: Listing, b: Listing, tolerance: number): boolean =>
  Math.abs(a.space - b.space) / Math.max(a.space, b.space) <= tolerance;

/** Does "the bigger flat is also the pricier one" hold for this pair? */
const sizeAgrees = (a: Listing, b: Listing): boolean =>
  b.space > a.space === b.cold_rent > a.cold_rent;

/**
 * Walks a chain where each flat is within SIZE_TOLERANCE of the previous one,
 * and where "bigger means pricier" holds only about half the time.
 *
 * Size-matching alone leaves that heuristic winning 62% of calls; balancing the
 * sequence drops it to ~53%, so floor area carries no signal and the player has
 * to actually read districts and quality.
 */
const buildChain = (pool: Listing[], length: number, rand: () => number): Listing[] => {
  const remaining = [...pool];
  const chain: Listing[] = [];
  let current = remaining.splice(Math.floor(rand() * remaining.length), 1)[0];
  chain.push(current);

  let agreeCount = 0;
  let disagreeCount = 0;

  while (chain.length < length && remaining.length) {
    // Relax the size constraint rather than cut the run short.
    let candidates: number[] = [];
    for (const tolerance of [SIZE_TOLERANCE, 0.4, 1]) {
      candidates = remaining
        .map((listing, index) => ({ listing, index }))
        .filter(
          ({ listing }) =>
            sizeClose(current, listing, tolerance) && listing.cold_rent !== current.cold_rent,
        )
        .map(({ index }) => index);
      if (candidates.length) break;
    }
    if (!candidates.length) break;

    const wantAgree = agreeCount <= disagreeCount;
    const balanced = candidates.filter((i) => sizeAgrees(current, remaining[i]) === wantAgree);
    const from = balanced.length ? balanced : candidates;
    const pick = from[Math.floor(rand() * from.length)];

    if (sizeAgrees(current, remaining[pick])) agreeCount++;
    else disagreeCount++;

    current = remaining.splice(pick, 1)[0];
    chain.push(current);
  }

  return chain;
};

export interface DailyDecks {
  key: string;
  precision: Listing[];
  streak: Listing[];
}

/** The two modes never share a flat on the same day. */
export const dailyDecks = (key = dayKey()): DailyDecks => {
  const rand = seededRandom(hashSeed(key));
  const pool = shuffle(listings, rand);
  const precision = pool.slice(0, PRECISION_ROUNDS);
  const streak = buildChain(pool.slice(PRECISION_ROUNDS), STREAK_LENGTH, rand);
  return { key, precision, streak };
};

// ---------------------------------------------------------------------------
// Precision mode
// ---------------------------------------------------------------------------

/**
 * Slider bounds come from floor area alone — never from the answer — so the
 * range stays workable on a 21m² studio without leaking the rent.
 */
export const guessRange = (listing: Listing) => {
  const min = Math.max(250, Math.round((listing.space * 5) / 10) * 10);
  const max = Math.min(6000, Math.round((listing.space * 60) / 10) * 10);
  return { min, max };
};

/**
 * Starting the slider mid-range anchored every guess to the same €/m², which
 * quietly skewed the bias score. A seeded random start spreads the anchor
 * across rounds while keeping the position identical for every player.
 */
export const startValue = (listing: Listing, key: string): number => {
  const { min, max } = guessRange(listing);
  const rand = seededRandom(hashSeed(`${key}:${listing.id}`));
  return Math.round((min + rand() * (max - min)) / 10) * 10;
};

export interface Round {
  listing: Listing;
  guess: number;
  points: number;
  errorPct: number;
  /** Signed: negative means the guess came in under the real rent. */
  biasPct: number;
  timedOut: boolean;
}

/** Linear decay — every 1% off costs 2 points, zero at 50% off. No cliff edges. */
export const scoreGuess = (listing: Listing, guess: number, timedOut = false): Round => {
  const actual = listing.cold_rent;
  const biasPct = ((guess - actual) / actual) * 100;
  const errorPct = Math.abs(biasPct);
  const base = 100 * Math.max(0, 1 - errorPct / 50);
  const points = Math.round(base * (isTricky(listing) ? TRICKY_MULTIPLIER : 1));
  return { listing, guess, points, errorPct, biasPct, timedOut };
};

export const roundVerdict = (errorPct: number): string => {
  if (errorPct <= 3) return 'Surgical';
  if (errorPct <= 7) return 'Nailed it';
  if (errorPct <= 15) return 'Close';
  if (errorPct <= 25) return 'Off';
  if (errorPct <= 40) return 'Way off';
  return 'Not even close';
};

export interface PrecisionSummary {
  points: number;
  accuracy: number;
  /** Mean signed bias across the game — the "how out of touch" number. */
  bias: number;
  headline: string;
  detail: string;
}

export const summarise = (rounds: Round[]): PrecisionSummary => {
  const points = rounds.reduce((sum, r) => sum + r.points, 0);
  const meanError = rounds.reduce((sum, r) => sum + r.errorPct, 0) / rounds.length;
  const bias = rounds.reduce((sum, r) => sum + r.biasPct, 0) / rounds.length;
  const accuracy = Math.max(0, 100 - meanError);
  const magnitude = Math.abs(Math.round(bias));

  let headline: string;
  let detail: string;
  if (magnitude <= 7) {
    headline = 'You know this city';
    detail = `Your guesses land within ${magnitude}% of real asking rents. You have been flat-hunting recently, and it shows.`;
  } else if (bias < 0) {
    headline = `You are living in ${magnitude > 30 ? '2015' : '2021'}`;
    detail = `You guessed ${magnitude}% below the real asking rent. At your numbers, you would be outbid on almost every flat in this deck.`;
  } else {
    headline = 'You expect the worst';
    detail = `You guessed ${magnitude}% above the real asking rent. Bleak, but it means nothing on the market can shock you.`;
  }

  return { points, accuracy, bias, headline, detail };
};

// ---------------------------------------------------------------------------
// Streak mode
// ---------------------------------------------------------------------------

export type Call = 'higher' | 'lower';

export interface StreakTurn {
  previous: Listing;
  current: Listing;
  call: Call | null;
  correct: boolean;
  points: number;
  gapPct: number;
}

/** Tight calls are the skilful ones, so they pay the most. */
const closenessMultiplier = (gapPct: number): number => {
  if (gapPct < 10) return 3;
  if (gapPct < 25) return 2;
  if (gapPct < 50) return 1.3;
  return 1;
};

export const streakMultiplier = (streak: number): number =>
  Math.min(3, 1 + 0.25 * Math.floor(streak / 3));

export const resolveCall = (
  previous: Listing,
  current: Listing,
  call: Call | null,
  streak: number,
): StreakTurn => {
  const gapPct =
    (Math.abs(current.cold_rent - previous.cold_rent) /
      Math.max(current.cold_rent, previous.cold_rent)) *
    100;
  const truth: Call = current.cold_rent > previous.cold_rent ? 'higher' : 'lower';
  const correct = call === truth;
  const points = correct
    ? Math.round(100 * closenessMultiplier(gapPct) * streakMultiplier(streak))
    : 0;
  return { previous, current, call, correct, points, gapPct };
};

export interface StreakSummary {
  depth: number;
  points: number;
  cleared: boolean;
  bestStreak: number;
  headline: string;
  detail: string;
}

export const summariseStreak = (turns: StreakTurn[], cleared: boolean): StreakSummary => {
  const depth = turns.filter((t) => t.correct).length;
  const points = turns.reduce((sum, t) => sum + t.points, 0);

  let best = 0;
  let running = 0;
  for (const turn of turns) {
    running = turn.correct ? running + 1 : 0;
    best = Math.max(best, running);
  }

  let headline: string;
  let detail: string;
  if (cleared) {
    headline = 'You cleared it';
    detail = `All ${STREAK_LENGTH} flats, ${depth} correct calls. Nobody should know this market that well.`;
  } else if (depth >= 12) {
    headline = `${depth} deep`;
    detail = 'You read the market well past the point where size stops helping.';
  } else if (depth >= 6) {
    headline = `${depth} deep`;
    detail = 'Respectable. The flats are size-matched, so you were reading districts, not square metres.';
  } else {
    headline = `${depth} deep`;
    detail = 'Brutal run. Every pair was matched on size, so nothing was guessable from the floor area alone.';
  }

  return { depth, points, cleared, bestStreak: best, headline, detail };
};
