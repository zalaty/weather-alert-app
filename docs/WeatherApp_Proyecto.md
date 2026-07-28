# 🌤️ WeatherAlert — App de Tiempo Ultralocal con Alertas Inteligentes

> Documento de proyecto vivo. Se irá actualizando a medida que avancemos.  
> Última actualización: Julio 2026

---

## 🎯 Concepto

App de meteorología ultralocal para Android e iOS (React Native + Expo) que destaca por:
- Alertas de lluvia, viento, tormenta con 15-30 minutos de antelación
- Umbrales personalizables por el usuario ("avísame si llueve más de 5mm")
- Interfaz mínima, limpia y rápida (sin ruido)
- Modelo freemium con versión de pago clara y justa

---

## 📊 Validación de mercado

- Weather es la **2ª categoría con mayor crecimiento en Google Play** (abril 2025 – marzo 2026): +16% en descargas
- Uso diario garantizado → altísima retención natural
- Competidores actuales sobrecargados de funciones y anuncios → gap de UX clara

---

## 🔌 API de datos meteorológicos

### Elegida: Visual Crossing Weather API

| Criterio | Detalle |
|---|---|
| Precio free tier | ✅ Gratuito hasta 1.000 registros/día |
| Uso comercial | ✅ Permitido en el free tier |
| Sin tarjeta crédito para empezar | ✅ |
| Datos disponibles | Temperatura, precipitación, viento, humedad, UV, alertas severas |
| Cobertura | Global |
| Documentación | https://www.visualcrossing.com/weather-api/ |

**Estrategia de uso eficiente:**
- Cachear datos en el dispositivo (AsyncStorage) para minimizar llamadas
- Actualizar cada 30-60 minutos en background, no en cada apertura
- 1.000 llamadas/día = suficiente para miles de usuarios activos con caché bien implementado

**Plan de escalado:**
- Free tier → hasta llegar a volumen significativo
- Pay-as-you-go: $0,0001 por registro (muy barato)
- Plan mensual cuando haya ingresos de la versión premium

---

## 📱 Stack tecnológico

| Componente | Tecnología |
|---|---|
| Framework | React Native + Expo (SDK 52+) |
| Lenguaje | TypeScript |
| Navegación | Expo Router |
| Estado global | Zustand |
| Almacenamiento local | expo-secure-store + AsyncStorage |
| Notificaciones push | expo-notifications |
| Geolocalización | expo-location |
| UI | NativeWind (Tailwind para RN) + componentes propios |
| API tiempo | Visual Crossing Weather API |
| Backend (futuro) | Ninguno en MVP — 100% client-side |

---

## 💡 Features — MVP (Versión gratuita)

- [ ] Tiempo actual en ubicación del usuario (temperatura, lluvia, viento, sensación térmica)
- [ ] Previsión horaria (próximas 24h)
- [ ] Previsión diaria (7 días)
- [ ] **1 alerta personalizable** (ej: "avísame si va a llover")
- [ ] Widget de pantalla de inicio (básico)
- [ ] Soporte de unidades métricas/imperiales
- [ ] Modo oscuro automático

## 💎 Features — Versión Premium (2,99€/mes o 19,99€/año)

- [ ] **Alertas ilimitadas** con umbrales personalizados
  - Lluvia: "más de X mm en próxima hora"
  - Viento: "más de X km/h"
  - Temperatura: "por debajo de X grados"
  - Tormenta eléctrica: alerta inmediata
- [ ] Múltiples ubicaciones guardadas
- [ ] Widget avanzado con más datos
- [ ] Sin anuncios
- [ ] Previsión extendida (15 días)
- [ ] Datos de calidad del aire (AQI)
- [ ] Notificaciones de lluvia inminente (15 min antes)

---

## 🎨 Diseño y UX

### Filosofía de diseño
- **Menos es más**: solo la info que necesitas de un vistazo
- Carga en < 1 segundo (datos cacheados)
- Animaciones suaves, no intrusivas
- Tipografía grande y legible

### Paleta de colores (provisional)
- Fondo claro: `#F0F4FF` (azul muy suave)
- Fondo oscuro: `#0D1117`
- Acento: `#4A90E2` (azul cielo)
- Lluvia: `#5B8DB8`
- Sol: `#F5A623`
- Tormenta: `#6B48A3`

### Pantallas principales
1. **Home** — Tiempo actual + resumen del día
2. **Forecast** — Previsión horaria y semanal
3. **Alerts** — Gestión de alertas personalizadas (freemium)
4. **Settings** — Unidades, ubicaciones, preferencias

---

## 💰 Modelo de negocio

### Freemium
- App gratuita con 1 alerta → conversión natural cuando el usuario quiere más
- Sin agresividad: no popups molestos, solo un banner sutil en la pantalla de alertas

### Precio premium
- Mensual: **2,99€/mes**
- Anual: **19,99€/año** (equivale a 1,67€/mes — ahorro del 44%)
- Prueba gratuita: 7 días

### Proyección conservadora
| Usuarios activos | Conversión 3% | Ingreso mensual (2,99€) |
|---|---|---|
| 1.000 | 30 | ~90€ |
| 10.000 | 300 | ~900€ |
| 50.000 | 1.500 | ~4.500€ |

---

