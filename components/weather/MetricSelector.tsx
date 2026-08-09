import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radius } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export type WeatherMetric = 'temp' | 'wind' | 'air';

interface MetricSelectorProps {
  selected: WeatherMetric;
  onSelect: (metric: WeatherMetric) => void;
  isPremium: boolean;
  onRequestPaywall: () => void;
}

export default function MetricSelector({ selected, onSelect, isPremium, onRequestPaywall }: MetricSelectorProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const s = makeStyles(theme);

  const metrics: { key: WeatherMetric; icon: string; label: string; locked?: boolean }[] = [
    { key: 'temp', icon: '🌡️', label: t('weatherDetails.tabs.temp') },
    { key: 'wind', icon: '💨', label: t('weatherDetails.tabs.wind') },
    { key: 'air', icon: '🍃', label: t('weatherDetails.tabs.air'), locked: !isPremium },
  ];

  const handlePress = (metric: WeatherMetric) => {
    if (metric === 'air' && !isPremium) {
      onRequestPaywall();
      return;
    }
    onSelect(metric);
  };

  return (
    <View style={s.row}>
      {metrics.map((metric) => {
        const isSelected = selected === metric.key;
        return (
          <TouchableOpacity
            key={metric.key}
            style={[s.button, isSelected && s.buttonSelected]}
            onPress={() => handlePress(metric.key)}
          >
            <View style={s.iconWrap}>
              <Text style={s.icon}>{metric.icon}</Text>
              {metric.locked && (
                <View style={s.lockBadge}>
                  <Text style={s.lockBadgeText}>🔒</Text>
                </View>
              )}
            </View>
            <Text style={[s.label, isSelected && s.labelSelected]}>{metric.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: Spacing.sm },
    button: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: theme.card,
    },
    buttonSelected: { backgroundColor: theme.accent },
    iconWrap: { position: 'relative' },
    icon: { fontSize: Typography.lg },
    lockBadge: { position: 'absolute', top: -4, right: -8 },
    lockBadgeText: { fontSize: 10 },
    label: { fontSize: Typography.xs, fontWeight: Typography.medium, color: theme.textSecondary },
    labelSelected: { color: theme.textLight },
  });
}
