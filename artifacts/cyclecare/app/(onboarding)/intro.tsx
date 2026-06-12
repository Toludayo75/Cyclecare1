import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/Button";

export default function OnboardingIntroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const FEATURES = [
    { icon: "calendar", textKey: "featurePredict" },
    { icon: "package", textKey: "featureProducts" },
    { icon: "book-open", textKey: "featureEducation" },
  ];

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
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="heart" size={44} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {t("onboardingTitle")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {t("onboardingSubtitle")}
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.secondary + "15" }]}>
                <Feather name={f.icon as any} size={18} color={colors.secondary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                {t(f.textKey)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }]}>
        <Button label={t("getStarted")} onPress={() => router.push("/(onboarding)/personal-info")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  title: { fontSize: 28, textAlign: "center", marginBottom: 12, lineHeight: 36 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 36 },
  features: { width: "100%", gap: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontSize: 15, lineHeight: 22 },
  footer: {},
});