## 🗓️ Roadmap

### Fase 1 — MVP (4-5 semanas)
- Semana 1: Setup proyecto, integración API, pantalla home
- Semana 2: Previsión horaria y semanal, geolocalización
- Semana 3: Sistema de alertas + expo-notifications
- Semana 4: Widget básico, pulido de UI/UX
- Semana 5: Testing, ASO (App Store Optimization), subida a tiendas

### Fase 2 — Monetización (semana 5-6)
- Integración RevenueCat para gestión de suscripciones
- Paywall en pantalla de alertas
- Analytics básico (Mixpanel o PostHog)

### Fase 3 — Crecimiento (mes 2+)
- Múltiples ubicaciones
- Mejora de algoritmo de alertas
- Integración de calidad del aire
- Valoraciones y reviews (prompting inteligente)

---

## 📂 Estructura del proyecto (provisional)

```
weather-alert-app/
├── app/                    # Expo Router
│   ├── (tabs)/
│   │   ├── index.tsx       # Home
│   │   ├── forecast.tsx    # Previsión
│   │   ├── alerts.tsx      # Alertas
│   │   └── settings.tsx    # Ajustes
│   └── _layout.tsx
├── components/
│   ├── weather/
│   │   ├── CurrentWeather.tsx
│   │   ├── HourlyForecast.tsx
│   │   └── DailyForecast.tsx
│   └── ui/
├── services/
│   ├── weatherApi.ts       # Visual Crossing integration
│   ├── notifications.ts    # Expo notifications
│   └── location.ts         # Expo location
├── store/
│   └── weatherStore.ts     # Zustand state
├── hooks/
│   └── useWeather.ts
└── constants/
    └── theme.ts
```

---

## 🔗 Referencias y recursos

- Visual Crossing API docs: https://www.visualcrossing.com/weather-api/
- Expo Notifications: https://docs.expo.dev/push-notifications/overview/
- Expo Location: https://docs.expo.dev/versions/latest/sdk/location/
- RevenueCat (suscripciones): https://www.revenuecat.com/
- NativeWind: https://www.nativewind.dev/

---

## 📝 Notas y decisiones tomadas

- **2026-05-18**: Se elige Visual Crossing como API meteorológica por ser gratuita para uso comercial (hasta 1.000 req/día). Open-Meteo descartada para uso comercial al requerir auto-hosting.
- **2026-05-18**: Stack definido: Expo + TypeScript + Zustand + NativeWind + Visual Crossing + RevenueCat.
- **2026-05-18**: Modelo freemium con 1 alerta gratuita → conversión natural a premium.
- **2026-07-12**: App ya publicada en Google Play (v1.1.0) con Home, Forecast, Alerts, Settings, push notifications e icono completos. Se define roadmap de mejoras post-lanzamiento (ver sección siguiente). Implementación técnica pasa a hacerse en Claude Code (VS Code, conectado al repo real); este documento y el chat de Claude.ai se usan para planificación y decisiones de alto nivel.

---

## 🚀 Roadmap de mejoras post-lanzamiento

Orden de implementación acordado, pensado para minimizar retrabajo (features base antes que features que dependen de ellas):

### Fase 1 — Internacionalización (i18n) ✅ COMPLETADA (2026-07-12)
- Librería: `i18next` + `react-i18next` + `expo-localization`
- Idiomas implementados: `es` (neutro), `es-419` (Latinoamérica), `en`
- Infraestructura en `i18n/index.ts` + `i18n/locales/{es,es-419,en}.json`; detección de idioma por región del dispositivo, persistencia en AsyncStorage, gate de carga en `app/_layout.tsx` para evitar parpadeos
- Migración completa de strings en las 4 pantallas, `useWeather.ts` y `weatherApi.ts`; matices reales entre variantes (es-419 "clima" vs es "tiempo", "Pronóstico" vs "Previsión"), condiciones meteorológicas y direcciones de viento traducidas, fechas localizadas con `Intl`
- Selector de idioma en Ajustes (autónimos), persistente, dispara refetch del tiempo para que Visual Crossing + Nominatim devuelvan descripciones en el idioma correcto
- Verificado con `tsc --noEmit`, bundle de Metro y prueba manual en iPhone 12 vía Expo Go: los textos cambian correctamente al alternar idioma en Ajustes
- Confirmado (2026-07-12): los strings de notificaciones también están migrados. `services/notifications.ts` es un wrapper genérico sin texto propio; los títulos/cuerpos se generan en `hooks/useWeather.ts` (`checkAndNotify`, vía `i18n.t()` directo por estar fuera del árbol de React) y `app/(tabs)/alerts.tsx` (`triggerNotificationIfNeeded`, vía hook `useTranslation()`), ambos usando las claves `alerts.notifications.*`. Fase 1 cerrada sin cabos sueltos
- Limpieza aparte durante esta fase: `App.tsx` e `index.ts` en la raíz identificados como plantilla Expo no usada (entrada real vía `expo-router/entry`) y eliminados con `git rm` (verificado: nada los importaba salvo entre sí; `tsc --noEmit` y bundle de Metro limpios tras el borrado). Los paquetes `@radix-ui/*` vistos en `node_modules` **no son huérfanos**: son dependencia transitiva legítima de `expo-router` (vía `react-tabs`/`react-slot` para su soporte web); no están en `package.json` porque no son dependencia directa del proyecto, y el lockfile está consistente (verificado con `npm ls` y `npm install --dry-run`). No requieren ninguna acción

