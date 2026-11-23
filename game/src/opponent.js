// Rook, the rival courier. His choices are readable on purpose: he announces
// a favoured district each round, always leads his highest card there, follows
// the led district when he can, and only spends his Express Seal when he is
// losing a trick by a little. Read the intent, then counter it.
import { DISTRICTS } from './districts.js';
import { legalPlays, cardStrength } from './trick.js';
import { SEAL_COST } from './courier.js';

export const RIVAL_NAME = 'Rook the Rival Courier';

export function pickFavourite(rng) {
  return DISTRICTS[Math.floor(rng() * DISTRICTS.length)].id;
}

export function rivalIntentText(favourite) {
  const d = DISTRICTS.find((x) => x.id === favourite);
  return `Rook favours ${d.name} tonight — he leads high ${d.glyph} cards.`;
}

/** Rook leads: highest card of his favourite district, else his highest card. */
export function rivalLead(hand, favourite) {
  const fav = hand.filter((c) => c.district === favourite);
  const pool = fav.length > 0 ? fav : hand;
  return pool.reduce((best, c) => (c.value > best.value ? c : best), pool[0]);
}

/** Rook follows: cheapest card that still wins, else his lowest legal card. */
export function rivalFollow(hand, leadCard) {
  const legal = legalPlays(hand, leadCard);
  const winning = legal.filter(
    (c) => cardStrength(c, leadCard.district, 0) > cardStrength(leadCard, leadCard.district, 0),
  );
  const pool = winning.length > 0 ? winning : legal;
  return pool.reduce((best, c) => (c.value < best.value ? c : best), pool[0]);
}

/** Rook seals only when a seal would flip a trick he is losing by 3 or less. */
export function rivalWantsSeal(leadCard, followCard, rivalStamps, isRivalLeading) {
  if (rivalStamps < SEAL_COST) return false;
  const mine = isRivalLeading
    ? cardStrength(leadCard, leadCard.district, 0)
    : cardStrength(followCard, leadCard.district, 0);
  const theirs = isRivalLeading
    ? cardStrength(followCard, leadCard.district, 0)
    : cardStrength(leadCard, leadCard.district, 0);
  return theirs > mine && theirs - mine <= 3;
}
