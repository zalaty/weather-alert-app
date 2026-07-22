import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PACKAGE_TYPE, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Typography, Spacing, Radius, Theme } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { buyPackage, getCurrentOffering } from '../services/purchases';
import { trackEvent } from '../services/analytics';

const PACKAGE_ORDER: Partial<Record<PACKAGE_TYPE, number>> = {
  [PACKAGE_TYPE.MONTHLY]: 0,
  [PACKAGE_TYPE.ANNUAL]: 1,
};

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
}

export default function Paywall({ visible, onClose }: PaywallProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoadingOffering(true);
    getCurrentOffering()
      .then(setOffering)
      .finally(() => setLoadingOffering(false));
  }, [visible]);

  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      setPurchasingId(pkg.identifier);
      const result = await buyPackage(pkg);
      setPurchasingId(null);

      if (result.status === 'success') {
        trackEvent('purchase_completed', {
          package_id: pkg.identifier,
          product_id: pkg.product.identifier,
          price: pkg.product.price,
          currency: pkg.product.currencyCode,
        });
        Alert.alert(t('paywall.successTitle'), t('paywall.successBody'));
        onClose();
      } else if (result.status === 'cancelled') {
        trackEvent('purchase_cancelled', { package_id: pkg.identifier });
      } else {
        trackEvent('purchase_failed', {
          package_id: pkg.identifier,
          error_code: result.error?.code ?? null,
        });
        Alert.alert(t('paywall.errorTitle'), t('paywall.errorBody'));
      }
    },
    [onClose, t]
  );

  const s = makeStyles(theme);
  const packages = [...(offering?.availablePackages ?? [])].sort(
    (a, b) => (PACKAGE_ORDER[a.packageType] ?? 99) - (PACKAGE_ORDER[b.packageType] ?? 99)
  );
  const monthlyPackage = offering?.monthly ?? null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={s.emoji}>💎</Text>
          <Text style={s.title}>{t('paywall.title')}</Text>
          <Text style={s.subtitle}>{t('paywall.subtitle')}</Text>

          {loadingOffering ? (
            <ActivityIndicator size="large" color={theme.accent} style={s.loader} />
          ) : packages.length === 0 ? (
            <Text style={s.emptyText}>{t('paywall.unavailable')}</Text>
          ) : (
            <View style={s.packages}>
              {packages.map((pkg) => {
                const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
                const pricePerMonth = pkg.product.pricePerMonth;
                const savingsPct =
                  isAnnual && monthlyPackage && pricePerMonth != null && monthlyPackage.product.price > 0
                    ? Math.round((1 - pricePerMonth / monthlyPackage.product.price) * 100)
                    : null;
                const isPurchasing = purchasingId === pkg.identifier;

                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={s.packageCard}
                    disabled={purchasingId !== null}
                    onPress={() => handlePurchase(pkg)}
                  >
                    <View style={s.packageInfo}>
                      <View style={s.packageTitleRow}>
                        <Text style={s.packageTitle}>{pkg.product.title}</Text>
                        {savingsPct !== null && savingsPct > 0 && (
                          <Text style={s.savingsBadge}>{t('paywall.savings', { percent: savingsPct })}</Text>
                        )}
                      </View>
                      <Text style={s.packageDescription}>{pkg.product.description}</Text>
                    </View>
                    {isPurchasing ? (
                      <ActivityIndicator color={theme.accent} />
                    ) : (
                      <Text style={s.packagePrice}>{pkg.product.priceString}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={s.disclaimer}>{t('paywall.disclaimer')}</Text>
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
    emoji: { fontSize: Typography.xxxl, textAlign: 'center' },
    title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: theme.textPrimary, textAlign: 'center' },
    subtitle: { fontSize: Typography.sm, color: theme.textSecondary, textAlign: 'center', marginBottom: Spacing.sm },
    loader: { marginVertical: Spacing.xl },
    emptyText: { fontSize: Typography.sm, color: theme.textSecondary, textAlign: 'center', marginVertical: Spacing.lg },
    packages: { gap: Spacing.sm },
    packageCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.background,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      borderWidth: 2,
      borderColor: theme.border,
      gap: Spacing.sm,
    },
    packageInfo: { flex: 1, gap: 2 },
    packageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    packageTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    packageDescription: { fontSize: Typography.xs, color: theme.textSecondary },
    savingsBadge: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.textLight,
      backgroundColor: theme.storm,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      overflow: 'hidden',
    },
    packagePrice: { fontSize: Typography.md, fontWeight: Typography.bold, color: theme.accent },
    disclaimer: { fontSize: Typography.xs, color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  });
}