### Fase 2 — Analytics ✅ COMPLETADA (2026-07-15)
- Herramienta: **PostHog** (Cloud EU, `eu.i.posthog.com`), vía `posthog-react-native`
- `services/analytics.ts`: cliente singleton (mismo patrón que `weatherApi.ts`/`notifications.ts`), key/host desde `EXPO_PUBLIC_POSTHOG_API_KEY`/`EXPO_PUBLIC_POSTHOG_HOST`, fallback no-op silencioso si falta la key. `captureAppLifecycleEvents: false` porque `app_opened` se trackea a mano para mantener naming consistente
- Eventos implementados y verificados en Activity de PostHog: `app_opened`, `screen_view` (con propiedad `screen_name`, confirmada en las properties del evento — home/forecast/alerts/settings vía `ScreenViewTracker` + `usePathname()` de expo-router en `app/_layout.tsx`), `language_changed` (en `setAppLanguage`), `alert_created`
- Confirmado en Activity de PostHog: `alert_limit_reached` se dispara correctamente al tocar el icono 🔒. Pendiente de verificación pasiva únicamente `alert_triggered` (requiere que se cumpla una condición meteorológica real; código ya implementado y compilando)
- Bug lateral encontrado y arreglado durante las pruebas: pantalla de Ajustes no hacía scroll (contenedor raíz era `View` con `flex: 1` dentro de `SafeAreaView`, recortando el overflow). Solución: `View` → `ScrollView`, y `content` de `flex: 1` a `flexGrow: 1`. Verificado en iPhone 12 vía Expo Go
- Pendiente (no bloqueante): actualizar política de privacidad (GitHub Pages) para mencionar recogida de datos de uso vía PostHog
- Nota de infraestructura: `CLAUDE.md` actualizado con instrucción de ejecutar `rm -rf .expo` tras cualquier cambio de dependencias, por un error recurrente falso de "Asset not found: assets/images/icon.png" causado por caché de Metro/Expo obsoleta (no relacionado con configuración real, confirmado en dos ocasiones)
- **Pendiente antes del release a producción**: añadir ficha de Play Store en inglés (Store Presence → Main store listing → traducción `en`, sin coste de EAS build) y publicar analytics + ficha en inglés en el mismo release, para tener datos de comportamiento desde el día 1 de la expansión a mercados angloparlantes

