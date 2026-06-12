import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { useGetCycleProfile, useSaveCycleProfile } from "@workspace/api-client-react";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function StepperRow({
  label,
  value,
  unit,
  min,
  max,
  onDecrement,
  onIncrement,
  colors,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[stepperStyles.row, { borderColor: colors.border }]}>
      <View style={stepperStyles.labelCol}>
        <Text style={[stepperStyles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
          {label}
        </Text>
        <Text style={[stepperStyles.range, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {min}–{max} {unit}
        </Text>
      </View>
      <View style={stepperStyles.controls}>
        <TouchableOpacity
          style={[stepperStyles.btn, { backgroundColor: colors.muted, opacity: value <= min ? 0.4 : 1 }]}
          onPress={onDecrement}
          disabled={value <= min}
          activeOpacity={0.7}
        >
          <Feather name="minus" size={16} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[stepperStyles.value, { color: colors.foreground, fontFamily: "Inter_700Bold", minWidth: 48, textAlign: "center" }]}>
          {value} {unit}
        </Text>
        <TouchableOpacity
          style={[stepperStyles.btn, { backgroundColor: colors.muted, opacity: value >= max ? 0.4 : 1 }]}
          onPress={onIncrement}
          disabled={value >= max}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelCol: { flex: 1 },
  label: { fontSize: 15 },
  range: { fontSize: 12, marginTop: 2 },
  controls: { flexDirection: "row", alignItems: "center", gap: 12 },
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 16 },
});

export function CyclePreferencesModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { data: profile, isLoading: profileLoading } = useGetCycleProfile();
  const { mutateAsync, isPending } = useSaveCycleProfile();

  const [cycleLength, setCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setCycleLength(profile.cycleLength);
      setPeriodDuration(profile.periodDuration);
      setError("");
      setSuccess(false);
    }
  }, [visible, profile]);

  async function handleSave() {
    if (!profile) return;
    setError("");
    try {
      await mutateAsync({
        data: {
          lastPeriodDate: profile.lastPeriodDate,
          cycleLength,
          periodDuration,
          flowType: profile.flowType,
          notificationsEnabled: profile.notificationsEnabled,
        },
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch {
      setError(t("preferencesFailed"));
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.outer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {t("cyclePreferencesTitle")}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {profileLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !profile ? (
            <Text style={[styles.noProfile, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Complete onboarding to set cycle preferences.
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <StepperRow
                label={t("cycleLengthLabel")}
                value={cycleLength}
                unit={t("days")}
                min={21}
                max={45}
                onDecrement={() => setCycleLength((v) => Math.max(21, v - 1))}
                onIncrement={() => setCycleLength((v) => Math.min(45, v + 1))}
                colors={colors}
              />
              <StepperRow
                label={t("periodDurationLabel")}
                value={periodDuration}
                unit={t("days")}
                min={1}
                max={10}
                onDecrement={() => setPeriodDuration((v) => Math.max(1, v - 1))}
                onIncrement={() => setPeriodDuration((v) => Math.min(10, v + 1))}
                colors={colors}
              />

              {!!error && (
                <Text style={[styles.feedback, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
                  {error}
                </Text>
              )}
              {success && (
                <Text style={[styles.feedback, { color: colors.secondary, fontFamily: "Inter_400Regular" }]}>
                  {t("preferencesUpdated")}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: 14, opacity: isPending ? 0.6 : 1, marginTop: 24 }]}
                onPress={handleSave}
                disabled={isPending}
                activeOpacity={0.85}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>{t("saveChanges")}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20, maxHeight: "85%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 20 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  loadingBox: { paddingVertical: 40, alignItems: "center" },
  noProfile: { textAlign: "center", paddingVertical: 32, fontSize: 14 },
  feedback: { fontSize: 13, marginTop: 12 },
  saveBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 15, marginBottom: 4 },
  saveBtnText: { color: "#fff", fontSize: 16 },
});
