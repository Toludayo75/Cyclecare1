import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/Button";
import { useTranslation } from "@/context/LanguageContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

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
      <View style={styles.illustrationContainer}>
        <Image
          source={require("@/assets/welcome-hero.jpg")}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <View style={styles.pillContainer}>
          <View style={[styles.pill, { backgroundColor: colors.primary + "20" }]}>
            <Image
              source={require("@/assets/logo.png")}
              style={styles.pillLogo}
              resizeMode="contain"
            />
            <Text style={[styles.pillText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              CycleCare
            </Text>
          </View>
        </View>

        <Text style={[styles.headline, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {t("welcomeHeadline")}
        </Text>

        <Text style={[styles.subtext, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {t("welcomeSubtext")}
        </Text>

        <View style={styles.buttons}>
          <Button
            label={t("getStarted")}
            onPress={() => router.push("/(auth)/sign-up")}
            variant="primary"
          />
          <Button
            label={t("signIn")}
            onPress={() => router.push("/(auth)/login")}
            variant="outline"
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  illustrationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  pillContainer: {
    marginBottom: 16,
  },
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  pillLogo: {
    width: 20,
    height: 20,
  },
  pillText: {
    fontSize: 13,
  },
  headline: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 32,
  },
  buttons: {},
});