### Fase 3 — RevenueCat + paywall 🔶 EN PROGRESO (iniciada 2026-07-16)
- Integrar suscripciones y paywall en pantalla de Alerts antes de construir features premium nuevas; así cada feature premium a partir de aquí nace ya con su gate integrado
- Precios mantenidos según lo definido originalmente: 2,99€/mes o 19,99€/año, prueba gratuita 7 días
- Ubicación decidida para el paywall: trigger principal en el icono 🔒 de la pantalla Alerts (ya trackeado con `alert_limit_reached` en PostHog), trigger secundario un banner sutil en Settings — ambos abriendo el mismo componente de paywall, sin pantalla "Premium" dedicada por ahora
- Cuenta de RevenueCat creada (sin tarjeta bancaria, solo con email); app de Android añadida en su dashboard con el package `com.zalaty.weatheralertapp`, Public API key (`goog_...`) obtenida y añadida como `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`
- **Perfil de pagos de Google Play**: creado con datos personales (no empresa formal); tema fiscal de autónomo pospuesto conscientemente hasta que haya ingresos reales — pendiente de consulta con gestoría en su momento. Cuenta bancaria (IBAN) añadida y verificada vía micro-depósito
- **Bloqueador encontrado**: Play Console no permite crear productos de suscripción (botón "Create subscription" ausente, solo aparece "Upload a new APK") hasta que detecta un build que declare el permiso de facturación (`com.android.vending.BILLING`) — es decir, hay que integrar el SDK antes de poder crear los productos, invirtiendo el orden original previsto
- Base técnica de RevenueCat instalada: `react-native-purchases` vía `npx expo install`, `services/purchases.ts` (patrón singleton igual que `analytics.ts`), `initPurchases()` llamado en `app/_layout.tsx` tras PostHog. Solo base técnica — sin UI de paywall ni lógica de compra real todavía. El permiso de billing se añade automáticamente vía manifest merge de Gradle, sin tocar `app.json`
- **Importante**: `react-native-purchases` es módulo nativo real, no se puede probar en Expo Go — requiere build de EAS y prueba en build real
- **Release 1.2.0 (versionCode 12)** agrupó: base de RevenueCat + fixes de Fase 1/2 pendientes (versión hardcodeada en Ajustes → ahora lee `Constants.expoConfig?.version` dinámicamente; splash migrado al plugin `expo-splash-screen`, ya que la propiedad `splash` de nivel superior está deprecada en Expo; bug de búsqueda de ciudades duplicada en Nominatim; bug de "usar mi ubicación" no actualizando) + ficha de Play Store en inglés (en-US, título "Avisa: Weather & Rain Alerts") — todo enviado a revisión de Google el 2026-07-17
- **Lección de infraestructura importante**: las variables `EXPO_PUBLIC_*` nuevas (PostHog, RevenueCat) solo estaban en `.env` local (no versionado), por lo que el primer build 1.2.0 se compiló sin ellas — EAS Build no tiene acceso al `.env` local, hace falta configurarlas como **EAS Environment Variables** del proyecto (dashboard de expo.dev → Environment variables, o `eas env:create`). Se migraron las 4 variables (incluida la de Visual Crossing, que estaba mal configurada como "Secret" en vez de "Plain text" — ver nota técnica abajo) a Plain text con entornos development/preview/production, y se generó un segundo build con ellas ya incluidas
- **Nota técnica sobre visibilidad de EAS env vars**: las variables `EXPO_PUBLIC_*` deben usar visibilidad **"Plain text"**, nunca "Secret" — las de tipo "Secret" no se pueden leer con `eas env:pull` ni usarse con EAS Update (OTA), y su valor no se puede volver a ver una vez guardado (hay que borrar y recrear para cambiar tipo). No aportan seguridad real a algo que de todas formas se incrusta en el bundle cliente
- **Verificado en producción (2026-07-18)**: tras la publicación de 1.2.0, confirmado en dispositivo real que la ubicación ("usar mi ubicación") ya actualiza correctamente, la versión dinámica en Ajustes muestra 1.2.0, el splash screen ya no se ve alargado/feo (pendiente solo pulido estético del diseño del icono, no bug técnico), y PostHog recibe eventos reales de producción
- **Productos de suscripción creados y activos en Play Console (2026-07-18)**: `avisa_premium_monthly` (plan base `monthly`, 2,99€) y `avisa_premium_annual` (plan base `yearly` tras un primer intento fallido con ID `annual` que quedó atascado en "Monthly" por error de selección — el billing period no es editable tras crear el plan, así que ese plan quedó desactivado permanentemente sin más consecuencia, y se creó `yearly` como reemplazo correcto). Ambos planes base tienen oferta `free-trial-7d` (7 días, elegibilidad "Never had any subscription" para evitar que un usuario abuse probando primero el mensual y luego el anual gratis), y ambos marcados como "Backwards compatible" (plan base + oferta, ambas filas necesitan activarlo por separado vía menú de tres puntos)
- **Nota sobre precios e IVA**: Google Play trata el precio introducido (2,99€/19,99€) como base y **añade el IVA de cada país tax-inclusive por encima** (España 21% → usuario ve ~3,59€, no 2,99€ exactos). Existe la opción de fijar un precio final idéntico en todos los países vía el diálogo "Set prices", pero implicaría absorber el IVA dentro del margen y gestionar manualmente 174 países — decisión consciente de no hacerlo por ahora dado el volumen actual (Opción A: aceptar la variación de precio por país, estándar en la industria)
- Pendiente tras esto: Bloque 3 (Google Cloud service account + conexión Play Developer API a RevenueCat), luego entitlements/offerings en RevenueCat, y finalmente sí la UI del paywall y lógica de compra en código
- **Bloque 3 completado (2026-07-19)**: proyecto de Google Cloud creado (`avisa-revenuecat`), Google Play Android Developer API habilitada, cuenta de servicio `revenuecat-integration@avisa-revenuecat.iam.gserviceaccount.com` creada con clave JSON descargada, invitada en Play Console (Users and permissions) con permisos de lectura financiera y gestión de suscripciones. JSON subido a RevenueCat
  - **Paso adicional no anticipado inicialmente**: RevenueCat requiere además un topic de **Google Cloud Pub/Sub** para recibir notificaciones en tiempo real de compras/renovaciones/cancelaciones. Se creó el topic `play-store-notifications` en Pub/Sub, configurado en dos frentes distintos: (1) permiso de **Publisher** en el topic para la cuenta de sistema `google-play-developer-notifications@system.gserviceaccount.com` (para que Play Store pueda publicar eventos), y (2) rol de **Pub/Sub Editor** a nivel de proyecto para la propia cuenta de servicio `revenuecat-integration@...` (para que RevenueCat pueda leer/consumir esos eventos) — son dos cuentas de servicio distintas con roles distintos, fácil de confundir. El nombre completo del topic (`projects/avisa-revenuecat/topics/play-store-notifications`) se configuró también en Play Console → Monetization setup → Real-time developer notifications
  - Con esto, los 3 permisos requeridos por RevenueCat quedan en verde: leer catálogo de productos, leer catálogo de suscripciones/planes base, y validar compras de Google Play
- Siguiente paso: definir entitlements/offerings en el dashboard de RevenueCat, y después sí construir la UI del paywall y lógica de compra en código
- **Entitlements y Offerings configurados en RevenueCat (2026-07-22)**: productos importados automáticamente desde Play Console vía "Import Products" (sin rellenar IDs a mano, evitando errores tipográficos). Entitlement `premium` creado con ambos productos (`avisa_premium_monthly:monthly` y `avisa_premium_annual:yearly`) adjuntos — así cualquier plan comprado da el mismo acceso premium en código, sin distinguir mensual/anual a nivel de lógica de negocio
  - Offering `default` (creado automáticamente por RevenueCat) con 3 packages estándar: `$rc_monthly` → `avisa_premium_monthly:monthly`, `$rc_annual` → `avisa_premium_annual:yearly`, `$rc_lifetime` → sin producto de Play Store asignado (solo vinculado a Test Store, no se ofrece plan de pago único por ahora; se deja la estructura lista por si se decide ofrecer en el futuro)
  - Nota: cada package puede tener un producto vinculado por tienda/plataforma simultáneamente (Test Store + Google Play) — los packages `$rc_monthly`/`$rc_annual` mantienen también su producto de Test Store original, útil para simular compras sin transacciones reales más adelante
