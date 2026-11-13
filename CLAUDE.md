# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@docs/WeatherApp_Proyecto.md

## Commands

```bash
npm install --legacy-peer-deps   # plain `npm install` fails: the tree has orphaned peer conflicts
npx expo start                   # dev server (press i/a/w, or scan QR with Expo Go)
npm run android / ios / web      # expo start --android / --ios / --web
npx tsc --noEmit                 # typecheck (no linter is configured)
npm test                         # jest (jest-expo); unit tests live in __tests__/
```

There is no lint script — `tsc --noEmit` and `npm test` are the only automated verification
available. `.github/workflows/ci.yml` runs both on every pull request. When adding Expo-specific packages, use
`npx expo install <pkg>` (not plain npm) so the version matches the installed SDK.

After any `npx expo install` or other dependency change, run `rm -rf .expo` before the next
`npx expo start` — otherwise Metro can throw a false `Asset not found: assets/images/icon.png`
error from a stale `.expo` cache.

EAS build (Android, production) runs on push to `master` via
`.github/workflows/eas-build.yml`, using `npm install --legacy-peer-deps` and
`eas build --platform android --profile production`.

## Architecture

**Avisa** is an Expo Router weather app (SDK 54). Routing is file-based under `app/`:
`app/_layout.tsx` is the root layout (gates rendering on i18n init, see below), and
`app/(tabs)/` holds the four tab screens (`index` = home, `forecast`, `alerts`, `settings`) plus
`(tabs)/_layout.tsx` which defines the tab bar. `App.tsx` and `index.ts` at the repo root are
leftover Expo template files and are **not** part of the running app — the real entry point is
`expo-router/entry` (see `package.json` `"main"`).

**Data flow**: `hooks/useWeather.ts` is the single orchestration point for weather data. It decides
between GPS (`expo-location`) and a manually-searched city, applies a 30-minute cache
(`lastUpdated` in the store), calls `services/weatherApi.ts` to fetch from the Visual Crossing
Timeline API (key in `EXPO_PUBLIC_WEATHER_API_KEY`, `.env`) and reverse-geocodes via Nominatim,
then calls `replanAlerts()` (`services/alertScheduler.ts`).

**Alerts**: `services/alertEngine.ts` is pure (`planAlerts`, unit-tested): for each active alert it
finds the first hour in the next 24 h of forecast that crosses the threshold and plans a notice
`LEAD_MINUTES` (60) before it. `alertScheduler.ts` holds the side effects: cancel our scheduled
notifications → plan → dedupe per episode (`alertEpisodes` in AsyncStorage) → reschedule with stable
ids (`avisa-alert-*`) via `services/notifications.ts`, plus history and `alert_scheduled` analytics.
Alerts are tied to GPS: the scheduler only uses GPS data (this session's last GPS fetch, else the
persisted snapshot), never a searched/saved city. Thresholds are always stored in metric; all unit
conversion lives in `utils/alertUnits.ts`. Hour instants come from `datetimeEpoch` (`hour.epoch`);
data without it (old snapshots) is not plannable.

**State**: `store/weatherStore.ts` is a plain Zustand store with no persistence middleware.
`services/weatherPersistence.ts` selectively persists two things via `AsyncStorage`: the `units`
preference and a snapshot of the last **GPS** weather (never a manually searched city).
`app/_layout.tsx` awaits `hydrateWeatherStore()` alongside `initI18n()` before first render, so Home
paints the snapshot instantly; `isFromPersistedCache` then forces `useWeather` to refetch on launch
regardless of the 30-min cache (the user may have moved). A fresh launch still always starts from
GPS. Alert configuration (`services/alertsStorage.ts`), saved locations, alert history and the
language preference (`i18n/index.ts`) are persisted separately via direct `AsyncStorage` calls.

**Official warnings**: `fetchWeather` requests `include=...,alerts` (verified: no extra
`queryCost`). `parseWarnings()` in `services/weatherApi.ts` drops expired ones and infers a
yellow/orange/red level from keywords in the source-language text (Visual Crossing has no
normalized severity field). Shown free for everyone via `components/weather/OfficialWarningsCard.tsx`.

**Android build tweaks**: `plugins/withOkHttpVersion.js` (local config plugin) forces OkHttp
4.12.1 for the eMudhra CA revocation — without it Gradle resolves 4.12.0. There is no `android/`
folder (CNG), so native Gradle changes must go through config plugins, not hand edits.

**Theming**: `constants/theme.ts` exports `LightTheme`/`DarkTheme` objects plus `Typography`,
`Spacing`, `Radius` scales; `hooks/useTheme.ts` picks light/dark from `useColorScheme()`. Dark mode follows the system
(`userInterfaceStyle: "automatic"` + `expo-system-ui`, required on Android). Always take colors
from `theme` — the static `Colors` export is light-only and must not be used in UI (the tab bar
did, and stayed white in dark mode). Every
screen follows the same pattern: a `makeStyles(theme: Theme)` function returning
`StyleSheet.create(...)`, called at the top of the component body. `nativewind`/`tailwindcss` are
listed in `package.json` but are **not actually wired up** (no babel plugin, no config, no
`className` usage anywhere) — don't reach for Tailwind classes, use the `makeStyles` pattern.

**i18n**: `i18n/index.ts` initializes i18next (`react-i18next`, resources for `es`/`es-419`/`en`
loaded eagerly from `i18n/locales/*.json`). `resolveDeviceLanguage()` maps `expo-localization`'s
device locale to one of the three supported languages (LATAM region codes → `es-419`, else `es`
for Spanish, `en` for English, `es` as ultimate fallback). `app/_layout.tsx` calls `initI18n()` and
renders nothing until it resolves, so the correct language (persisted choice, else device
detection) is known before first paint. Changing language via Settings
(`setAppLanguage` in `i18n/index.ts`) persists to `AsyncStorage` and triggers a weather refetch,
because `services/weatherApi.ts` also passes the current language to the Visual Crossing (`lang=`)
and Nominatim (`accept-language=`) requests — those two only distinguish `es`/`en`
(`toApiLanguage()`), while the app's own UI strings/condition text distinguish all three locales.
When adding user-facing text, add a key to all three files in `i18n/locales/`, not just one.

## Notes

- The free tier only allows one active weather alert at a time (`app/(tabs)/alerts.tsx`,
  `isFreeTierFull`) — the rest of the UI (pricing banner, lock icons) assumes this constraint.
- Icon/screenshot generation (`generate_icons.py`, `generate_store_assets.py`,
  `resize_screenshots.py`) are one-off local scripts (Pillow), not part of the app build.
- `react-native-purchases` (RevenueCat) is a real native module and does not initialize in Expo
  Go, so premium features can't be tested there through a real purchase. `hooks/useIsPremium.ts`
  has a dev-only bypass: set `EXPO_PUBLIC_DEBUG_FORCE_PREMIUM=true` in your local `.env` (gitignored)
  to force `isPremium` to `true` without touching RevenueCat. It only takes effect when `__DEV__` is
  also true, so it's inert in any production/preview build regardless of this var, and it logs a
  `console.warn` every time it's active so it can't go unnoticed. **Never add
  `EXPO_PUBLIC_DEBUG_FORCE_PREMIUM` to EAS Environment Variables or reference it in any build
  profile** — it exists only as a local `.env` value for testing in Expo Go.
