import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    Promise.resolve(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => undefined);
    onPress();
  };

  const containerStyle: ViewStyle = {
    borderRadius: colors.radius,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? "100%" : undefined,
    ...(variant === "primary" && { backgroundColor: colors.primary }),
    ...(variant === "secondary" && { backgroundColor: colors.secondary }),
    ...(variant === "outline" && {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.primary,
    }),
    ...(variant === "ghost" && { backgroundColor: "transparent" }),
  };

  const labelStyle: TextStyle = {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    ...(variant === "primary" && { color: colors.primaryForeground }),
    ...(variant === "secondary" && { color: colors.secondaryForeground }),
    ...(variant === "outline" && { color: colors.primary }),
    ...(variant === "ghost" && { color: colors.foreground }),
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "secondary" ? "#fff" : colors.primary}
          size="small"
        />
      ) : (
        <Text style={[labelStyle, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({});