- **Siguiente paso**: construir la UI del paywall (trigger en icono 🔒 de Alerts + banner en Settings, según lo decidido) y la lógica de compra real en código usando `react-native-purchases`, ya con Entitlements/Offerings listos para consultar desde la app
- **Paywall y lógica de compra implementados en código (2026-07-22)**:
  - `services/purchases.ts` ampliado con `getCurrentOffering()`, `buyPackage()` (maneja éxito/cancelación/error), `getCustomerInfo()`, `isPremiumActive()`, listener de customerInfo, y `restorePurchases()` (resultado discriminado éxito/error; "sin compra que restaurar" cuenta como éxito con `isPremium: false`, no como error)
  - `hooks/useIsPremium.ts`: hook reactivo que refleja el estado premium en tiempo real vía el listener del SDK
  - `components/Paywall.tsx`: modal reutilizable, pinta dinámicamente los packages del offering (precio/nombre desde el `product`, nada hardcodeado), calcula % de ahorro del anual vs mensual
  - Triggers conectados: icono 🔒 + banner "Alertas ilimitadas" en `alerts.tsx` (oculto si premium), banner premium + botón "Restaurar compras" en `settings.tsx` (oculto si premium)
  - **Desbloqueo real del límite de alertas**: corrección importante durante la implementación — el límite de 1 alerta no vivía en `weatherStore.ts` (Zustand) como se asumía inicialmente, sino como estado local persistido directamente en `alerts.tsx` vía AsyncStorage. Se creó `services/alertsStorage.ts` centralizando el tipo `AlertType` y la persistencia como array `activeAlerts[]` (antes singular `activeAlert`), con migración de fallback a la key antigua para no perder la alerta ya configurada de usuarios existentes. `useWeather.ts` (`checkAndNotify`) actualizado para iterar sobre todas las alertas activas, no solo la primera
  - Tracking en PostHog: `purchase_completed`/`purchase_cancelled`/`purchase_failed` (con package_id/product_id/price/currency o error_code) y `purchases_restored` (con `found_active: true/false`)
  - i18n: claves nuevas bajo `paywall.*` y `settings.premiumBanner.*` en los 3 idiomas
  - Verificado: `tsc --noEmit` limpio y bundle compila sin errores
- **Pendiente antes de dar la Fase 3 por cerrada**: probar el flujo completo (compra mensual, compra anual, cancelación, restauración con y sin compra previa) en un build real de EAS — no se puede probar en Expo Go. Cuenta de Google (`david.salfor@gmail.com`) ya configurada como **License Tester** en Play Console (Settings → License testing, License response: RESPOND_NORMALLY) para poder probar compras sin cargos reales — nota: License testing no soporta Play Integrity API/protección automática, tenerlo en cuenta si el build de producción tiene esa protección activada
- **Bug de configuración encontrado y resuelto (2026-07-24)**: la lista de License Testing tenía el checkbox de la lista de emails sin marcar (aunque el email ya estuviera añadido dentro de la lista) — causaba que Play Store mostrara el flujo de compra real (tarjeta real, sin banner de "compra de prueba") en vez del modo test. Al marcar el checkbox y guardar en Settings → License testing, apareció correctamente el banner "Tarjeta de prueba: siempre se aprueba"
- **✅ FASE 3 VERIFICADA COMPLETA en build de Internal Testing (2026-07-24)**: probado en dispositivo real con compra de prueba (sin cargo real, confirmado por Google Play)
  - Compra del plan mensual completada sin error, con banner de "suscripción de prueba" visible
  - Desbloqueo real confirmado: tras comprar, se pueden crear múltiples alertas (antes limitado a 1), y las notificaciones se disparan correctamente para todas las alertas activas simultáneamente
  - Evento `purchase_completed` verificado en PostHog con todas las propiedades esperadas: `package_id: $rc_monthly`, `product_id: avisa_premium_monthly:monthly`, `price: 2.99`, `currency: EUR`
  - Botón "Restaurar compras" verificado correctamente oculto mientras el usuario es premium, y visible tras cancelar la suscripción de prueba
  - Camino "nada que restaurar" verificado: tras expirar la suscripción de prueba, restaurar compras devuelve correctamente el mensaje de que no hay compra activa (sin marcarlo como error)
  - **Siguiente paso**: promocionar este build de Internal Testing a producción (o generar uno nuevo si se han acumulado más cambios), y decidir cómo abordar Fase 4 (múltiples ubicaciones)

### Fase 4 — Múltiples ubicaciones
- Feature core de mayor valor pendiente; toca Zustand store + Settings + Home
- Primer caso real para validar el paywall end-to-end

