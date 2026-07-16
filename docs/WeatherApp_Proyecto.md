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

### Fase 3 — RevenueCat + paywall
- Integrar suscripciones y paywall en pantalla de Alerts antes de construir features premium nuevas
- Así cada feature premium a partir de aquí nace ya con su gate integrado

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

## 💭 Consideraciones futuras (no priorizadas aún)

**API propia como proxy/caché sobre Visual Crossing (y otras APIs futuras)**
- Idea planteada 2026-07-14: montar un pequeño backend propio (en el hosting de Hostinger que ya tiene David) que actúe de intermediario entre la app y Visual Crossing (y futuras APIs como AQI/radar de lluvia)
- Beneficio 1 — caché compartida real: hoy cada dispositivo cachea 30-60 min en su propio AsyncStorage; un backend propio podría cachear por ubicación y servir a todos los usuarios que consulten la misma zona en la misma ventana de tiempo, reduciendo drásticamente las llamadas reales a Visual Crossing según crezca la base de usuarios
- Beneficio 2 — protección real de la API key: al usar `EXPO_PUBLIC_WEATHER_API_KEY`, la key se empaqueta en el bundle JS y es extraíble descompilando el APK (EAS Secrets protege el build, no el bundle final); con backend propio la key viviría solo en servidor
- Coste: pasar de "100% client-side" a mantener un servicio corriendo (uptime, logs, nuevo punto de fallo)
- Requisito técnico pendiente de confirmar: tipo de plan de Hostinger (hosting compartido no soporta procesos Node.js persistentes; VPS o Cloud sí, o alternativa serverless tipo Cloudflare Workers/Vercel Functions/Railway)
- Decisión: no priorizado por ahora; revisar si el volumen de descargas/uso crece lo suficiente como para justificarlo

**Aviso de nueva versión + ficha en inglés**: ver notas en Fase 2 y Fase 8 respectivamente

---

**Nota de flujo de trabajo**: la implementación técnica de cada fase se realiza en Claude Code sobre el repo real (`github.com/zalaty/weather-alert-app`); este documento y las conversaciones en Claude.ai se usan para decisiones de arquitectura, planificación y consultas puntuales entre fases.
