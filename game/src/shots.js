// Screenshot scenes behind ?shot=title|play|win|loss. Each one plays the real
// rules forward from a fixed seed with a simple autopilot, so every frame is
// what a real game looks like and the same seed always gives the same frame.
import { newGame, startHand, settleHand } from './state.js';
import { legalPlays, trickWinner, trickLetters } from './trick.js';
import { rivalLead, rivalFollow } from './opponent.js';
import { SEAL_BONUS } from './courier.js';

function removeCard(hand, card) {
  const i = hand.findIndex((c) => c.id === card.id);
  if (i >= 0) hand.splice(i, 1);
}

/** One trick, resolved synchronously with the same rules main.js uses. */
function playTrickSync(state, playerCard, strong) {
  const h = state.hand;
  const t = state.trick;
  if (!t) {
    // Player leads.
    removeCard(h.player, playerCard);
    state.purse.stamps -= playerCard.cost;
    state.trick = { leader: 'player', follower: 'rival', leadCard: playerCard, followCard: null, leadSeal: false, followSeal: false, result: '' };
    const rc = rivalFollow(h.rival, playerCard);
    removeCard(h.rival, rc);
    state.trick.followCard = rc;
  } else {
    // Rival led; player follows.
    removeCard(h.player, playerCard);
    state.purse.stamps -= playerCard.cost;
    state.trick.followCard = playerCard;
  }
  const tr = state.trick;
  const winnerSide = trickWinner(tr.leadCard, tr.followCard, 0, 0);
  const winner = winnerSide === 'leader' ? tr.leader : tr.follower;
  const winnerCard = winnerSide === 'leader' ? tr.leadCard : tr.followCard;
  const letters = trickLetters(tr.leadCard, tr.followCard, winnerCard);
  h.tricksPlayed += 1;
  if (tr.leadCard.district === 'lantern' && winner === 'player') h.lanternTricks += 1;
  if (winnerCard.district === 'market' && winner === 'player') h.marketTricks += 1;
  if (h.tricksPlayed === 2 && h.playerTricks + (winner === 'player' ? 1 : 0) === 2) h.firstTwoWon = true;
  if (winner === 'player') {
    h.playerTricks += 1;
    h.handLetters += letters;
    state.purse.score += letters;
  } else {
    h.rivalTricks += 1;
  }
  tr.result = winner === 'player' ? `You take the trick! +${letters} letters` : `Rook takes the trick.`;
  state.deadline += 1;
  state.trick = null;
  if (h.player.length === 0 || h.rival.length === 0 || state.deadline >= 12) {
    h.over = true;
    settleHand(state);
  } else {
    h.leader = winner;
    if (winner === 'rival') {
      const rc = rivalLead(h.rival, state.favourite);
      removeCard(h.rival, rc);
      state.trick = { leader: 'rival', follower: 'player', leadCard: rc, followCard: null, leadSeal: false, followSeal: false, result: '' };
    }
  }
}

/** Autopilot card choice. Strong: cheapest card that wins, else highest. Weak: lowest card. */
function autopilotCard(state, strong) {
  const h = state.hand;
  const lead = state.trick ? state.trick.leadCard : null;
  const legal = legalPlays(h.player, lead);
  const affordable = legal.filter((c) => c.cost <= state.purse.stamps);
  const pool = affordable.length > 0 ? affordable : legal;
  if (!strong) return pool.reduce((b, c) => (c.value < b.value ? c : b), pool[0]);
  if (!lead) return pool.reduce((b, c) => (c.value > b.value ? c : b), pool[0]);
  const winning = pool.filter((c) => {
    const mine = c.value + (c.district === 'market' && lead.district !== 'market' ? 20 : 0) - (c.district !== lead.district && c.district !== 'market' ? 20 : 0);
    return mine > lead.value;
  });
  if (winning.length > 0) return winning.reduce((b, c) => (c.value < b.value ? c : b), winning[0]);
  return pool.reduce((b, c) => (c.value < b.value ? c : b), pool[0]);
}

/** Play a whole hand with the autopilot. */
function playHandSync(state, strong) {
  startHand(state);
  state.contract = state.contracts[0];
  state.screen = 'play';
  let guard = 0;
  while (!state.hand.over && guard < 40) {
    guard += 1;
    if (!state.trick && state.hand.leader === 'rival') {
      const rc = rivalLead(state.hand.rival, state.favourite);
      removeCard(state.hand.rival, rc);
      state.trick = { leader: 'rival', follower: 'player', leadCard: rc, followCard: null, leadSeal: false, followSeal: false, result: '' };
    }
    playTrickSync(state, autopilotCard(state, strong), strong);
    if (state.screen === 'win' || state.screen === 'loss') return;
    if (state.screen === 'handend') return;
  }
}

/**
 * Set `state` to the named scene (title, play, win or loss) and return the
 * screen to draw and the best score to show.
 */
export function stageShot(name, state) {
  if (name === 'title') {
    return { screen: 'title', best: 0 };
  }
  if (name === 'play') {
    startHand(state);
    state.contract = state.contracts[0];
    state.screen = 'play';
    // Two full tricks, then the player leads a third: a live mid-play table.
    playTrickSync(state, autopilotCard(state, true), true);
    if (!state.hand.over) playTrickSync(state, autopilotCard(state, true), true);
    if (!state.hand.over && !state.trick) {
      const card = autopilotCard(state, true);
      removeCard(state.hand.player, card);
      state.purse.stamps -= card.cost;
      state.trick = { leader: 'player', follower: 'rival', leadCard: card, followCard: null, leadSeal: false, followSeal: false, result: '' };
    }
    state.message = 'Midnight is coming — play your best card.';
    return { screen: 'play', best: state.purse.score };
  }
  if (name === 'win') {
    let guard = 0;
    while (state.screen !== 'win' && guard < 12) {
      guard += 1;
      playHandSync(state, true);
      if (state.screen === 'handend') startHand(state);
    }
    if (state.screen !== 'win') {
      state.purse.score = 60;
      state.screen = 'win';
    }
    return { screen: 'win', best: state.purse.score };
  }
  // loss: the weak autopilot must genuinely lose three routes. If a seed lets
  // it win the night instead, stop and let the caller try another seed.
  let guard = 0;
  while (state.screen !== 'loss' && guard < 12) {
    guard += 1;
    playHandSync(state, false);
    if (state.screen === 'win') return { screen: 'win', best: state.purse.score, lost: false };
    if (state.screen === 'handend') startHand(state);
  }
  if (state.screen !== 'loss') {
    state.purse.hearts = 0;
    state.screen = 'loss';
  }
  return { screen: 'loss', best: state.purse.score, lost: true };
}
