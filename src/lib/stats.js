import { POSITIONS } from './constants';

// Smoothed landed rate so a lure with 1/1 doesn't outrank one with 18/22.
const score = (landed, total) => (landed + 1) / (total + 2);
export const pct = (landed, total) => (total > 0 ? Math.round((landed / total) * 100) : 0);

export function lureStats(lures, strikes) {
  return lures
    .map((lure) => {
      const mine = strikes.filter((s) => String(s.lureId) === String(lure.id));
      const landed = mine.filter((s) => s.outcome === 'landed').length;
      const latestPhoto = mine.find((s) => s.photoKey)?.photoKey;
      return {
        ...lure,
        total: mine.length,
        landed,
        lost: mine.length - landed,
        rate: pct(landed, mine.length),
        photoKey: lure.photoKey || latestPhoto || null,
      };
    })
    .sort((a, b) => score(b.landed, b.total) - score(a.landed, a.total) || b.total - a.total);
}

export function hookStats(strikes) {
  const map = {};
  // Hooks are optional, so strikes logged without one don't count here.
  strikes.filter((s) => s.hookType).forEach((s) => {
    const key = `${s.hookType} (${s.hookSize})`;
    map[key] ??= { name: key, type: s.hookType, size: s.hookSize, landed: 0, lost: 0, total: 0 };
    map[key].total += 1;
    map[key][s.outcome === 'landed' ? 'landed' : 'lost'] += 1;
  });
  return Object.values(map)
    .map((h) => ({ ...h, rate: pct(h.landed, h.total) }))
    .sort((a, b) => score(b.landed, b.total) - score(a.landed, a.total));
}

// The size of this lure that has landed best in this position. With nothing logged there yet, use the
// lure's usual size, then whatever size has worked in other positions.
function bestSize(lure, position, strikes) {
  const sized = strikes.filter((s) => String(s.lureId) === String(lure.id) && s.lureSize);
  const here = sized.filter((s) => s.position === position);
  const pool = here.length ? here : lure.size ? [] : sized;
  const bySize = {};
  pool.forEach((s) => {
    bySize[s.lureSize] ??= { landed: 0, total: 0 };
    bySize[s.lureSize].total += 1;
    if (s.outcome === 'landed') bySize[s.lureSize].landed += 1;
  });
  const best = Object.entries(bySize).sort(([, a], [, b]) => score(b.landed, b.total) - score(a.landed, a.total))[0];
  return best?.[0] || lure.size || null;
}

// Builds a 5-lure spread from your own history. Strikes that happened in the same
// position, similar water temperature, and the same tide count for more.
export function buildSpread(lures, strikes, { tempC, tide }) {
  const candidates = POSITIONS.flatMap((position) =>
    lures.map((lure) => {
      let wLanded = 0;
      let wTotal = 0;
      let evidence = 0;
      strikes
        .filter((s) => String(s.lureId) === String(lure.id))
        .forEach((s) => {
          let w = 1;
          if (s.position === position) w += 2;
          if (tempC != null && s.tempC != null && Math.abs(s.tempC - tempC) <= 1.5) w += 1;
          if (tide && s.tide === tide) w += 1;
          wTotal += w;
          if (s.outcome === 'landed') wLanded += w;
          if (s.position === position) evidence++;
        });
      const base = score(wLanded, wTotal);
      // With little data, lean on where you normally run the lure.
      const preferred = lure.defaultPosition === position ? 0.15 : 0;
      return { position, lure, value: base + preferred, evidence, rate: Math.round(base * 100) };
    }),
  ).sort((a, b) => b.value - a.value);

  const usedLures = new Set();
  const filled = {};
  for (const c of candidates) {
    if (filled[c.position] || usedLures.has(c.lure.id)) continue;
    filled[c.position] = { ...c, size: bestSize(c.lure, c.position, strikes) };
    usedLures.add(c.lure.id);
  }
  return POSITIONS.map((position) => filled[position] || { position, lure: null });
}

export function tripReport(lures, strikes) {
  const landed = strikes.filter((s) => s.outcome === 'landed').length;
  const top = lureStats(lures, strikes).find((l) => l.total > 0);

  const byPos = {};
  strikes.forEach((s) => {
    byPos[s.position] = (byPos[s.position] || 0) + 1;
  });
  const hotPosition = Object.entries(byPos).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestHook = hookStats(strikes)[0];
  const temps = strikes.map((s) => s.tempC).filter((t) => t != null);
  const depths = strikes.map((s) => s.depthM).filter((d) => d != null);
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  return {
    total: strikes.length,
    landed,
    lost: strikes.length - landed,
    topLure: top?.name,
    hotPosition,
    bestHook: bestHook?.name,
    avgTempC: avg(temps),
    avgDepthM: avg(depths),
  };
}
