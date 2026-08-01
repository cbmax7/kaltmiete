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
  year: number | null;
  balcony: boolean;
  kitchen: boolean;
  garden: boolean;
  url: string;
}

export interface Round {
  listing: Listing;
  guess: number;
  points: number;
  errorPct: number;
  /** Signed: negative means the guess came in under the real rent. */
  biasPct: number;
}

export const ROUNDS_PER_GAME = 6;
export const MEDIAN_PER_SQM: number = deck.medianPerSqm;
export const CITY: string = deck.city;
export const DECK_SIZE = (deck.listings as Listing[]).length;

export const listings = deck.listings as Listing[];

export const shuffledDeck = (): Listing[] => {
  const pool = [...listings];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, ROUNDS_PER_GAME);
};

/**
 * Slider bounds come from floor area alone — never from the answer — so the
 * range stays workable on a 21m² studio without leaking the rent.
 */
export const guessRange = (listing: Listing) => {
  const min = Math.max(250, Math.round((listing.space * 5) / 10) * 10);
  const max = Math.min(5000, Math.round((listing.space * 55) / 10) * 10);
  return { min, max, start: Math.round((min + max) / 2 / 10) * 10 };
};

const BANDS: ReadonlyArray<{ within: number; points: number; verdict: string }> = [
  { within: 0.03, points: 100, verdict: 'Surgical' },
  { within: 0.07, points: 85, verdict: 'Nailed it' },
  { within: 0.15, points: 60, verdict: 'Close' },
  { within: 0.25, points: 35, verdict: 'Off' },
  { within: 0.4, points: 15, verdict: 'Way off' },
];

export const scoreGuess = (listing: Listing, guess: number): Round => {
  const actual = listing.cold_rent;
  const biasPct = ((guess - actual) / actual) * 100;
  const errorPct = Math.abs(biasPct);
  const band = BANDS.find((b) => errorPct <= b.within * 100);
  return {
    listing,
    guess,
    points: band?.points ?? 0,
    errorPct,
    biasPct,
  };
};

export const roundVerdict = (errorPct: number): string => {
  const band = BANDS.find((b) => errorPct <= b.within * 100);
  return band?.verdict ?? 'Not even close';
};

export interface Summary {
  points: number;
  maxPoints: number;
  accuracy: number;
  /** Mean signed bias across the game — the "how out of touch" number. */
  bias: number;
  headline: string;
  detail: string;
}

export const summarise = (rounds: Round[]): Summary => {
  const points = rounds.reduce((sum, r) => sum + r.points, 0);
  const maxPoints = rounds.length * 100;
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

  return { points, maxPoints, accuracy, bias, headline, detail };
};

export const euro = (value: number): string =>
  `€${Math.round(value).toLocaleString('de-DE')}`;
