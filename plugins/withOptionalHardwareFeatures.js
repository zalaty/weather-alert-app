// Declara como OPCIONALES (required="false") hardware features que Android da por obligatorias.
//
// Motivo: Google Play bloqueó la promoción a producción de la 1.4.1 (28): "Required hardware
// feature declarations are restricting your app's availability — android.hardware.screen.portrait".
// El manifiesto no declara ningún <uses-feature>, pero Play/aapt deducen features implícitas, y
// todas obligatorias:
//  - screenOrientation="portrait" (de "orientation": "portrait" en app.json) → screen.portrait
//  - ACCESS_FINE/COARSE_LOCATION → location (y location.gps con targetSdk <= 20)
// Declararlas con required="false" las deja como "se usa si existe" sin cambiar el
// comportamiento: la app sigue fija en vertical, y sin GPS funciona buscando ciudades por nombre.
//
// NO se declara android.hardware.touchscreen (decisión 2026-11-18): sigue siendo obligatoria
// por defecto. Cualquier cambio de orientación o de permisos puede añadir features implícitas:
// revisar el manifiesto antes de publicar (ver CLAUDE.md).
const { withAndroidManifest } = require('expo/config-plugins');

const OPTIONAL_FEATURES = [
  'android.hardware.screen.portrait',
  'android.hardware.location',
  'android.hardware.location.gps',
];

module.exports = function withOptionalHardwareFeatures(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const features = (manifest['uses-feature'] = manifest['uses-feature'] ?? []);
    for (const name of OPTIONAL_FEATURES) {
      const existing = features.find((f) => f.$?.['android:name'] === name);
      if (existing) {
        existing.$['android:required'] = 'false';
      } else {
        features.push({ $: { 'android:name': name, 'android:required': 'false' } });
      }
    }
    return cfg;
  });
};
