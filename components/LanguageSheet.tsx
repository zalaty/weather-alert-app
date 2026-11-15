import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radius, Theme } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import {
  LANGUAGE_NAMES,
  LanguagePreference,
  SUPPORTED_LANGUAGES,
  resolveDeviceLanguage,
} from '../i18n';

interface LanguageSheetProps {
  visible: boolean;
  onClose: () => void;
  preference: LanguagePreference;
  onSelect: (preference: LanguagePreference) => void;
}

export default function LanguageSheet({ visible, onClose, preference, onSelect }: LanguageSheetProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const s = makeStyles(theme);

  const options: { value: LanguagePreference; label: string; hint?: string }[] = [
    {
      value: 'auto',
      label: t('settings.language.automatic'),
      hint: t('settings.language.automaticHint', { language: LANGUAGE_NAMES[resolveDeviceLanguage()] }),
    },
    ...SUPPORTED_LANGUAGES.map((lang) => ({ value: lang as LanguagePreference, label: LANGUAGE_NAMES[lang] })),
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        {/* Tocar fuera de la hoja la cierra */}
        <Pressable style={s.dismissArea} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} />
        <View style={s.sheet}>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={s.title} accessibilityRole="header">{t('settings.language.label')}</Text>

          <ScrollView style={s.list} accessibilityRole="radiogroup">
            {options.map((option, index) => {
              const selected = option.value === preference;
              return (
                <View key={option.value}>
                  {index > 0 && <View style={s.divider} />}
                  <Pressable
                    onPress={() => onSelect(option.value)}
                    style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                    android_ripple={{ color: theme.border }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, checked: selected }}
                    accessibilityLabel={option.hint ? `${option.label}. ${option.hint}` : option.label}
                  >
                    <View style={s.rowText}>
                      <Text style={[s.rowLabel, selected && s.rowLabelSelected]}>{option.label}</Text>
                      {option.hint && <Text style={s.rowHint}>{option.hint}</Text>}
                    </View>
                    <Text style={s.check}>{selected ? '✓' : ''}</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    dismissArea: { flex: 1 },
    sheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      maxHeight: '85%',
    },
    closeBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md, zIndex: 1, padding: Spacing.xs },
    closeBtnText: { fontSize: Typography.lg, color: theme.textSecondary },
    title: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.xl,
    },
    list: { flexGrow: 0 },
    row: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
    },
    rowPressed: { backgroundColor: theme.background },
    rowText: { flex: 1, gap: 2 },
    rowLabel: { fontSize: Typography.md, color: theme.textPrimary },
    rowLabelSelected: { fontWeight: Typography.bold },
    rowHint: { fontSize: Typography.sm, color: theme.textSecondary },
    check: { width: 24, fontSize: Typography.lg, color: theme.accent, fontWeight: Typography.bold, textAlign: 'center' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginHorizontal: Spacing.lg },
  });
}
