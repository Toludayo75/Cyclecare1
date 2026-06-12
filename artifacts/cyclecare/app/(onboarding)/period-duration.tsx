import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PeriodDurationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [duration, setDuration] = useState(5);

  async function handleContinue() {
    await AsyncStorage.setItem("onboarding_period_duration", String(duration));
    router.push("/(onboarding)/flow-type");
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
            <View key={i} style={[styles.dot, { backgroundColor: i <= 3 ? colors.primary : colors.border }]} />
          ))}
        </View>

        <Text style={[styles.question, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {t("periodDurationTitle")}
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {t("periodDurationHint")}
        </Text>

        <View style={[styles.selectorCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <TouchableOpacity
            style={[styles.counterBtn, { backgroundColor: colors.primary + "15", borderRadius: 50 }]}
            onPress={() => setDuration(d => Math.max(1, d - 1))}
          >
            <Feather name="minus" size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{duration}</Text>
            <Text style={[styles.valueLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{t("days")}</Text>
          </View>

          <TouchableOpacity
            style={[styles.counterBtn, { backgroundColor: colors.primary + "15", borderRadius: 50 }]}
            onPress={() => setDuration(d => Math.min(10, d + 1))}
          >
            <Feather name="plus" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.rangeHint}>
          {[1,2,3,4,5,6,7,8,9,10].map(d => (
            <View
              key={d}
              style={[
                styles.rangeDot,
                {
                  backgroundColor: d <= duration ? colors.primary : colors.border,
                  width: d <= duration ? 12 : 8,
                  height: d <= duration ? 12 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }]}>
        <Button label={t("continue")} onPress={handleContinue} />
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
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 40 },
  selectorCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  counterBtn: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  valueContainer: { alignItems: "center" },
  value: { fontSize: 52 },
  valueLabel: { fontSize: 14, marginTop: -4 },
  rangeHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 32 },
  rangeDot: { borderRadius: 10 },
  footer: {},
});
