// Game state: screens, hands, tricks, scores and the midnight clock.
// Screens: 'title' | 'contract' | 'play' | 'trick' | 'win' | 'loss' | 'handend'
import { dealHands, sortHand, makeRng } from './deck.js';
import { offerContracts, newPurse, HAND_SIZE, WIN_SCORE } from './courier.js';
import { pickFavourite } from './opponent.js';

export function newGame(seed) {
  const rng = makeRng(seed);
  const purse = newPurse();
  return {
    seed,
    rng,
    screen: 'title',
    purse,
    route: 1,
    deadline: 0,
    hand: null,
    contract: null,
    contracts: [],
    favourite: pickFavourite(rng),
    trick: null,
    log: ['The Midnight Post — night shift begins.'],
    message: '',
    best: 0,
  };
}

/** Start a fresh hand (route) with a new deal and three contracts to choose from. */
export function startHand(state) {
  const dealt = dealHands(state.seed + state.route * 101, HAND_SIZE);
  state.hand = {
    player: sortHand(dealt.player),
    rival: sortHand(dealt.rival),
    rest: dealt.rest,
    playerTricks: 0,
    rivalTricks: 0,
    handLetters: 0,
    lanternTricks: 0,
    marketTricks: 0,
    tricksPlayed: 0,
    firstTwoWon: false,
    leader: state.route % 2 === 1 ? 'player' : 'rival',
    over: false,
  };
  state.contracts = offerContracts(state.rng);
  state.contract = null;
  state.deadline = 0;
  state.trick = null;
  state.screen = 'contract';
  state.message = `Route ${state.route} — choose a delivery contract.`;
}

export function handStats(state) {
  const h = state.hand;
  return {
    handLetters: h.handLetters,
    handTricks: h.playerTricks,
    lanternTricks: h.lanternTricks,
    marketTricks: h.marketTricks,
    firstTwoWon: h.firstTwoWon,
    stamps: state.purse.stamps,
  };
}

/** Settle a finished hand: contract bonus, hearts, win/loss, next route. */
export function settleHand(state) {
  const h = state.hand;
  const stats = handStats(state);
  let bonus = 0;
  if (state.contract && state.contract.check(stats)) {
    bonus = state.contract.bonus;
    state.purse.score += bonus;
    state.log.push(`Contract done! +${bonus} letters.`);
  } else if (state.contract) {
    state.log.push('Contract missed — no bonus.');
  }
  if (h.playerTricks > h.rivalTricks) {
    state.log.push(`Route ${state.route} won ${h.playerTricks}–${h.rivalTricks}.`);
  } else if (h.playerTricks < h.rivalTricks) {
    state.purse.hearts -= 1;
    state.log.push(`Route ${state.route} lost ${h.playerTricks}–${h.rivalTricks}. A heart is gone.`);
  } else {
    state.log.push(`Route ${state.route} drawn ${h.playerTricks}–${h.rivalTricks}.`);
  }
  state.purse.stamps = Math.min(12, state.purse.stamps + 4);
  if (state.purse.score >= WIN_SCORE) { state.screen = 'win'; return; }
  if (state.purse.hearts <= 0) { state.screen = 'loss'; return; }
  state.route += 1;
  state.screen = 'handend';
}
