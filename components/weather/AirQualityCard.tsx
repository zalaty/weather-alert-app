import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radius } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { AirQuality } from '../../services/weatherApi';
import { getAqiCategory, getAqiSeverity } from '../../utils/airQuality';

interface AirQualityCardProps {
  airQuality?: AirQuality;
  isPremium: boolean;
  onRequestPaywall: () => void;
}

export default function AirQualityCard({ airQuality, isPremium, onRequestPaywall }: AirQualityCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const s = makeStyles(theme);

  const aqiCategory = airQuality ? getAqiCategory(airQuality.aqiUs) : null;
  const aqiSeverity = aqiCategory ? getAqiSeverity(aqiCategory) : null;
  const badgeColor = !isPremium
    ? theme.textSecondary
    : aqiSeverity
      ? { good: theme.aqiGood, moderate: theme.aqiModerate, unhealthy: theme.aqiUnhealthy }[aqiSeverity]
      : theme.textSecondary;

  const title = isPremium && aqiCategory
    ? t(`weatherDetails.airQuality.categories.${aqiCategory}`)
    : t('weatherDetails.airQuality.cardTitle');

  const subtitle = !isPremium
    ? t('weatherDetails.airQuality.premiumHint')
    : airQuality
      ? t('weatherDetails.airQuality.euAqi', { value: airQuality.aqiEu })
      : t('weatherDetails.airQuality.noData');

  return (
    <TouchableOpacity
      style={s.card}
      disabled={isPremium}
      onPress={onRequestPaywall}
      activeOpacity={isPremium ? 1 : 0.7}
    >
      <View style={[s.badge, { backgroundColor: badgeColor }]}>
        {!isPremium ? (
          <Text style={s.badgeLock}>🔒</Text>
        ) : (
          <Text style={s.badgeValue}>{airQuality ? airQuality.aqiUs : '–'}</Text>
        )}
      </View>
      <View style={s.info}>
        <Text style={s.title}>{title}</Text>
        <Text style={[s.subtitle, !isPremium && s.subtitleHint]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: theme.card,
      borderRadius: Radius.md,
      padding: Spacing.md,
    },
    badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    badgeValue: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#FFFFFF' },
    badgeLock: { fontSize: Typography.sm },
    info: { flex: 1, gap: 2 },
    title: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    subtitle: { fontSize: Typography.xs, color: theme.textSecondary },
    subtitleHint: { color: theme.accent, fontWeight: Typography.medium },
  });
}
