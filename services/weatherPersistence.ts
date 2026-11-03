import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWeatherStore } from '../store/weatherStore';
import { WeatherData } from './weatherApi';

// Persistencia selectiva del store (sin middleware de Zustand, mismo estilo que alertsStorage):
//  - preferencia de unidades
//  - último tiempo obtenido por GPS, para pintar Home al instante en el arranque en frío
//    mientras se refresca en segundo plano (y como respaldo si no hay conexión)
//
// Solo se guarda el snapshot de GPS, nunca una ciudad buscada a mano: un arranque nuevo sigue
// empezando siempre por la ubicación real del usuario, como antes.

const UNITS_KEY = 'units';
const SNAPSHOT_KEY = 'lastWeatherSnapshot';
const SNAPSHOT_VERSION = 1;
// Más allá de esto el dato no aporta nada útil ni siquiera como respaldo
const SNAPSHOT_MAX_AGE = 12 * 60 * 60 * 1000;

type Units = 'metric' | 'us';

interface WeatherSnapshot {
  v: number;
  units: Units;
  weatherData: WeatherData;
  location: { latitude: number; longitude: number; name?: string };
  lastUpdated: number;
}

let subscribed = false;

export async function hydrateWeatherStore(): Promise<void> {
  try {
    const [rawUnits, rawSnapshot] = await Promise.all([
      AsyncStorage.getItem(UNITS_KEY),
      AsyncStorage.getItem(SNAPSHOT_KEY),
    ]);
    const units: Units = rawUnits === 'us' ? 'us' : 'metric';
    const patch: Parameters<ReturnType<typeof useWeatherStore.getState>['hydrate']>[0] = { units };

    if (rawSnapshot) {
      const snap = JSON.parse(rawSnapshot) as WeatherSnapshot;
      const isUsable =
        snap.v === SNAPSHOT_VERSION &&
        snap.units === units &&
        Date.now() - snap.lastUpdated < SNAPSHOT_MAX_AGE;
      if (isUsable) {
        patch.weatherData = snap.weatherData;
        patch.location = snap.location;
        patch.lastUpdated = snap.lastUpdated;
      }
    }

    useWeatherStore.getState().hydrate(patch);
  } catch (e) {
    console.error('Error hydrating weather store:', e);
  }

  subscribeToChanges();
}

function subscribeToChanges() {
  if (subscribed) return;
  subscribed = true;

  useWeatherStore.subscribe((state, prev) => {
    if (state.units !== prev.units) {
      AsyncStorage.setItem(UNITS_KEY, state.units).catch(() => {});
    }

    const isFreshGpsData =
      state.weatherData !== prev.weatherData &&
      state.weatherData != null &&
      state.location != null &&
      state.lastUpdated != null &&
      !state.isManualLocation &&
      !state.isFromPersistedCache;

    if (isFreshGpsData) {
      const snapshot: WeatherSnapshot = {
        v: SNAPSHOT_VERSION,
        units: state.units,
        weatherData: state.weatherData!,
        location: state.location!,
        lastUpdated: state.lastUpdated!,
      };
      AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot)).catch(() => {});
    }
  });
}
