import { useCallback, useEffect, useState } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import {
  addCustomerInfoListener,
  getCustomerInfo,
  isPremiumActive,
  removeCustomerInfoListener,
} from '../services/purchases';

// Bypass de solo-desarrollo para probar features premium en Expo Go, donde el SDK
// nativo de RevenueCat no se inicializa. Requiere __DEV__ (false en cualquier build
// de producción/preview, no desactivable por accidente) Y la env var local
// EXPO_PUBLIC_DEBUG_FORCE_PREMIUM=true, que nunca debe subirse a EAS Environment
// Variables ni incluirse en un build real. Ver CLAUDE.md.
const DEBUG_FORCE_PREMIUM = __DEV__ && process.env.EXPO_PUBLIC_DEBUG_FORCE_PREMIUM === 'true';

if (DEBUG_FORCE_PREMIUM) {
  console.warn(
    '[DEBUG_FORCE_PREMIUM] isPremium forzado a true por EXPO_PUBLIC_DEBUG_FORCE_PREMIUM. ' +
    'No se está consultando RevenueCat. Esto NUNCA debe activarse fuera de desarrollo local.'
  );
}

export function useIsPremium(): boolean {
  const [isPremium, setIsPremium] = useState(DEBUG_FORCE_PREMIUM);

  const applyCustomerInfo = useCallback((customerInfo: CustomerInfo | null) => {
    setIsPremium(isPremiumActive(customerInfo));
  }, []);

  useEffect(() => {
    if (DEBUG_FORCE_PREMIUM) return;
    getCustomerInfo().then(applyCustomerInfo);
    addCustomerInfoListener(applyCustomerInfo);
    return () => removeCustomerInfoListener(applyCustomerInfo);
  }, [applyCustomerInfo]);

  return isPremium;
}
