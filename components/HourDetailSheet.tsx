import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radius, Theme } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { HourlyWeather } from '../services/weatherApi';
import { getWeatherEmoji } from '../utils/weatherIcons';
import { translateCondition } from '../utils/weatherConditions';
import { getWindDirection } from '../utils/wind';

interface HourDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  hour: HourlyWeather | null;
  unitLabel: string;
  windLabel: string;
}

export default function HourDetailSheet({ visible, onClose, hour, unitLabel, windLabel }: HourDetailSheetProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const s = makeStyles(theme);

  if (!hour) return null;

  const windDirs = t('weather.windDirections', { returnObjects: true }) as string[];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={s.time}>{hour.time.substring(0, 5)}</Text>
          <Text style={s.emoji}>{getWeatherEmoji(hour.icon)}</Text>
          <Text style={s.temp}>{hour.temp}{unitLabel}</Text>
          <Text style={s.conditions}>{translateCondition(hour.conditions, t)}</Text>

          <View style={s.statsGrid}>
            <Stat s={s} emoji="🤔" value={`${hour.feelsLike}${unitLabel}`} label={t('home.feelsLike', { value: hour.feelsLike, unit: unitLabel })} />
            <Stat s={s} emoji="💨" value={`${hour.windSpeed} ${windLabel}`} label={getWindDirection(hour.windDir, windDirs)} />
            <Stat s={s} emoji="💧" value={`${hour.humidity}%`} label={t('home.stats.humidity')} />
            <Stat s={s} emoji="🌂" value={`${hour.precipProb}%`} label={t('home.stats.rain')} />
            <Stat s={s} emoji="🔆" value={`${hour.uvIndex}`} label={t('home.stats.uv')} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ s, emoji, value, label }: { s: any; emoji: string; value: string; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statEmoji}>{emoji}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.lg,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    closeBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md, zIndex: 1 },
    closeBtnText: { fontSize: Typography.lg, color: theme.textSecondary },
    time: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: theme.textSecondary },
    emoji: { fontSize: 56, marginTop: Spacing.xs },
    temp: { fontSize: Typography.xxxl, fontWeight: Typography.bold, color: theme.textPrimary },
    conditions: { fontSize: Typography.md, color: theme.textSecondary, marginBottom: Spacing.sm },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, width: '100%' },
    statCard: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 2, backgroundColor: theme.background, borderRadius: Radius.md, paddingVertical: Spacing.sm },
    statEmoji: { fontSize: Typography.lg },
    statValue: { fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.textPrimary },
    statLabel: { fontSize: Typography.xs, color: theme.textSecondary, textAlign: 'center' },
  });
}