### Fase 5 — Alertas mejoradas
- Alerta de lluvia inminente (15 min antes)
- Alertas por franja horaria (ej. "solo entre 7h y 22h")
- Agrupación de notificaciones cuando hay varias alertas activas
- Historial de alertas disparadas
- Agrupadas porque tocan el mismo módulo (`notifications.ts` + pantalla Alerts)
- Nota técnica (detectada en Fase 1): hoy todas las notificaciones usan `trigger: null` (disparo inmediato); las alertas programadas/por franja horaria requerirán trabajar con triggers reales de `expo-notifications`

### Fase 6 — Datos premium adicionales
- Calidad del aire (AQI)
- Mapa de radar de lluvia (valorar RainViewer u otra API si Visual Crossing no lo cubre)
- Bloque técnico separado por requerir APIs adicionales

### Fase 7 — Widget de pantalla de inicio
- Se deja para más adelante por ser más laborioso en nativo Android/iOS
- Mejor decidir prioridad real una vez haya datos de analytics (Fase 2)

### Fase 8 — Crecimiento y retención
- Compartir previsión (ej. por WhatsApp)
- Prompt de valoración inteligente (pedir review tras una alerta útil, no al azar)
- Modo "qué me pongo hoy" (sugerencia simple de ropa/paraguas según el tiempo)
- Aviso de nueva versión disponible para usuarios sin auto-actualización en Android: chequeo de versión propio (JSON ligero alojado en GitHub Pages, igual que la política de privacidad, comparado contra `Constants.expoConfig?.version`) con banner sutil enlazando a Play Store. Descartada por ahora la vía nativa (Play Core In-App Updates / librerías como `sp-react-native-in-app-updates`) por requerir development build (no funciona en Expo Go); si se hace development build antes por otro motivo (ver nota de Fase 5 sobre push en Expo Go), valorar resolver ambas cosas juntas
- Mejoras de pulido, bajo esfuerzo y alto impacto, para el final cuando el core esté sólido

---

## 🌍 Ampliación de idiomas (más allá de Fase 1)

Trabajo en curso, en paralelo a las fases numeradas del roadmap — orden decidido: portugués (Brasil) → francés → alemán, priorizado por tamaño/relevancia de mercado para una app de tiempo.

- **Portugués de Brasil (pt-BR) ✅ AÑADIDO (2026-07-25)**: siguiendo exactamente el patrón de Fase 1. `i18n/locales/pt-BR.json` con vocabulario brasileño real (no traducción literal genérica: "Garoa" para Drizzle, "Céu limpo" para Clear, etc.), añadido a `SUPPORTED_LANGUAGES`/`INTL_LOCALES`/`resolveDeviceLanguage()`/`toApiLanguage()` en `i18n/index.ts`, selector en Settings ya soporta el 4º idioma sin cambios de layout (lista vertical dinámica). Direcciones de viento reutilizan el array de `es`/`es-419` (mismo set de abreviaturas verificado). Visual Crossing/Nominatim reciben `lang=pt` (genérico, sin distinguir BR/PT, igual que ya colapsaba es/es-419 a `es`). Verificado `tsc --noEmit`, bundle limpios, y confirmado en dispositivo real (iPhone 12, Expo Go)
- **Francés (fr) ✅ AÑADIDO (2026-07-25)**: mismo patrón. `i18n/locales/fr.json` con vocabulario real ("Bruine" no "Pluie fine", "Orage" no "Tonnerre", convenciones tipográficas francesas como espacio antes de `€`/`:`/`%`), construcción impersonal "M'avertir si..." en alertas para evitar ambigüedad tú/vous. Direcciones de viento reutilizan el array de es/pt-BR (mismo set de abreviaturas). **Bug real detectado y corregido durante la implementación**: `toApiLanguage()` no tenía caso explícito para `fr`, así que habría caído en el `default` (inglés) — la UI se habría visto en francés perfecto pero las descripciones del tiempo (Visual Crossing/Nominatim) habrían llegado en inglés por error silencioso. Corregido añadiendo el caso explícito. Verificado `tsc --noEmit`, bundle limpios, y confirmado en dispositivo real (iPhone 12, Expo Go)
- **Alemán (de) ✅ AÑADIDO (2026-07-25)**: mismo patrón. `i18n/locales/de.json` con vocabulario real (Nieselregen, Gewitter, Glatteis, terminología del DWD), construcción nominal en umbrales de alerta en vez de subordinada con "wenn" (el alemán exige verbo al final de la subordinada, rompía gramaticalmente al concatenar el valor del umbral)
  - **Bug funcional real detectado y corregido**: las direcciones de viento en alemán NO usan el mismo array que es/pt-BR/fr — en alemán O = Ost (Este) y W = West, al revés que en español/francés donde O = Oeste. Reutilizar el array de los otros idiomas habría invertido Este y Oeste en la UI para usuarios alemanes (dato meteorológico incorrecto, no solo un problema de traducción). Array corregido: `["N", "NO", "O", "SO", "S", "SW", "W", "NW"]`
  - **Mejora de arquitectura**: `toApiLanguage()` refactorizado de cadena de `if` a `Record<SupportedLanguage, ApiLanguage>` exhaustivo (`API_LANGUAGES`), mismo patrón que ya tenía `LANGUAGE_NAMES`. Ahora TypeScript exige mapear cada idioma nuevo en los 3 selectores (`INTL_LOCALES`, `LANGUAGE_NAMES`, `API_LANGUAGES`) — si se añade un idioma futuro sin mapearlo en alguno, falla `tsc --noEmit` en vez de caer en silencio a inglés (como pasó con francés antes de esta corrección)
  - Verificado `tsc --noEmit`, bundle limpios, y confirmado en dispositivo real (iPhone 12, Expo Go) — incluyendo direcciones de viento Este/Oeste correctas
