import { Geolocation } from '@capacitor/geolocation';

// Reads the device GPS, then looks up live sea-surface temperature for that spot
// from the free Open-Meteo Marine API. Depth and tide stay manual — there is no
// reliable free global source for either.
export async function fetchTelemetry() {
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
  const latitude = Number(pos.coords.latitude.toFixed(4));
  const longitude = Number(pos.coords.longitude.toFixed(4));

  let tempC = null;
  try {
    const res = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=sea_surface_temperature`,
    );
    const data = await res.json();
    const sst = data?.current?.sea_surface_temperature;
    if (typeof sst === 'number') tempC = sst;
  } catch {
    // Offline or out of coverage — the user can type the temperature in.
  }

  return { latitude, longitude, tempC };
}
