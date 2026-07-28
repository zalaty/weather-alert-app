import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

const SAVED_LOCATIONS_KEY = 'savedLocations';

export function makeSavedLocationId(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

export async function loadSavedLocations(): Promise<SavedLocation[]> {
  const saved = await AsyncStorage.getItem(SAVED_LOCATIONS_KEY);
  return saved ? JSON.parse(saved) : [];
}

export async function saveSavedLocations(locations: SavedLocation[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
}
