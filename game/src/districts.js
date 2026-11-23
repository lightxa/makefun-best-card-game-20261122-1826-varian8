// Districts of the moonlit postal city. Every district is told apart by colour
// AND by shape, never by text alone: the shape is drawn on every card.
export const DISTRICTS = [
  { id: 'lantern', name: 'Lantern Row', short: 'LANTERN', color: '#f2b134', dark: '#8a5f00', shape: 'diamond', glyph: '◆' },
  { id: 'canal', name: 'Canal Steps', short: 'CANAL', color: '#2ec4b6', dark: '#0a5c55', shape: 'circle', glyph: '●' },
  { id: 'rooftop', name: 'Rooftop Lanes', short: 'ROOFTOP', color: '#9b7ede', dark: '#4a2d8f', shape: 'triangle', glyph: '▲' },
  { id: 'market', name: 'Moon Market', short: 'MARKET', color: '#ef6f9c', dark: '#7c2347', shape: 'square', glyph: '■' },
];

export function districtById(id) {
  return DISTRICTS.find((d) => d.id === id) || DISTRICTS[0];
}

/** Draw the district's shape mark centred at (x, y) with radius r. */
export function drawDistrictMark(ctx, district, x, y, r) {
  ctx.save();
  ctx.fillStyle = district.color;
  ctx.strokeStyle = district.dark;
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.beginPath();
  if (district.shape === 'diamond') {
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
  } else if (district.shape === 'circle') {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  } else if (district.shape === 'triangle') {
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.95, y + r * 0.75); ctx.lineTo(x - r * 0.95, y + r * 0.75);
  } else {
    const s = r * 0.85;
    ctx.rect(x - s, y - s, s * 2, s * 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
