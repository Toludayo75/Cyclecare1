import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";

type Severity = "mild" | "moderate" | "severe";

const SYMPTOMS = [
  { key: "symptomCramps",          icon: "zap" },
  { key: "symptomBackPain",        icon: "activity" },
  { key: "symptomHeadache",        icon: "alert-circle" },
  { key: "symptomFatigue",         icon: "battery" },
  { key: "symptomBloating",        icon: "circle" },
  { key: "symptomMoodSwings",      icon: "sun" },
  { key: "symptomAnxiety",         icon: "wind" },
  { key: "symptomAcne",            icon: "droplet" },
  { key: "symptomBreastTenderness",icon: "heart" },
  { key: "symptomNausea",          icon: "frown" },
  { key: "symptomSpotting",        icon: "droplets" as any },
  { key: "symptomClots",           icon: "alert-triangle" },
];

function todayKey() {
  const d = new Date();
  return `cyclecare_symptoms_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Saved { symptoms: string[]; severity: Severity }

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SymptomsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [severity, setSeverity] = useState<Severity>("mild");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    AsyncStorage.getItem(todayKey()).then(raw => {
      if (!raw) { setSelected(new Set()); setSeverity("mild"); return; }
      try {
        const saved: Saved = JSON.parse(raw);
        setSelected(new Set(saved.symptoms));
        setSeverity(saved.severity ?? "mild");
      } catch { /* ignore */ }
    });
  }, [visible]);

  function toggle(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleSave() {
    if (selected.size === 0) {
      Alert.alert("", t("noSymptomsSelected"));
      return;
    }
    setSaving(true);
    try {
      const data: Saved = { symptoms: Array.from(selected), severity };
      await AsyncStorage.setItem(todayKey(), JSON.stringify(data));
      Alert.alert("", t("symptomsLogged"), [{ text: "OK", onPress: onClose }]);
    } finally {
      setSaving(false);
    }
  }

  const SEVERITIES: { value: Severity; labelKey: string }[] = [
    { value: "mild",     labelKey: "severityMild" },
    { value: "moderate", labelKey: "severityModerate" },
    { value: "severe",   labelKey: "severitySevere" },
  ];

  const SEVERITY_COLORS: Record<Severity, string> = {
    mild:     "#2FB7A3",
    moderate: "#F59E0B",
    severe:   "#E96C8A",
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {t("logSymptomsTitle")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("logSymptomsSubtitle")}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <View style={styles.grid}>
              {SYMPTOMS.map(s => {
                const isSelected = selected.has(s.key);
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => toggle(s.key)}
                    style={[
                      styles.symptomChip,
                      {
                        backgroundColor: isSelected ? colors.primary + "18" : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: colors.radius * 0.75,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Feather name={s.icon as any} size={15} color={isSelected ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.chipLabel, { color: isSelected ? colors.primary : colors.foreground, fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                      {t(s.key)}
                    </Text>
                    {isSelected && (
                      <View style={[styles.checkDot, { backgroundColor: colors.primary }]}>
                        <Feather name="check" size={9} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              {t("severityLabel").toUpperCase()}
            </Text>
            <View style={styles.severityRow}>
              {SEVERITIES.map(sv => {
                const active = severity === sv.value;
                const col = SEVERITY_COLORS[sv.value];
                return (
                  <TouchableOpacity
                    key={sv.value}
                    onPress={() => setSeverity(sv.value)}
                    style={[
                      styles.severityBtn,
                      {
                        backgroundColor: active ? col + "18" : colors.card,
                        borderColor: active ? col : colors.border,
                        borderRadius: colors.radius * 0.75,
                        flex: 1,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.severityLabel, { color: active ? col : colors.mutedForeground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                      {t(sv.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>
              {t("saveSymptoms")}
              {selected.size > 0 ? ` · ${selected.size}` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20, maxHeight: "90%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 20, marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginTop: 2 },
  scroll: { flexGrow: 0 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  symptomChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1.5, width: "47%",
  },
  chipLabel: { fontSize: 13, flex: 1 },
  checkDot: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 10 },
  severityRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  severityBtn: { alignItems: "center", paddingVertical: 12, borderWidth: 1.5 },
  severityLabel: { fontSize: 14 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, marginBottom: 8 },
  saveBtnText: { color: "#fff", fontSize: 16 },
});
