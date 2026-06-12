import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from "react-native-reanimated";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { getApiUrl } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEYS = [
  "onboarding_last_period",
  "onboarding_cycle_length",
  "onboarding_period_duration",
  "onboarding_flow_type",
];

export default function OnboardingCompleteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { token, user, updateUser } = useAuth();

  const [isSaving, setIsSaving] = useState(true);
  const [saved, setSaved] = useState(false);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 150 }));
    opacity.value = withDelay(400, withSpring(1));
  }, []);

  useEffect(() => {
    async function clearOnboardingKeys() {
      try {
        await Promise.all(ONBOARDING_KEYS.map((key) => AsyncStorage.removeItem(key)));
      } finally {
        setSaved(true);
        setIsSaving(false);
      }
    }

    clearOnboardingKeys();
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

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
        <Animated.View style={[styles.iconCircle, { backgroundColor: colors.secondary + "15" }, iconStyle]}>
          <Feather name="check-circle" size={56} color={colors.secondary} />
        </Animated.View>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}> 
          {t("completeTitle")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}> 
          {t("completeSubtitle")}
        </Text>

        <View style={[styles.previewCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
          <Text style={[styles.previewLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}> 
            {t("cycleSetUp")}
          </Text>
          <View style={styles.previewRow}>
            <Feather name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.previewText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}> 
              {t("predictionsDashboard")}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Feather name="package" size={16} color={colors.secondary} />
            <Text style={[styles.previewText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}> 
              {t("requestProducts")}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }]}> 
        <Button
          label={t("goToDashboard")}
          onPress={() => router.replace("/(tabs)")}
          loading={isSaving}
          disabled={!saved}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  iconCircle: { width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  title: { fontSize: 28, textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 36 },
  previewCard: { width: "100%", padding: 20, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  previewLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 4 },
  previewRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  previewText: { flex: 1, fontSize: 14, lineHeight: 20 },
  footer: {},
});
