import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { trackEvent } from '../services/analytics';

import de from './locales/de.json';
import en from './locales/en.json';
import es419 from './locales/es-419.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ptBR from './locales/pt-BR.json';

export const SUPPORTED_LANGUAGES = ['es', 'es-419', 'en', 'pt-BR', 'fr', 'de'] as const;
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
  'pt-BR': 'pt-BR',
  fr: 'fr-FR',
  de: 'de-DE',
};

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function resolveDeviceLanguage(): SupportedLanguage {
  const [locale] = getLocales();
  if (!locale) return DEFAULT_LANGUAGE;
  if (locale.languageCode === 'en') return 'en';
  if (locale.languageCode === 'pt') return 'pt-BR';
  if (locale.languageCode === 'fr') return 'fr';
  if (locale.languageCode === 'de') return 'de';
  if (locale.languageCode === 'es') {
    return locale.regionCode && LATAM_REGIONS.has(locale.regionCode) ? 'es-419' : 'es';
  }
  return DEFAULT_LANGUAGE;
}

export function getIntlLocale(language: string): string {
  return INTL_LOCALES[language as SupportedLanguage] ?? INTL_LOCALES[DEFAULT_LANGUAGE];
}

export type ApiLanguage = 'es' | 'en' | 'pt' | 'fr' | 'de';

// Los proveedores externos (Visual Crossing, Nominatim) no distinguen variantes
// regionales (es-419 → es, pt-BR → pt), así que cada SupportedLanguage se mapea
// explícitamente a su código de idioma base. Al ser un Record<SupportedLanguage, ...>
// (no una cadena de if/startsWith con fallback), TypeScript obliga a añadir esta
// entrada en cuanto se registre un idioma nuevo en SUPPORTED_LANGUAGES — no puede
// quedar ninguno cayendo en silencio al valor por defecto.
const API_LANGUAGES: Record<SupportedLanguage, ApiLanguage> = {
  es: 'es',
  'es-419': 'es',
  en: 'en',
  'pt-BR': 'pt',
  fr: 'fr',
  de: 'de',
};

export function toApiLanguage(language: string): ApiLanguage {
  return isSupportedLanguage(language) ? API_LANGUAGES[language] : API_LANGUAGES[DEFAULT_LANGUAGE];
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
          'pt-BR': { translation: ptBR },
          fr: { translation: fr },
          de: { translation: de },
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
  trackEvent('language_changed', { language });
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (e) {
    console.error('Error saving language preference:', e);
  }
}

export default i18n;
