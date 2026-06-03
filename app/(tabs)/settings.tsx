import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useWeatherStore } from '../../store/weatherStore';

interface SettingRowProps {
  label: string;
  description?: string;
  right: React.ReactNode;
}

function SettingRow({ label, description, right }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && (
          <Text style={styles.rowDescription}>{description}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const { units, toggleUnits } = useWeatherStore();
  const isMetric = units === 'metric';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.screenTitle}>Ajustes</Text>

        {/* Unidades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unidades</Text>
          <View style={styles.card}>
            <SettingRow
              label="Sistema métrico"
              description={isMetric ? '°C · km/h · mm' : '°F · mph · in'}
              right={
                <Switch
                  value={isMetric}
                  onValueChange={toggleUnits}
                  trackColor={{ false: Colors.border, true: Colors.accent }}
                  thumbColor={Colors.cardLight}
                />
              }
            />
          </View>
        </View>

        {/* Unidades selector visual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temperatura</Text>
          <View style={styles.card}>
            <View style={styles.segmented}>
              <TouchableOpacity
                style={[styles.segment, isMetric && styles.segmentActive]}
                onPress={() => !isMetric && toggleUnits()}
              >
                <Text style={[styles.segmentText, isMetric && styles.segmentTextActive]}>
                  °C — Celsius
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, !isMetric && styles.segmentActive]}
                onPress={() => isMetric && toggleUnits()}
              >
                <Text style={[styles.segmentText, !isMetric && styles.segmentTextActive]}>
                  °F — Fahrenheit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Info app */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.card}>
            <SettingRow
              label="Avisa"
              description="Versión 1.0.0"
              right={<Text style={styles.rowValue}>☀️</Text>}
            />
            <View style={styles.divider} />
            <SettingRow
              label="Datos meteorológicos"
              description="Visual Crossing Weather API"
              right={<Text style={styles.rowValue}>🔌</Text>}
            />
            <View style={styles.divider} />
            <SettingRow
              label="Actualización automática"
              description="Cada 30 minutos"
              right={<Text style={styles.rowValue}>🔄</Text>}
            />
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  screenTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  rowDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  rowValue: {
    fontSize: Typography.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  segmented: {
    flexDirection: 'column',
  },
  segment: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  segmentActive: {
    backgroundColor: `${Colors.accent}15`,
  },
  segmentText: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  segmentTextActive: {
    color: Colors.accent,
    fontWeight: Typography.semibold,
  },
});