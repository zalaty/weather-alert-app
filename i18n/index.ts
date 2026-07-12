import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es419 from './locales/es-419.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['es', 'es-419', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

const LANGUAGE_STORAGE_KEY = 'app_language';

// Países donde el español "neutro" (peninsular) se percibe distinto del habla
// latinoamericana habitual (p.ej. "clima" en vez de "el tiempo").
const LATAM_REGIONS = new Set([
  'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO',
  'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'US',
]);

const INTL_LOCALES: Record<SupportedLanguage, string> = {
  es: 'es-ES',
  'es-419': 'es-419',
  en: 'en-US',
};

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function resolveDeviceLanguage(): SupportedLanguage {
  const [locale] = getLocales();
  if (!locale) return DEFAULT_LANGUAGE;
  if (locale.languageCode === 'en') return 'en';
  if (locale.languageCode === 'es') {
    return locale.regionCode && LATAM_REGIONS.has(locale.regionCode) ? 'es-419' : 'es';
  }
  return DEFAULT_LANGUAGE;
}

export function getIntlLocale(language: string): string {
  return INTL_LOCALES[language as SupportedLanguage] ?? INTL_LOCALES[DEFAULT_LANGUAGE];
}

// Los proveedores externos (Visual Crossing, Nominatim) sólo distinguen es/en.
export function toApiLanguage(language: string): 'es' | 'en' {
  return language.startsWith('es') ? 'es' : 'en';
}

let initPromise: Promise<void> | null = null;

export function initI18n(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      let language: SupportedLanguage;
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        language = isSupportedLanguage(saved) ? saved : resolveDeviceLanguage();
      } catch {
        language = resolveDeviceLanguage();
      }

      await i18n.use(initReactI18next).init({
        resources: {
          es: { translation: es },
          'es-419': { translation: es419 },
          en: { translation: en },
        },
        lng: language,
        fallbackLng: DEFAULT_LANGUAGE,
        interpolation: { escapeValue: false },
      });
    })();
  }
  return initPromise;
}

export async function setAppLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (e) {
    console.error('Error saving language preference:', e);
  }
}

export default i18n;