- **Italiano (it) ✅ AÑADIDO (2026-07-26)**: mismo patrón. `i18n/locales/it.json` con vocabulario real (Pioviggine, Temporale —no "tuono", que es solo el sonido—, Sereno, Percepita). Direcciones de viento verificadas con cuidado: una primera fuente (rosa de los vientos histórica/náutica italiana) sugería L/P (Levante/Ponente) para Este/Oeste, distinto del patrón románico — pero se confirmó con fuente meteorológica moderna (meteoblue.it) que las apps de tiempo reales usan N/S/E/O estándar, igual que es/pt-BR/fr. Buen ejemplo de verificar en vez de asumir por similitud de idioma. Confirmado mapeo completo en los 3 `Record` exhaustivos — el propio `tsc --noEmit` limpio sirve de prueba de que ninguno quedó sin mapear. Verificado `tsc --noEmit` y bundle limpios
- **Polaco (pl) ✅ AÑADIDO (2026-07-26)**: mismo patrón. `i18n/locales/pl.json` con vocabulario real (Mżawka, Burza —no "Grzmot", que es solo el sonido—, Gołoledź, Bezchmurnie)
  - **Plurales verificados, no necesarios**: revisado explícitamente si el sistema de plurales complejo del polaco (`_one/_few/_many/_other`) hacía falta en i18next — no, porque ninguna interpolación numérica del proyecto va seguida de un sustantivo que decline (van seguidas de %, °C, km/h, que no cambian). Los dos únicos casos de número+sustantivo son texto estático fijo, resueltos a mano con la forma gramatical correcta: "1 aktywny alert" (singular) y "Co 30 minut" (genitivo plural, categoría "many" por terminar en 0)
  - **Direcciones de viento — tercer patrón distinto encontrado**: ni el patrón románico (E/O) ni el alemán (O/W invertido) — el polaco meteorológico usa la convención internacional prestada del inglés (E/W), distinta de sus propias abreviaturas nativas (wsch./zach.) que aparecían en una primera fuente no especializada. Verificado con fuente meteorológica real (infometeo.pl). Array: `["N", "NE", "E", "SE", "S", "SW", "W", "NW"]`
  - Confirmado mapeo completo en los 3 `Record` exhaustivos. Verificado `tsc --noEmit` y bundle limpios
- **Turco (tr) ✅ AÑADIDO (2026-07-26)**: mismo patrón. `i18n/locales/tr.json` con vocabulario real (Çiseleme, Gök gürültülü fırtına/Gök gürültülü sağanak yağış —términos MGM distintos para tormenta sola vs. con lluvia—, Buzlanma, Hortum como palabra turca real en vez de préstamo)
  - **Cuarta convención de viento distinta, verificada con fuente oficial**: ni románica (E/O), ni alemana (O/W invertida), ni el préstamo internacional del polaco (E/W) — el turco usa letras nativas propias, verificado contra el Meteoroloji Genel Müdürlüğü (servicio meteorológico estatal turco): `["K", "KD", "D", "GD", "G", "GB", "B", "KB"]` (Kuzey/Doğu/Güney/Batı = Norte/Este/Sur/Oeste)
  - **Codificación de caracteres especiales verificada en dos capas**: JSON crudo (script Python UTF-8) y superviviencia dentro del bundle de Metro, prestando atención al problema clásico turco de la I con/sin punto (İ/i vs I/ı) y la ortografía con apóstrofo ante sufijos en palabras extranjeras (`Premium'a`)
  - **Ajustes gramaticales estructurales**: turco es SOV (verbo al final), mismo problema que alemán con cláusulas condicionales — resuelto con formato nominal en vez de condicional. No requiere pluralización tras números (a diferencia del polaco). Símbolo `%` va antes del número (`%70`), aplicado donde el JSON controla el orden libremente
  - **Limitación preexistente identificada (no corregida, fuera de alcance)**: el símbolo `%` en `alerts.tsx` está hardcodeado como valor de código (`unit: '%'`), no traducible por locale — existe en las 9 locales por igual, candidata a tarea propia futura si se quiere pulir, pero de impacto menor (cosmético, no funcional)
  - Confirmado mapeo completo en los 3 `Record` exhaustivos. Verificado `tsc --noEmit` y bundle limpios
- **✅ BLOQUE DE IDIOMAS CERRADO (2026-07-26)**: 9 idiomas en total (es, es-419, en, pt-BR, fr, de, it, pl, tr). Siguiente paso: Fase 4 (múltiples ubicaciones)
- Nota: cada nuevo idioma en la app es independiente de la ficha de Play Store en ese idioma (ASO) — ver sección de Consideraciones futuras para el seguimiento de fichas de tienda por idioma

