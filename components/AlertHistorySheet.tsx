import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radius, Theme } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getIntlLocale } from '../i18n';
import { ALERT_TYPES } from '../constants/alertTypes';
import { AlertHistoryEntry, ALERT_HISTORY_FREE_LIMIT } from '../services/alertHistoryStorage';

interface AlertHistorySheetProps {
  visible: boolean;
  onClose: () => void;
  history: AlertHistoryEntry[];
  isPremium: boolean;
  onUpgradePress: () => void;
}

export default function AlertHistorySheet({
  visible,
  onClose,
  history,
  isPremium,
  onUpgradePress,
}: AlertHistorySheetProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const s = makeStyles(theme);

  const isLimited = !isPremium && history.length > ALERT_HISTORY_FREE_LIMIT;
  const visibleHistory = isLimited ? history.slice(0, ALERT_HISTORY_FREE_LIMIT) : history;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={s.title}>{t('alerts.history.title')}</Text>

          {visibleHistory.length === 0 ? (
            <Text style={s.emptyText}>{t('alerts.history.empty')}</Text>
          ) : (
            <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
              {visibleHistory.map((entry, index) => {
                const alertMeta = ALERT_TYPES.find((a) => a.id === entry.type)!;
                const label = t(`alerts.types.${entry.type}.label`);
                const date = new Date(entry.timestamp).toLocaleString(getIntlLocale(i18n.language), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });
                return (
                  <View key={`${entry.timestamp}-${index}`} style={s.entryRow}>
                    <Text style={s.entryEmoji}>{alertMeta.emoji}</Text>
                    <View style={s.entryInfo}>
                      <Text style={s.entryLabel}>{label}</Text>
                      <Text style={s.entryDetail}>
                        {entry.value}{alertMeta.unit} · {t('alerts.history.thresholdLabel')}: {entry.threshold}{alertMeta.unit}
                      </Text>
                      <Text style={s.entryDate}>
                        {date}
                        {!entry.notified ? ` · ${t('alerts.history.silencedTag')}` : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {isLimited && (
                <TouchableOpacity style={s.upgradeRow} onPress={onUpgradePress}>
                  <Text style={s.upgradeText}>
                    {t('alerts.history.limitedNotice', { count: ALERT_HISTORY_FREE_LIMIT })}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
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
      gap: Spacing.sm,
      maxHeight: '75%',
    },
    closeBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md, zIndex: 1 },
    closeBtnText: { fontSize: Typography.lg, color: theme.textSecondary },
    title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: theme.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
    emptyText: { fontSize: Typography.sm, color: theme.textSecondary, textAlign: 'center', marginVertical: Spacing.lg },
    list: { gap: Spacing.xs },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: theme.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.md,
      marginBottom: Spacing.xs,
    },
    entryEmoji: { fontSize: Typography.xl },
    entryInfo: { flex: 1, gap: 2 },
    entryLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: theme.textPrimary },
    entryDetail: { fontSize: Typography.xs, color: theme.textSecondary },
    entryDate: { fontSize: Typography.xs, color: theme.textSecondary },
    upgradeRow: {
      backgroundColor: theme.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: theme.storm,
      padding: Spacing.md,
      marginTop: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    upgradeText: { fontSize: Typography.xs, color: theme.storm, fontWeight: Typography.semibold, textAlign: 'center' },
  });
}
