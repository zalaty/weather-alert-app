import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radius } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface RainRadarCardProps {
  isPremium: boolean;
  onPress: () => void;
}

export default function RainRadarCard({ isPremium, onPress }: RainRadarCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const s = makeStyles(theme);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.badge, { backgroundColor: isPremium ? theme.accent : theme.textSecondary }]}>
        <Text style={s.badgeIcon}>{isPremium ? '🛰️' : '🔒'}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.title}>{t('weatherDetails.radar.cardTitle')}</Text>
        <Text style={[s.subtitle, !isPremium && s.subtitleHint]}>
          {isPremium ? t('weatherDetails.radar.subtitle') : t('weatherDetails.radar.premiumHint')}
        </Text>
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
    badgeIcon: { fontSize: Typography.md },
    info: { flex: 1, gap: 2 },
    title: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    subtitle: { fontSize: Typography.xs, color: theme.textSecondary },
    subtitleHint: { color: theme.accent, fontWeight: Typography.medium },
  });
}
