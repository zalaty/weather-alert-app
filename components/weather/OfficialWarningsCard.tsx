import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radius, Theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { getIntlLocale } from '../../i18n';
import { OfficialWarning, WarningLevel } from '../../services/weatherApi';
import { trackEvent } from '../../services/analytics';

interface OfficialWarningsCardProps {
  warnings: OfficialWarning[] | undefined;
  /** Fecha local de "hoy" en la ubicación consultada (daily[0].date, "YYYY-MM-DD") */
  locationToday: string | undefined;
}

// Información de seguridad: visible para todos, sin gate premium.
export default function OfficialWarningsCard({ warnings, locationToday }: OfficialWarningsCardProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const s = makeStyles(theme);

  const idsKey = (warnings ?? []).map((w) => w.id).join('|');
  useEffect(() => {
    if (!warnings || warnings.length === 0) return;
    trackEvent('official_warnings_shown', { count: warnings.length, max_level: warnings[0].level });
  }, [idsKey]);

  if (!warnings || warnings.length === 0) return null;

  const locale = getIntlLocale(i18n.language);

  const formatUntil = (ends: string): string | null => {
    if (!ends) return null;
    // `ends` es hora local de la ubicación sin zona: al parsearlo sin zona y formatearlo en la
    // zona del dispositivo se conserva la hora "de pared" correcta, sea cual sea la del móvil.
    const date = new Date(ends);
    if (isNaN(date.getTime())) return null;
    const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    if (locationToday && ends.startsWith(locationToday)) {
      return t('home.warnings.until', { time });
    }
    const day = date.toLocaleDateString(locale, { weekday: 'long' });
    return t('home.warnings.untilDay', { day, time });
  };

  return (
    <View style={s.list}>
      {warnings.map((w) => {
        const color = levelColor(w.level, theme);
        const expanded = expandedId === w.id;
        const until = formatUntil(w.ends);
        const showHeadline = w.headline && w.headline !== w.event;

        return (
          <TouchableOpacity
            key={w.id}
            activeOpacity={0.8}
            style={[s.card, { borderLeftColor: color, backgroundColor: tint(color) }]}
            onPress={() => {
              if (!expanded) trackEvent('official_warning_expanded', { level: w.level });
              setExpandedId(expanded ? null : w.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${t('home.warnings.label')}: ${w.event}${until ? `. ${until}` : ''}`}
          >
            <View style={s.headerRow}>
              <Text style={s.icon}>⚠️</Text>
              <View style={s.headerText}>
                <Text style={[s.label, { color }]}>{t('home.warnings.label')}</Text>
                <Text style={s.event}>{w.event}</Text>
                {until && <Text style={s.until}>{until}</Text>}
              </View>
              <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
            </View>

            {expanded && (
              <View style={s.body}>
                {showHeadline && <Text style={s.headline}>{w.headline}</Text>}
                {!!w.description && <Text style={s.description}>{w.description}</Text>}
                {!!w.link && (
                  <TouchableOpacity
                    onPress={() => {
                      trackEvent('official_warning_link_opened', { level: w.level });
                      Linking.openURL(w.link).catch(() => {});
                    }}
                    hitSlop={8}
                    accessibilityRole="link"
                  >
                    <Text style={[s.link, { color }]}>{t('home.warnings.moreInfo')} ↗</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function levelColor(level: WarningLevel, theme: Theme): string {
  if (level === 'red') return theme.warningRed;
  if (level === 'orange') return theme.warningOrange;
  return theme.warningYellow;
}

// Fondo suave del mismo tono (~12% de opacidad)
function tint(hex: string): string {
  return `${hex}1F`;
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: { gap: Spacing.sm },
    card: {
      borderRadius: Radius.md,
      borderLeftWidth: 4,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    icon: { fontSize: Typography.xl },
    headerText: { flex: 1, gap: 2 },
    label: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
    event: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    until: { fontSize: Typography.xs, color: theme.textSecondary },
    chevron: { fontSize: Typography.xs, color: theme.textSecondary },
    body: { gap: Spacing.sm, paddingLeft: Typography.xl + Spacing.md },
    headline: { fontSize: Typography.sm, fontWeight: Typography.medium, color: theme.textPrimary },
    description: { fontSize: Typography.sm, color: theme.textPrimary, lineHeight: 19 },
    link: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  });
}
