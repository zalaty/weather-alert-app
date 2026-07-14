# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@docs/WeatherApp_Proyecto.md

## Commands

```bash
npm install --legacy-peer-deps   # plain `npm install` fails: the tree has orphaned peer conflicts
npx expo start                   # dev server (press i/a/w, or scan QR with Expo Go)
npm run android / ios / web      # expo start --android / --ios / --web
npx tsc --noEmit                 # typecheck (no test suite or linter is configured)
```

There is no test runner, lint script, or CI check beyond the build below — `tsc --noEmit` is the
only automated verification available. When adding Expo-specific packages, use
`npx expo install <pkg>` (not plain npm) so the version matches the installed SDK.

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
then checks the active alert threshold and fires a local notification through
`services/notifications.ts` (`expo-notifications`) when it's crossed.

**State**: `store/weatherStore.ts` is a plain Zustand store, held in memory only (not persisted —
a fresh app launch always re-fetches via GPS unless `isManualLocation` was set this session).
Alert configuration (`activeAlert`, `thresholds`) and the language preference are the only bits
persisted, via direct `AsyncStorage` calls in `app/(tabs)/alerts.tsx` and `i18n/index.ts`
respectively — there's no persistence middleware wired into the store itself.

**Theming**: `constants/theme.ts` exports `LightTheme`/`DarkTheme` objects plus `Typography`,
`Spacing`, `Radius` scales; `hooks/useTheme.ts` picks light/dark from `useColorScheme()`. Every
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
