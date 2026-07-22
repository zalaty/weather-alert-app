import Purchases, {
  CustomerInfo,
  CustomerInfoUpdateListener,
  PurchasesError,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

export const PREMIUM_ENTITLEMENT_ID = 'premium';

if (!REVENUECAT_API_KEY_ANDROID) {
  console.warn('RevenueCat: EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID no está definido, purchases deshabilitado');
}

// Se pone a true solo si Purchases.configure() tiene éxito: el módulo nativo no
// existe en Expo Go, así que ahí (y sin key) todas las funciones de abajo hacen no-op.
let configured = false;

export function initPurchases(): void {
  if (!REVENUECAT_API_KEY_ANDROID) return;
  try {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID });
    configured = true;
  } catch (e) {
    console.warn('RevenueCat: no se pudo inicializar el SDK nativo (¿Expo Go?)', e);
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.warn('RevenueCat: error obteniendo offerings', e);
    return null;
  }
}

export type PurchaseResult =
  | { status: 'success'; customerInfo: CustomerInfo }
  | { status: 'cancelled' }
  | { status: 'error'; error?: PurchasesError };

export async function buyPackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (!configured) return { status: 'error' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { status: 'success', customerInfo };
  } catch (e) {
    const error = e as PurchasesError;
    if (error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { status: 'cancelled' };
    }
    return { status: 'error', error };
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.warn('RevenueCat: error obteniendo customerInfo', e);
    return null;
  }
}

export function isPremiumActive(customerInfo: CustomerInfo | null): boolean {
  return !!customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID];
}

export type RestoreResult =
  | { status: 'success'; isPremium: boolean }
  | { status: 'error'; error?: PurchasesError };

export async function restorePurchases(): Promise<RestoreResult> {
  if (!configured) return { status: 'error' };
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { status: 'success', isPremium: isPremiumActive(customerInfo) };
  } catch (e) {
    console.warn('RevenueCat: error restaurando compras', e);
    return { status: 'error', error: e as PurchasesError };
  }
}

export function addCustomerInfoListener(listener: CustomerInfoUpdateListener): void {
  if (!configured) return;
  Purchases.addCustomerInfoUpdateListener(listener);
}

export function removeCustomerInfoListener(listener: CustomerInfoUpdateListener): void {
  if (!configured) return;
  Purchases.removeCustomerInfoUpdateListener(listener);
}
