import Constants from 'expo-constants';

export const ANDROID_PACKAGE = Constants.expoConfig?.android?.package ?? 'com.zalaty.weatheralertapp';

/** Publicada en GitHub Pages (privacy-policy.html en la raíz del repo) */
export const PRIVACY_POLICY_URL = 'https://zalaty.github.io/weather-alert-app/privacy-policy.html';

/** Mismo contacto que figura en privacy-policy.html */
export const SUPPORT_EMAIL = 'david.salfor@gmail.com';

export const PLAY_STORE_APP_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
export const PLAY_STORE_MARKET_URL = `market://details?id=${ANDROID_PACKAGE}`;
export const PLAY_SUBSCRIPTIONS_URL = `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`;
