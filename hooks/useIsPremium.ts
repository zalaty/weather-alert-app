import { useCallback, useEffect, useState } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import {
  addCustomerInfoListener,
  getCustomerInfo,
  isPremiumActive,
  removeCustomerInfoListener,
} from '../services/purchases';

export function useIsPremium(): boolean {
  const [isPremium, setIsPremium] = useState(false);

  const applyCustomerInfo = useCallback((customerInfo: CustomerInfo | null) => {
    setIsPremium(isPremiumActive(customerInfo));
  }, []);

  useEffect(() => {
    getCustomerInfo().then(applyCustomerInfo);
    addCustomerInfoListener(applyCustomerInfo);
    return () => removeCustomerInfoListener(applyCustomerInfo);
  }, [applyCustomerInfo]);

  return isPremium;
}
