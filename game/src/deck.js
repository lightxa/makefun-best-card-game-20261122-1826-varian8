// The letter deck: 36 cards, 4 districts x values 1-9. A card's stamp cost is
// its postage tier: values 1-3 cost 0 stamps, 4-6 cost 1, 7-9 cost 2.
// Deterministic: every shuffle comes from a seeded generator, so the same
// seed always deals the same hands.
import { DISTRICTS } from './districts.js';

/** Small deterministic generator (mulberry32). */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stampCost(value) {
  if (value <= 3) return 0;
  if (value <= 6) return 1;
  return 2;
}

export function buildDeck() {
  const deck = [];
  for (const d of DISTRICTS) {
    for (let value = 1; value <= 9; value += 1) {
      deck.push({ id: `${d.id}-${value}`, district: d.id, value, cost: stampCost(value) });
    }
  }
  return deck;
}

export function shuffle(deck, rng) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

/** Deal `count` cards each to player and rival from a fresh seeded deck. */
export function dealHands(seed, count) {
  const rng = makeRng(seed);
  const deck = shuffle(buildDeck(), rng);
  return {
    player: deck.slice(0, count),
    rival: deck.slice(count, count * 2),
    rest: deck.slice(count * 2),
    rng,
  };
}

/** Sort a hand by district, then by value, for a tidy fan. */
export function sortHand(hand) {
  const order = { lantern: 0, canal: 1, rooftop: 2, market: 3 };
  return hand.slice().sort((a, b) => (order[a.district] - order[b.district]) || (a.value - b.value));
}
