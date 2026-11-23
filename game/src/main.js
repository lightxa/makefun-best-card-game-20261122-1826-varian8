// The Midnight Post — main loop, input and trick flow. Click cards or use
// keys 1-6 to play, S for an Express Seal (+3, 2 stamps), X for a Shortcut
// swap (1 stamp). Enter starts, restarts and confirms.
import { newGame, startHand, settleHand, handStats } from './state.js';
import { dealHands, sortHand } from './deck.js';
import { legalPlays, trickWinner, trickLetters, cardStrength } from './trick.js';
import { SEAL_COST, SEAL_BONUS, SHORTCUT_COST, MIDNIGHT_TICKS } from './courier.js';
import { rivalLead, rivalFollow, rivalWantsSeal, pickFavourite } from './opponent.js';
import { render, W, H } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7);

let state = newGame(seed);
let selected = -1;
let sealArmed = false;
let busy = false;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
  state.message = text;
}

function draw() {
  render(ctx, state, selected);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeFromHand(hand, card) {
  const i = hand.findIndex((c) => c.id === card.id);
  if (i >= 0) hand.splice(i, 1);
}

/** Play out one trick once both cards are on the table. */
async function resolveTrick() {
  busy = true;
  const t = state.trick;
  await sleep(650);
  const winnerSide = trickWinner(t.leadCard, t.followCard, t.leadSeal ? SEAL_BONUS : 0, t.followSeal ? SEAL_BONUS : 0);
  const winner = winnerSide === 'leader' ? t.leader : t.follower;
  const winnerCard = winnerSide === 'leader' ? t.leadCard : t.followCard;
  const letters = trickLetters(t.leadCard, t.followCard, winnerCard);
  const h = state.hand;
  h.tricksPlayed += 1;
  if (t.leadCard.district === 'lantern' && winner === 'player') h.lanternTricks += 1;
  if (winnerCard.district === 'market' && winner === 'player') h.marketTricks += 1;
  if (h.tricksPlayed <= 2 && winner === 'player' && h.playerTricks + 1 >= h.tricksPlayed) {
    if (h.tricksPlayed === 2) h.firstTwoWon = true;
  }
  if (winner === 'player') {
    h.playerTricks += 1;
    h.handLetters += letters;
    state.purse.score += letters;
  } else {
    h.rivalTricks += 1;
  }
  t.result = winner === 'player'
    ? `You take the trick! +${letters} letters`
    : `Rook takes the trick. +${letters} letters lost`;
  state.log.push(t.result);
  announce(t.result);
  draw();
  await sleep(900);
  state.deadline += 1;
  state.trick = null;
  if (h.player.length === 0 || h.rival.length === 0 || state.deadline >= MIDNIGHT_TICKS) {
    h.over = true;
    settleHand(state);
    if (state.screen === 'handend') {
      announce(`Route ${state.route - 1} done. Press Enter for the next route.`);
    }
  } else {
    h.leader = winner;
    if (winner === 'rival') await rivalTurn();
  }
  busy = false;
  draw();
}

/** Rook leads a trick (or follows, when the player led). */
async function rivalTurn() {
  const h = state.hand;
  if (!h || h.over) return;
  busy = true;
  await sleep(500);
  if (!state.trick) {
    const card = rivalLead(h.rival, state.favourite);
    removeFromHand(h.rival, card);
    state.trick = { leader: 'rival', follower: 'player', leadCard: card, followCard: null, leadSeal: false, followSeal: false, result: '' };
    announce(`Rook leads the ${card.value} of ${card.district}. Your turn — follow ${card.district} if you can.`);
  }
  busy = false;
  draw();
}

function playerPlay(index) {
  if (busy || !state.hand || state.hand.over) return;
  const h = state.hand;
  const legal = legalPlays(h.player, state.trick ? state.trick.leadCard : null);
  const card = h.player[index];
  if (!card) return;
  if (!legal.includes(card)) {
    announce(`You must follow ${state.trick.leadCard.district} while you hold it.`);
    draw();
    return;
  }
  if (state.purse.stamps < card.cost) {
    announce(`That card needs ${card.cost} stamps — you have ${state.purse.stamps}. Play a cheaper card.`);
    draw();
    return;
  }
  state.purse.stamps -= card.cost;
  removeFromHand(h.player, card);
  const seal = sealArmed && state.purse.stamps >= SEAL_COST;
  if (seal) state.purse.stamps -= SEAL_COST;
  sealArmed = false;
  if (!state.trick) {
    state.trick = { leader: 'player', follower: 'rival', leadCard: card, followCard: null, leadSeal: seal, followSeal: false, result: '' };
    announce(seal ? `You lead the ${card.value} — sealed +3!` : `You lead the ${card.value} of ${card.district}.`);
    draw();
    void rivalFollowTurn();
  } else {
    state.trick.followCard = card;
    state.trick.followSeal = seal;
    announce(seal ? `You follow with the ${card.value} — sealed +3!` : `You follow with the ${card.value}.`);
    draw();
    void resolveTrick();
  }
}

async function rivalFollowTurn() {
  busy = true;
  await sleep(600);
  const h = state.hand;
  const t = state.trick;
  if (!t || t.followCard) { busy = false; return; }
  const card = rivalFollow(h.rival, t.leadCard);
  removeFromHand(h.rival, card);
  t.followCard = card;
  t.followSeal = false;
  announce(`Rook follows with the ${card.value} of ${card.district}.`);
  busy = false;
  draw();
  await resolveTrick();
}

function useShortcut() {
  if (busy || !state.hand || state.hand.over) return;
  if (selected < 0 || !state.hand.player[selected]) { announce('Pick a card first, then press X to swap it.'); draw(); return; }
  if (state.purse.stamps < SHORTCUT_COST) { announce('A Shortcut costs 1 stamp — you have none.'); draw(); return; }
  const h = state.hand;
  const old = h.player[selected];
  const fresh = h.rest.shift();
  if (!fresh) { announce('No fresh letters left in the satchel.'); draw(); return; }
  state.purse.stamps -= SHORTCUT_COST;
  h.player[selected] = fresh;
  h.player = sortHand(h.player);
  h.rest.push(old);
  announce(`Shortcut! Swapped the ${old.value} for a fresh card (1 stamp).`);
  selected = -1;
  draw();
}

function pickContract(index) {
  const c = state.contracts[index];
  if (!c) return;
  state.contract = c;
  state.screen = 'play';
  state.favourite = pickFavourite(state.rng);
  announce(`Contract: ${c.text}. Rook favours ${state.favourite} tonight.`);
  state.log.push(`Contract chosen: ${c.text}`);
  if (state.hand.leader === 'rival') void rivalTurn();
  draw();
}

function onKey(event) {
  const key = event.key.toLowerCase();
  if (state.screen === 'title' && (key === 'enter' || key === ' ')) {
    startHand(state);
    draw();
    return;
  }
  if ((state.screen === 'win' || state.screen === 'loss') && key === 'enter') {
    state = newGame(seed + 1);
    startHand(state);
    draw();
    return;
  }
  if (state.screen === 'handend' && key === 'enter') {
    startHand(state);
    draw();
    return;
  }
  if (state.screen === 'contract' && ['1', '2', '3'].includes(key)) {
    pickContract(Number(key) - 1);
    return;
  }
  if (state.screen !== 'play') return;
  if (key >= '1' && key <= '6') {
    const i = Number(key) - 1;
    if (selected === i) playerPlay(i);
    else { selected = i; draw(); }
    return;
  }
  if (key === 'enter' && selected >= 0) { playerPlay(selected); return; }
  if (key === 's') {
    if (state.purse.stamps < SEAL_COST) { announce('An Express Seal costs 2 stamps — you have too few.'); draw(); return; }
    sealArmed = !sealArmed;
    announce(sealArmed ? 'Express Seal armed: your next card plays +3 (2 stamps).' : 'Express Seal put away.');
    draw();
    return;
  }
  if (key === 'x') { useShortcut(); return; }
  if (key === 'escape') { selected = -1; sealArmed = false; draw(); }
}

function cardAt(mx, my) {
  if (state.screen !== 'play' || !state.hand) return -1;
  const rect = canvas.getBoundingClientRect();
  const x = (mx - rect.left) * (W / rect.width);
  const y = (my - rect.top) * (H / rect.height);
  const hand = state.hand.player;
  const w = 104; const h = 136; const gap = 14;
  const total = hand.length * (w + gap) - gap;
  let cx = 640 - total / 2;
  for (let i = 0; i < hand.length; i += 1) {
    if (x >= cx && x <= cx + w && y >= 572 && y <= 572 + h) return i;
    cx += w + gap;
  }
  return -1;
}

function onClick(event) {
  if (state.screen === 'title') { startHand(state); draw(); return; }
  if (state.screen === 'win' || state.screen === 'loss') { state = newGame(seed + 1); startHand(state); draw(); return; }
  if (state.screen === 'handend') { startHand(state); draw(); return; }
  if (state.screen === 'contract') {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (W / rect.width);
    const y = (event.clientY - rect.top) * (H / rect.height);
    const w = 340; const gap = 24;
    const total = 3 * (w + gap) - gap;
    let cx = 640 - total / 2;
    for (let i = 0; i < 3; i += 1) {
      if (x >= cx && x <= cx + w && y >= 240 && y <= 390) { pickContract(i); return; }
      cx += w + gap;
    }
    return;
  }
  if (state.screen === 'play') {
    const i = cardAt(event.clientX, event.clientY);
    if (i >= 0) {
      if (selected === i) playerPlay(i);
      else { selected = i; draw(); }
    }
  }
}

window.addEventListener('keydown', onKey);
canvas.addEventListener('click', onClick);
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Screenshot staging: ?shot=title|play|win|loss plays the real rules forward
// from a fixed seed so each frame is what a real game looks like.
if (shot) {
  const staged = stageShot(shot, state);
  state.screen = staged.screen;
  state.best = staged.best;
  draw();
} else {
  draw();
}
