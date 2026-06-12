import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { getApiUrl } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function FlowTypeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { token, user, updateUser } = useAuth();
  const [selected, setSelected] = useState<"light" | "medium" | "heavy">("medium");
  const [isSaving, setIsSaving] = useState(false);

  const FLOW_OPTIONS = [
    { key: "light" as const,  labelKey: "flowLight",  descKey: "flowLightDesc",  dots: 1 },
    { key: "medium" as const, labelKey: "flowMedium", descKey: "flowMediumDesc", dots: 2 },
    { key: "heavy" as const,  labelKey: "flowHeavy",  descKey: "flowHeavyDesc",  dots: 3 },
  ];

  async function handleContinue() {
    await AsyncStorage.setItem("onboarding_flow_type", selected);
    setIsSaving(true);
    try {
      if (!token) {
        throw new Error(t("networkError"));
      }

      const [lastPeriodDate, cycleLength, periodDuration, flowType] = await Promise.all([
        AsyncStorage.getItem("onboarding_last_period"),
        AsyncStorage.getItem("onboarding_cycle_length"),
        AsyncStorage.getItem("onboarding_period_duration"),
        AsyncStorage.getItem("onboarding_flow_type"),
      ]);

      const parsedCycleLength = Number.parseInt(cycleLength ?? "", 10);
      const parsedPeriodDuration = Number.parseInt(periodDuration ?? "", 10);

      if (!lastPeriodDate || Number.isNaN(parsedCycleLength) || Number.isNaN(parsedPeriodDuration)) {
        throw new Error(t("profileSaveFailed"));
      }

      const payload = {
        lastPeriodDate,
        cycleLength: parsedCycleLength,
        periodDuration: parsedPeriodDuration,
        flowType: (flowType as "light" | "medium" | "heavy") ?? "medium",
        notificationsEnabled: true,
      };

      const response = await fetch(`${getApiUrl("/api/cycle/profile")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? t("profileSaveFailed"));
      }

      if (user) {
        await updateUser({ ...user, hasCompletedOnboarding: true });
      }

      router.push("/(onboarding)/complete");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("networkError");
      Alert.alert(t("error"), message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.progressBar}>
          {[1,2,3,4].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 4 ? colors.primary : colors.border }]} />
          ))}
        </View>

        <Text style={[styles.question, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {t("flowTypeTitle")}
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {t("flowTypeHint")}
        </Text>

        <View style={styles.options}>
          {FLOW_OPTIONS.map(opt => {
            const isSelected = selected === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected ? colors.primary + "10" : colors.card,
                    borderRadius: colors.radius,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelected(opt.key)}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.dotsRow}>
                    {[1,2,3].map(d => (
                      <Feather
                        key={d}
                        name="droplet"
                        size={16}
                        color={d <= opt.dots ? colors.primary : colors.border}
                      />
                    ))}
                  </View>
                  <View>
                    <Text style={[styles.optionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {t(opt.labelKey)}
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {t(opt.descKey)}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <Feather name="check-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }]}>
        <Button label={t("continue")} onPress={handleContinue} loading={isSaving} disabled={isSaving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24 },
  progressBar: { flexDirection: "row", gap: 8, marginBottom: 32 },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  question: { fontSize: 26, lineHeight: 34, marginBottom: 8 },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 28 },
  options: { gap: 12 },
  optionCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  dotsRow: { flexDirection: "row", gap: 3 },
  optionLabel: { fontSize: 16, marginBottom: 2 },
  optionDesc: { fontSize: 12, lineHeight: 18 },
  footer: {},
});
