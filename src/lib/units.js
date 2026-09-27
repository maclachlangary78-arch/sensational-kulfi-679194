export const cToF = (c) => (c * 9) / 5 + 32;
export const fToC = (f) => ((f - 32) * 5) / 9;
export const mToFt = (m) => m * 3.28084;
export const ftToM = (ft) => ft / 3.28084;

export function formatTemp(celsius, units) {
  if (celsius == null) return '—';
  return units === 'metric' ? `${celsius.toFixed(1)}°C` : `${cToF(celsius).toFixed(1)}°F`;
}

export function formatDepth(meters, units) {
  if (meters == null) return '—';
  if (units === 'metric') return `${Math.round(meters)} m`;
  return `${Math.round(meters * 0.546807)} fth (${Math.round(mToFt(meters))} ft)`;
}
