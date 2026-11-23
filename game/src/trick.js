// Trick-taking rules for one delivery round. A trick is won by the highest card
// of the district that led it; Moon Market is the night trump and beats any
// other district. The winner banks the letters (points) of both cards.
import { districtById } from './districts.js';

export const TRUMP_ID = 'market';

/** Effective strength of a card inside a trick led by `leadDistrict`. */
export function cardStrength(card, leadDistrict, sealBonus) {
  let strength = card.value + (sealBonus || 0);
  if (card.district === TRUMP_ID && leadDistrict !== TRUMP_ID) strength += 20;
  else if (card.district !== leadDistrict) strength -= 20;
  return strength;
}

/** Resolve a trick: returns 'player' or 'rival'. */
export function trickWinner(leadCard, followCard, leadSeal, followSeal) {
  const lead = cardStrength(leadCard, leadCard.district, leadSeal);
  const follow = cardStrength(followCard, leadCard.district, followSeal);
  return follow > lead ? 'follower' : 'leader';
}

/** Cards the follower may legally play: must follow the led district if able. */
export function legalPlays(hand, leadCard) {
  if (!leadCard) return hand.slice();
  const same = hand.filter((c) => c.district === leadCard.district);
  return same.length > 0 ? same : hand.slice();
}

/** Letters (points) a trick is worth: the two card values, doubled on a trump win. */
export function trickLetters(leadCard, followCard, winnerCard) {
  let letters = leadCard.value + followCard.value;
  if (winnerCard.district === TRUMP_ID) letters *= 2;
  return letters;
}

export function districtName(id) {
  return districtById(id).name;
}
