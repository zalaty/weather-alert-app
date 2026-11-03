// Fuerza una versión mínima de OkHttp en el build de Android.
//
// Motivo: en oct-2026 se comprometieron 8 certificados intermedios de eMudhra. OkHttp 4.12.1
// los bloquea dentro del propio cliente, sin depender del trust store del dispositivo ni de
// Play Services. Sin este forzado, Gradle resuelve 4.12.0 (máximo entre react-native 4.9.2,
// expo-file-system 4.9.2 y coil-network-okhttp 4.12.0 vía react-native-screens).
//
// Afecta a todo el tráfico HTTP de la app (fetch de React Native → Visual Crossing, Nominatim,
// PostHog), no solo a PostHog. Revisar/eliminar cuando React Native ya traiga >= 4.12.1.
const { withAppBuildGradle } = require('expo/config-plugins');

const OKHTTP_VERSION = '4.12.1';
const MARKER = '// @avisa/withOkHttpVersion';

module.exports = function withOkHttpVersion(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withOkHttpVersion: se esperaba android/app/build.gradle en Groovy');
    }
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += `
${MARKER}
configurations.all {
    resolutionStrategy {
        force 'com.squareup.okhttp3:okhttp:${OKHTTP_VERSION}'
        force 'com.squareup.okhttp3:okhttp-urlconnection:${OKHTTP_VERSION}'
    }
}
`;
    }
    return cfg;
  });
};
