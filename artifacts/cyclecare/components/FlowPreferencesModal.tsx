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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { useGetCycleProfile, useSaveCycleProfile } from "@workspace/api-client-react";

type FlowType = "light" | "medium" | "heavy";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const FLOW_OPTIONS: { type: FlowType; labelKey: string; descKey: string; icon: string }[] = [
  { type: "light", labelKey: "flowLight", descKey: "flowLightDesc", icon: "droplet" },
  { type: "medium", labelKey: "flowMedium", descKey: "flowMediumDesc", icon: "droplet" },
  { type: "heavy", labelKey: "flowHeavy", descKey: "flowHeavyDesc", icon: "droplet" },
];

export function FlowPreferencesModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { data: profile, isLoading: profileLoading } = useGetCycleProfile();
  const { mutateAsync, isPending } = useSaveCycleProfile();

  const [selected, setSelected] = useState<FlowType>("medium");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setSelected(profile.flowType as FlowType);
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
          cycleLength: profile.cycleLength,
          periodDuration: profile.periodDuration,
          flowType: selected,
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
                {t("flowPreferencesTitle")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("flowPreferencesDesc")}
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
              Complete onboarding to set flow preferences.
            </Text>
          ) : (
            <View>
              {FLOW_OPTIONS.map((opt) => {
                const isActive = selected === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.option,
                      {
                        backgroundColor: isActive ? colors.primary + "12" : colors.card,
                        borderColor: isActive ? colors.primary : colors.border,
                        borderRadius: colors.radius,
                        marginBottom: 10,
                      },
                    ]}
                    onPress={() => setSelected(opt.type)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionDot, { backgroundColor: isActive ? colors.primary : colors.muted }]}>
                      <Feather name="droplet" size={14} color={isActive ? "#fff" : colors.mutedForeground} />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, { color: isActive ? colors.primary : colors.foreground, fontFamily: isActive ? "Inter_600SemiBold" : "Inter_500Medium" }]}>
                        {t(opt.labelKey)}
                      </Text>
                      <Text style={[styles.optionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {t(opt.descKey)}
                      </Text>
                    </View>
                    {isActive && <Feather name="check-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}

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
                style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: 14, opacity: isPending ? 0.6 : 1, marginTop: 16 }]}
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
            </View>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 20, marginBottom: 2 },
  subtitle: { fontSize: 13 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginTop: 2 },
  loadingBox: { paddingVertical: 40, alignItems: "center" },
  noProfile: { textAlign: "center", paddingVertical: 32, fontSize: 14 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderWidth: 1.5 },
  optionDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15 },
  optionDesc: { fontSize: 12, marginTop: 2 },
  feedback: { fontSize: 13, marginTop: 8 },
  saveBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 15, marginBottom: 4 },
  saveBtnText: { color: "#fff", fontSize: 16 },
});
