import Purchases from 'react-native-purchases';

const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

if (!REVENUECAT_API_KEY_ANDROID) {
  console.warn('RevenueCat: EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID no está definido, purchases deshabilitado');
}

export function initPurchases(): void {
  if (!REVENUECAT_API_KEY_ANDROID) return;
  Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID });
}
