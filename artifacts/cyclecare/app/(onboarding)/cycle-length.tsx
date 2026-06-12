import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OPTIONS = [21, 24, 28, 30, 32, 35];

export default function CycleLengthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(28);
  const [customValue, setCustomValue] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  async function handleContinue() {
    if (customValue.trim().length > 0) {
      const parsed = Number(customValue.trim());
      if (Number.isNaN(parsed) || parsed < 14 || parsed > 60) {
        setCustomError("Please enter a valid cycle length between 14 and 60 days.");
        return;
      }
    }

    await AsyncStorage.setItem("onboarding_cycle_length", String(selected));
    router.push("/(onboarding)/period-duration");
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
            <View key={i} style={[styles.dot, { backgroundColor: i <= 2 ? colors.primary : colors.border }]} />
          ))}
        </View>

        <Text style={[styles.question, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {t("cycleLengthTitle")}
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {t("cycleLengthHint")}
        </Text>

        <View style={styles.grid}>
          {OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionCard,
                {
                  backgroundColor: selected === opt ? colors.primary : colors.card,
                  borderRadius: colors.radius,
                  borderWidth: 1.5,
                  borderColor: selected === opt ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setSelected(opt);
                setCustomValue("");
                setCustomError(null);
              }}
            >
              <Text style={[styles.optionNum, { color: selected === opt ? "#fff" : colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {opt}
              </Text>
              <Text style={[styles.optionLabel, { color: selected === opt ? "#ffffff99" : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("days")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Other length"
          placeholder="Enter days, e.g. 31"
          value={customValue}
          onChangeText={(value) => {
            const digitsOnly = value.replace(/[^0-9]/g, "");
            setCustomValue(digitsOnly);
            setCustomError(null);
            const parsed = Number(digitsOnly);
            if (digitsOnly.length > 0 && !Number.isNaN(parsed)) {
              setSelected(parsed);
            }
          }}
          keyboardType="numeric"
          error={customError ?? undefined}
          style={styles.customInput}
        />

        <Text style={[styles.selectedNote, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
          {t("selected")}: {selected} {t("days")}
        </Text>
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
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 32 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  optionCard: { width: "30%", aspectRatio: 1.2, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  optionNum: { fontSize: 24 },
  optionLabel: { fontSize: 12, marginTop: 2 },
  selectedNote: { textAlign: "center", marginTop: 24, fontSize: 14 },
  customInput: { marginTop: 16 },
  footer: {},
});
