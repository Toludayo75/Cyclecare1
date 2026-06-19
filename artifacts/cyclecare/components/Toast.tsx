import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  message: string;
  onClose?: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 4000 }: Props) {
  const colors = useColors();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }),
      ]).start(() => onClose && onClose());
    }, duration);

    return () => clearTimeout(t);
  }, [duration, onClose, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onClose} style={[styles.toast, { backgroundColor: colors.primary }] }>
        <Text numberOfLines={2} style={[styles.text, { color: colors.primaryForeground }]}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    minWidth: Math.min(640, width - 48),
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
  },
});
