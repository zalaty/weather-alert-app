import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography, Spacing, Radius, Theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Texto para lectores de pantalla si `label` no se entiende leído (p. ej. "°C · km/h") */
  accessibilityLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  return (
    <View style={s.track} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => !selected && onChange(option.value)}
            style={({ pressed }) => [s.segment, selected && s.segmentSelected, pressed && !selected && s.segmentPressed]}
            android_ripple={selected ? undefined : { color: theme.border, borderless: false }}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
          >
            {/* El activo se distingue por fondo elevado + borde + check + negrita, no solo por color */}
            <Text style={[s.label, selected && s.labelSelected]}>
              {selected ? '✓ ' : ''}
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: theme.background,
      borderRadius: Radius.md,
      padding: 3,
      gap: 3,
    },
    segment: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
      overflow: 'hidden',
    },
    segmentSelected: { backgroundColor: theme.card, borderColor: theme.accent },
    segmentPressed: { opacity: 0.6 },
    // Sin numberOfLines: con textos largos (de, pl) el segmento crece en alto en vez de recortar
    label: { fontSize: Typography.sm, color: theme.textSecondary, fontWeight: Typography.medium, textAlign: 'center' },
    labelSelected: { color: theme.textPrimary, fontWeight: Typography.bold },
  });
}