## 💭 Consideraciones futuras (no priorizadas aún)

**Fichas de Play Store en los 6 idiomas nuevos (pt-BR, fr, de, it, pl, tr)**
- Planteado 2026-07-27: la app ya soporta 9 idiomas, pero Play Store solo tiene fichas de tienda (Store Listing) en `es-ES` y `en-US` — usuarios de los otros 6 mercados ven la ficha en español/inglés al buscar en Play Store, independientemente del idioma que hable la app
- Importante: esto no es solo traducir el texto ya existente — para que aporte descargas reales hace falta investigar palabras clave por mercado (mismo enfoque que la distinción "Tiempo" vs "Clima" entre es/es-419), no una traducción literal
- Motivación explícita de David: volumen de descargas actual muy bajo, así que mejorar ASO en más mercados es palanca directa para crecimiento, no solo "cobertura por cobertura"
- Decisión: no priorizado todavía, pero marcado como candidato de alto valor a revisar pronto dado el bajo volumen actual — no confundir con "ya está hecho" solo porque la app esté traducida

**API propia como proxy/caché sobre Visual Crossing (y otras APIs futuras)**
- Idea planteada 2026-07-14: montar un pequeño backend propio (en el hosting de Hostinger que ya tiene David) que actúe de intermediario entre la app y Visual Crossing (y futuras APIs como AQI/radar de lluvia)
- Beneficio 1 — caché compartida real: hoy cada dispositivo cachea 30-60 min en su propio AsyncStorage; un backend propio podría cachear por ubicación y servir a todos los usuarios que consulten la misma zona en la misma ventana de tiempo, reduciendo drásticamente las llamadas reales a Visual Crossing según crezca la base de usuarios
- Beneficio 2 — protección real de la API key: al usar `EXPO_PUBLIC_WEATHER_API_KEY`, la key se empaqueta en el bundle JS y es extraíble descompilando el APK (EAS Secrets protege el build, no el bundle final); con backend propio la key viviría solo en servidor
- Coste: pasar de "100% client-side" a mantener un servicio corriendo (uptime, logs, nuevo punto de fallo)
- Requisito técnico pendiente de confirmar: tipo de plan de Hostinger (hosting compartido no soporta procesos Node.js persistentes; VPS o Cloud sí, o alternativa serverless tipo Cloudflare Workers/Vercel Functions/Railway)
- Decisión: no priorizado por ahora; revisar si el volumen de descargas/uso crece lo suficiente como para justificarlo

**Aviso de nueva versión + ficha en inglés**: ver notas en Fase 2 y Fase 8 respectivamente

**Salud técnica pendiente (avisos de Play Console, no bloqueantes)**
Tres "acciones recomendadas" detectadas por Play Console tras subir el build 1.2.0 (12), ninguna bloquea la publicación actual:
1. **APIs deprecadas para edge-to-edge** (`setStatusBarColor`/`setNavigationBarColor`, deprecadas en Android 15): probablemente provienen de una dependencia nativa del stack (ej. `react-native-screens`) usando APIs antiguas. Prioridad baja — se espera que se resuelva solo al actualizar Expo SDK y dependencias en el futuro, no requiere acción manual inmediata
2. **Restricciones de orientación/tamaño para pantallas grandes** (tablets): la app está fijada a `"orientation": "portrait"` sin soporte de tablet. Decisión consciente de mantenerlo así por ahora — el esfuerzo de soportar tablets no compensa para una app de tiempo enfocada en móvil con la base de usuarios actual; revisar si el volumen de uso en tablets lo justifica en el futuro
3. **Optimización R8 recomendada** ✅ DIAGNOSTICADA (2026-07-17): la causa real no era `eas.json`/`eas submit` (no gestionan esto en absoluto), sino que **R8 estaba completamente desactivado** (`minifyEnabled false`, sin `expo-build-properties`), por lo que nunca se generaba `mapping.txt`. Arreglo: instalado `expo-build-properties`, configurado en `app.json` con `enableMinifyInReleaseBuilds: true` + `enableShrinkResourcesInReleaseBuilds: true` (nombres nuevos; `enableProguardInReleaseBuilds` está deprecado desde SDK 54). Con AGP ≥4.2, el `.aab` incluye el mapping embebido automáticamente, sin pasos manuales de EAS
   - **Precaución antes de activarlo en producción**: R8 reescribe bytecode real y puede romper librerías con reflexión si falta alguna regla de ProGuard — precedente real documentado en expo/expo#15761 (crash de `react-native-svg` tras activar minificación). Dado que el proyecto no tiene test suite, este cambio se probará en un build de EAS **separado** de la release 1.2.0 ya enviada, con prueba manual exhaustiva en dispositivo real de: RevenueCat (`initPurchases` sin crash), PostHog (eventos siguen llegando al dashboard), notificaciones (se disparan correctamente) e i18n (cambio de idioma sigue funcionando) — estas son las áreas de mayor riesgo por depender de módulos nativos/reflexión

---

**Nota de flujo de trabajo**: la implementación técnica de cada fase se realiza en Claude Code sobre el repo real (`github.com/zalaty/weather-alert-app`); este documento y las conversaciones en Claude.ai se usan para decisiones de arquitectura, planificación y consultas puntuales entre fases.
