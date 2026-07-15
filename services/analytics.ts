import PostHog from 'posthog-react-native';
import { JsonType } from '@posthog/core';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

if (!POSTHOG_API_KEY) {
  console.warn('PostHog: EXPO_PUBLIC_POSTHOG_API_KEY no está definido, analytics deshabilitado');
}

export const posthog = POSTHOG_API_KEY
  ? new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Los eventos de ciclo de vida y pantallas se trackean a mano (app_opened, screen_view)
      // para tener nombres y propiedades consistentes con el resto del taxonomy.
      captureAppLifecycleEvents: false,
    })
  : null;

export function trackEvent(event: string, properties?: Record<string, JsonType>): void {
  posthog?.capture(event, properties);
}
