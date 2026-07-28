import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radius, Theme } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { SavedLocation, makeSavedLocationId } from '../services/savedLocationsStorage';

export const MAX_SAVED_LOCATIONS = 5;

interface CurrentLocation {
  name: string;
  lat: number;
  lon: number;
}

interface SavedLocationsSheetProps {
  visible: boolean;
  onClose: () => void;
  savedLocations: SavedLocation[];
  currentLocation: CurrentLocation | null;
  isPremium: boolean;
  onSelect: (location: SavedLocation) => void;
  onSaveCurrent: () => void;
  onRemove: (id: string) => void;
}

export default function SavedLocationsSheet({
  visible,
  onClose,
  savedLocations,
  currentLocation,
  isPremium,
  onSelect,
  onSaveCurrent,
  onRemove,
}: SavedLocationsSheetProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const s = makeStyles(theme);

  const isCurrentSaved =
    !!currentLocation &&
    savedLocations.some((loc) => loc.id === makeSavedLocationId(currentLocation.lat, currentLocation.lon));
  const atMax = isPremium && savedLocations.length >= MAX_SAVED_LOCATIONS;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={s.title}>{t('savedLocations.title')}</Text>

          {currentLocation && !isCurrentSaved && (
            <TouchableOpacity
              style={[s.saveRow, atMax && s.saveRowDisabled]}
              onPress={onSaveCurrent}
              disabled={atMax}
            >
              <Text style={s.saveRowIcon}>＋</Text>
              <Text style={s.saveRowText} numberOfLines={1}>
                {atMax
                  ? t('savedLocations.maxReached', { max: MAX_SAVED_LOCATIONS })
                  : t('savedLocations.saveCurrent', { name: currentLocation.name })}
              </Text>
            </TouchableOpacity>
          )}

          {savedLocations.length === 0 ? (
            <Text style={s.emptyText}>{t('savedLocations.empty')}</Text>
          ) : (
            <View style={s.list}>
              {savedLocations.map((loc) => (
                <View key={loc.id} style={s.locationRow}>
                  <TouchableOpacity style={s.locationRowMain} onPress={() => onSelect(loc)}>
                    <Text style={s.locationIcon}>📍</Text>
                    <Text style={s.locationName} numberOfLines={1}>{loc.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.removeBtn} onPress={() => onRemove(loc.id)} hitSlop={8}>
                    <Text style={s.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
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
    },
    closeBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md, zIndex: 1 },
    closeBtnText: { fontSize: Typography.lg, color: theme.textSecondary },
    title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: theme.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
    saveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: theme.background,
      borderRadius: Radius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    saveRowDisabled: { borderColor: theme.border, opacity: 0.6 },
    saveRowIcon: { fontSize: Typography.md, color: theme.accent, fontWeight: Typography.bold },
    saveRowText: { fontSize: Typography.sm, color: theme.textPrimary, fontWeight: Typography.medium, flex: 1 },
    emptyText: { fontSize: Typography.sm, color: theme.textSecondary, textAlign: 'center', marginVertical: Spacing.lg },
    list: { gap: Spacing.xs },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    locationRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
    locationIcon: { fontSize: Typography.md },
    locationName: { fontSize: Typography.sm, color: theme.textPrimary, fontWeight: Typography.medium, flex: 1 },
    removeBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
    removeBtnText: { fontSize: Typography.sm, color: theme.textSecondary },
  });
}
