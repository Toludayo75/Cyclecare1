import React from "react";
import { TouchableOpacity, Text, StyleSheet, Platform, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface BackButtonProps {
  onPress?: () => void;
  label?: string;
}

export function BackButton({ onPress, label = "Back" }: BackButtonProps) {
  const colors = useColors();

  function handlePress() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
      return;
    }

    const canGoBack = (router as unknown as { canGoBack?: () => boolean }).canGoBack?.();
    if (canGoBack === false) {
      router.replace("/(auth)/welcome");
      return;
    }
    router.back();
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={[styles.circle, { backgroundColor: colors.muted }]}>
        <Text style={[styles.arrow, { color: colors.foreground }]}>{"‹"}</Text>
      </View>
      <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginBottom: 28,
    paddingVertical: 4,
    paddingRight: 8,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 26,
    lineHeight: 30,
    marginTop: -2,
  },
  label: {
    fontSize: 15,
  },
});
