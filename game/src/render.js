// Canvas rendering for The Midnight Post: the moonlit table, the cards, the
// title, win and loss screens. All art is drawn code, no image files.
import { districtById, drawDistrictMark } from './districts.js';
import { MIDNIGHT_TICKS, SEAL_COST, SHORTCUT_COST } from './courier.js';
import { RIVAL_NAME } from './opponent.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

export const W = 1280;
export const H = 720;

const NIGHT = '#14102e';
const TABLE = '#241b4d';
const GOLD = '#f2c14e';
const CREAM = '#fdf6e3';
const INK = '#241b4d';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMoon(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#f7e8b0';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8d189';
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.25, r * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.25, y + r * 0.2, r * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawStars(ctx, seed) {
  let s = seed;
  ctx.save();
  for (let i = 0; i < 70; i += 1) {
    s = (s * 16807) % 2147483647;
    const x = (s % 1280);
    s = (s * 16807) % 2147483647;
    const y = (s % 300);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

function drawCardFace(ctx, card, x, y, w, h, opts) {
  const d = districtById(card.district);
  const sel = opts && opts.selected;
  const dim = opts && opts.dim;
  ctx.save();
  if (dim) ctx.globalAlpha = 0.45;
  ctx.translate(x, y + (sel ? -16 : 0));
  roundRect(ctx, 0, 0, w, h, 12);
  ctx.fillStyle = '#fffdf4';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = sel ? GOLD : d.dark;
  ctx.stroke();
  ctx.fillStyle = d.color;
  ctx.fillRect(0, 0, w, 10);
  // Value, big and readable.
  ctx.fillStyle = INK;
  ctx.font = `bold ${Math.round(h * 0.34)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(card.value), w / 2, h * 0.42);
  // District shape mark, large, centre.
  drawDistrictMark(ctx, d, w / 2, h * 0.62, Math.round(h * 0.13));
  // District name, small.
  ctx.fillStyle = d.dark;
  ctx.font = `bold ${Math.round(h * 0.085)}px Georgia, serif`;
  ctx.fillText(d.short, w / 2, h * 0.86);
  // Stamp cost pips, top right.
  for (let i = 0; i < card.cost; i += 1) {
    ctx.fillStyle = GOLD;
    ctx.strokeStyle = '#8a5f00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w - 16 - i * 18, 24, 6, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
  if (card.cost === 0) {
    ctx.fillStyle = '#2e7d32';
    ctx.font = `bold ${Math.round(h * 0.08)}px Georgia, serif`;
    ctx.fillText('FREE', w - 20, 28);
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = '#3a2a6e';
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(242,193,78,0.55)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 8);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = `bold ${Math.round(h * 0.16)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('✉', x + w / 2, y + h * 0.56);
  ctx.restore();
}

function drawDeadline(ctx, deadline) {
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('MIDNIGHT', 40, 108);
  for (let i = 0; i < MIDNIGHT_TICKS; i += 1) {
    const x = 40 + i * 26;
    ctx.beginPath();
    ctx.arc(x + 9, 128, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < deadline ? '#ef6f9c' : 'rgba(253,246,227,0.25)';
    ctx.fill();
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = '#f2b134';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(`${MIDNIGHT_TICKS - deadline} tricks to midnight`, 40, 158);
  ctx.restore();
}

function drawScoreboard(ctx, state) {
  const p = state.purse;
  ctx.save();
  roundRect(ctx, 880, 24, 360, 92, 14);
  ctx.fillStyle = 'rgba(16,10,44,0.95)';
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`LETTERS  ${p.score}`, 904, 58);
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText(`Stamps ✉ ${p.stamps}    Hearts ${'♥'.repeat(Math.max(0, p.hearts))}${'♡'.repeat(Math.max(0, 3 - p.hearts))}`, 904, 88);
  ctx.fillStyle = '#c9b8ff';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Route ${state.route} of the night  •  Win at ${60} letters`, 904, 108);
  ctx.restore();
}

function drawRivalRow(ctx, state) {
  const hand = state.hand ? state.hand.rival : [];
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(RIVAL_NAME, 40, 52);
  ctx.fillStyle = '#c9b8ff';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Tricks ${state.hand ? state.hand.rivalTricks : 0}`, 40, 74);
  const w = 62; const h = 88; const gap = 10;
  const total = hand.length * (w + gap) - gap;
  let x = 640 - total / 2;
  for (let i = 0; i < hand.length; i += 1) {
    drawCardBack(ctx, x, 84, w, h);
    x += w + gap;
  }
  ctx.restore();
}

function drawPlayerHand(ctx, state, selected) {
  const hand = state.hand ? state.hand.player : [];
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('YOUR HAND — click a card or press 1–6', 40, 540);
  ctx.fillStyle = '#c9b8ff';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Tricks ${state.hand ? state.hand.playerTricks : 0}  •  Costed tools: [S] Express Seal +3 for ${SEAL_COST} stamps  •  [X] Shortcut swap for ${SHORTCUT_COST} stamp`, 40, 562);
  const w = 104; const h = 136;
  const gap = 14;
  const total = hand.length * (w + gap) - gap;
  let x = 640 - total / 2;
  for (let i = 0; i < hand.length; i += 1) {
    drawCardFace(ctx, hand[i], x, 572, w, h, { selected: selected === i });
    x += w + gap;
  }
  ctx.restore();
}

function drawTrickArea(ctx, state) {
  ctx.save();
  roundRect(ctx, 380, 210, 520, 215, 18);
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(242,193,78,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE TRICK — highest of the led district wins • ■ Market is trump', 640, 238);
  const t = state.trick;
  if (t && t.leadCard) {
    drawCardFace(ctx, t.leadCard, 470, 252, 104, 140, {});
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(t.leader === 'player' ? 'YOU lead' : 'ROOK leads', 522, 406);
    if (t.leadSeal) { ctx.fillStyle = GOLD; ctx.fillText('✦ SEALED +3', 522, 422); }
  } else {
    ctx.fillStyle = 'rgba(253,246,227,0.6)';
    ctx.font = '16px Georgia, serif';
    ctx.fillText('Play a card to start the trick', 522, 330);
  }
  if (t && t.followCard) {
    drawCardFace(ctx, t.followCard, 706, 252, 104, 140, {});
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(t.follower === 'player' ? 'YOU follow' : 'ROOK follows', 758, 406);
    if (t.followSeal) { ctx.fillStyle = GOLD; ctx.fillText('✦ SEALED +3', 758, 422); }
  }
  if (t && t.result) {
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(t.result, 640, 300);
  }
  ctx.restore();
}

function drawIntent(ctx, state) {
  ctx.save();
  roundRect(ctx, 920, 210, 320, 210, 18);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ROOK’S INTENT', 940, 240);
  ctx.fillStyle = CREAM;
  ctx.font = '15px Georgia, serif';
  const fav = districtById(state.favourite);
  const lines = [
    `Favours ${fav.name} ${fav.glyph}`,
    'Leads his highest card there.',
    'Follows the led district.',
    'Seals only when losing by a little.',
    '',
    'Read it — then counter it.',
  ];
  let y = 268;
  for (const line of lines) { ctx.fillText(line, 940, y); y += 24; }
  ctx.restore();
}

function drawContractPanel(ctx, state) {
  ctx.save();
  roundRect(ctx, 40, 210, 320, 210, 18);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('DELIVERY CONTRACT', 60, 240);
  ctx.fillStyle = CREAM;
  ctx.font = '15px Georgia, serif';
  if (state.contract) {
    const done = state.contract.check ? '' : '';
    ctx.fillText(state.contract.text, 60, 268, 280);
    ctx.fillText(`Bonus +${state.contract.bonus} letters`, 60, 296);
    ctx.fillStyle = '#c9b8ff';
    ctx.fillText(`Hand letters ${state.hand ? state.hand.handLetters : 0}`, 60, 324);
    ctx.fillText(`Hand tricks ${state.hand ? state.hand.playerTricks : 0} / ${state.hand ? state.hand.rivalTricks : 0}`, 60, 348);
  } else {
    ctx.fillText('No contract yet.', 60, 268);
  }
  ctx.fillStyle = '#c9b8ff';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Districts tonight:', 60, 372);
  ctx.fillText('◆ Lantern Row   ● Canal Steps', 60, 392);
  ctx.fillText('▲ Rooftop Lanes   ■ Moon Market', 60, 412);
  ctx.restore();
}

function drawLog(ctx, state) {
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  const lines = state.log.slice(-3);
  let y = 446;
  for (const line of lines) { ctx.fillText(line, 40, y); y += 22; }
  if (state.message) {
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 17px Georgia, serif';
    ctx.fillText(state.message, 40, 516);
  }
  ctx.restore();
}

function drawTable(ctx, state, selected) {
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx, state.seed || 7);
  drawMoon(ctx, 1195, 660, 36);
  ctx.fillStyle = TABLE;
  ctx.beginPath();
  ctx.ellipse(640, 400, 620, 300, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(242,193,78,0.4)';
  ctx.lineWidth = 3;
  ctx.stroke();
  drawScoreboard(ctx, state);
  drawDeadline(ctx, state.deadline);
  drawRivalRow(ctx, state);
  drawTrickArea(ctx, state);
  drawIntent(ctx, state);
  drawContractPanel(ctx, state);
  drawLog(ctx, state);
  drawPlayerHand(ctx, state, selected);
}

function drawTitle(ctx, state) {
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx, 7);
  drawMoon(ctx, 1120, 78, 46);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillText('THE MIDNIGHT POST', 640, 190);
  ctx.fillStyle = CREAM;
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('A trick-taking courier card game across a moonlit city', 640, 238);
  ctx.fillStyle = '#c9b8ff';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Trick-taking  •  Delivery contracts  •  Stamp costs  •  Express Seals', 640, 290);
  ctx.fillText('4 districts: ◆ Lantern Row  ● Canal Steps  ▲ Rooftop Lanes  ■ Moon Market', 640, 322);
  // Sample fan of cards.
  const sample = [
    { district: 'lantern', value: 9, cost: 2 },
    { district: 'canal', value: 7, cost: 2 },
    { district: 'rooftop', value: 5, cost: 1 },
    { district: 'market', value: 8, cost: 2 },
    { district: 'lantern', value: 3, cost: 0 },
  ];
  let x = 640 - (sample.length * 118 - 14) / 2;
  for (const c of sample) { drawCardFace(ctx, c, x, 370, 104, 148, {}); x += 118; }
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Click or press ENTER to start the night shift', 640, 580);
  ctx.fillStyle = CREAM;
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Deliver letters before midnight • Beat Rook the Rival Courier • Reach 60 letters', 640, 616);
  ctx.restore();
}

function drawEnd(ctx, state, won) {
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx, 7);
  drawMoon(ctx, 1120, 78, 46);
  ctx.save();
  ctx.textAlign = 'center';
  if (won) {
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 76px Georgia, serif';
    ctx.fillText('ALL LETTERS DELIVERED!', 640, 220);
    ctx.fillStyle = CREAM;
    ctx.font = '26px Georgia, serif';
    ctx.fillText('The city sleeps. Every door got its letter before dawn.', 640, 280);
    ctx.fillText(`Final score: ${state.purse.score} letters  •  Routes run: ${state.route}`, 640, 330);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText('★ ★ ★  COURIER OF THE NIGHT  ★ ★ ★', 640, 400);
  } else {
    ctx.fillStyle = '#ef6f9c';
    ctx.font = 'bold 76px Georgia, serif';
    ctx.fillText('THE POST IS LOST', 640, 220);
    ctx.fillStyle = CREAM;
    ctx.font = '26px Georgia, serif';
    ctx.fillText('Rook out-delivered you and the dawn came with letters undone.', 640, 280);
    ctx.fillText(`Final score: ${state.purse.score} letters  •  Routes run: ${state.route}`, 640, 330);
    ctx.fillStyle = '#c9b8ff';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText('Press ENTER to try the night shift again', 640, 400);
  }
  ctx.fillStyle = CREAM;
  ctx.font = '18px Georgia, serif';
  ctx.fillText('THE MIDNIGHT POST — trick-taking courier cards across 4 moonlit districts', 640, 480);
  ctx.restore();
}

function drawContract(ctx, state) {
  drawTable(ctx, state, -1);
  ctx.save();
  ctx.fillStyle = 'rgba(10,6,30,0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(`ROUTE ${state.route} — PICK A CONTRACT`, 640, 150);
  ctx.fillStyle = CREAM;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('One contract per route. Finish it for bonus letters.', 640, 190);
  const w = 340; const h = 150; const gap = 24;
  const total = 3 * (w + gap) - gap;
  let x = 640 - total / 2;
  state.contracts.forEach((c, i) => {
    roundRect(ctx, x, 240, w, h, 14);
    ctx.fillStyle = '#fffdf4';
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(`[${i + 1}]  +${c.bonus} letters`, x + w / 2, 280);
    ctx.font = '17px Georgia, serif';
    const words = c.text.split(' ');
    let line = '';
    let y = 312;
    for (const word of words) {
      if ((line + ' ' + word).trim().length > 26) { ctx.fillText(line.trim(), x + w / 2, y); y += 24; line = word; }
      else line += ' ' + word;
    }
    ctx.fillText(line.trim(), x + w / 2, y);
    x += w + gap;
  });
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Click a contract or press 1, 2 or 3', 640, 460);
  ctx.restore();
}

/** Draw the current screen of `state` onto `ctx`. */
export function render(ctx, state, selected) {
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'contract') drawContract(ctx, state);
  else if (state.screen === 'win') drawEnd(ctx, state, true);
  else if (state.screen === 'loss') drawEnd(ctx, state, false);
  else drawTable(ctx, state, selected);
}
