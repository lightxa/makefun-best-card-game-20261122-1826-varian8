// The courier's economy: delivery contracts, the stamp purse, the costed
// tools, and the midnight deadline track. Every decision spends something.
import { DISTRICTS } from './districts.js';

export const HAND_SIZE = 6;
export const MIDNIGHT_TICKS = 12;
export const SEAL_COST = 2; // Express Seal: +3 strength this trick
export const SEAL_BONUS = 3;
export const SHORTCUT_COST = 1; // Shortcut: swap one hand card for a fresh one
export const WIN_SCORE = 60;
export const START_STAMPS = 12;
export const START_HEARTS = 3;

/** Three contracts offered at the start of a hand; the player picks one. */
export function offerContracts(rng) {
  const pool = [
    { id: 'letters', text: 'Deliver 30+ letters this round', bonus: 8, check: (s) => s.handLetters >= 30 },
    { id: 'tricks', text: 'Win 4 tricks this round', bonus: 8, check: (s) => s.handTricks >= 4 },
    { id: 'lantern', text: 'Win 2 tricks led in Lantern Row', bonus: 10, check: (s) => s.lanternTricks >= 2 },
    { id: 'market', text: 'Win a trick with a Moon Market card', bonus: 10, check: (s) => s.marketTricks >= 1 },
    { id: 'swift', text: 'Win the first 2 tricks of the round', bonus: 12, check: (s) => s.firstTwoWon },
    { id: 'thrifty', text: 'Finish the round with 6+ stamps left', bonus: 10, check: (s) => s.stamps >= 6 },
  ];
  const picked = [];
  const copy = pool.slice();
  while (picked.length < 3 && copy.length > 0) {
    picked.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return picked;
}

export function newPurse() {
  return { stamps: START_STAMPS, hearts: START_HEARTS, score: 0, route: 1 };
}

/** Advance the deadline clock by one tick; true when midnight strikes. */
export function tickDeadline(state) {
  state.deadline += 1;
  return state.deadline >= MIDNIGHT_TICKS;
}

export function districtLabel(id) {
  const d = DISTRICTS.find((x) => x.id === id);
  return d ? d.name : id;
}
