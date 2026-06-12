import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCycleLog,
  getGetCycleLogsQueryKey,
  getGetCycleDashboardQueryKey,
  getGetCycleProfileQueryKey,
} from "@workspace/api-client-react";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const WEEK_DAYS = ["S","M","T","W","T","F","S"];

type FlowIntensity = "light" | "medium" | "heavy";

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Props = { visible: boolean; onClose: () => void };

export function LogPeriodModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateCycleLog();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date(today));
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [flow, setFlow] = useState<FlowIntensity>("medium");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  const [gridWidth, setGridWidth] = useState(0);
  const CELL = gridWidth > 0 ? Math.floor(gridWidth / 7) : 0;
  const innerSize = CELL > 6 ? CELL - 6 : CELL;

  const firstWeekday = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calYear === today.getFullYear() && calMonth >= today.getMonth()) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }
  const atMaxMonth = calYear === today.getFullYear() && calMonth === today.getMonth();

  function isToday(day: number) {
    return calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
  }
  function isSelected(day: number) {
    return selectedDate.getFullYear() === calYear &&
           selectedDate.getMonth() === calMonth &&
           selectedDate.getDate() === day;
  }
  function isFuture(day: number) {
    return new Date(calYear, calMonth, day) > today;
  }

  function toggleSymptom(sym: string) {
    setSelectedSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  }

  function reset() {
    setSelectedDate(new Date(today));
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
    setFlow("medium");
    setSelectedSymptoms([]);
    setNotes("");
    setSuccess(false);
  }

  async function handleSubmit() {
    const iso = toISO(selectedDate);
    const profileKey = getGetCycleProfileQueryKey();
    const dashboardKey = getGetCycleDashboardQueryKey();
    const logsKey = getGetCycleLogsQueryKey();

    const prevProfile = queryClient.getQueryData(profileKey);
    const prevDashboard = queryClient.getQueryData(dashboardKey);
    const prevLogs = queryClient.getQueryData(logsKey);

    // optimistic updates: set lastPeriodDate and prepend a temporary log
    try {
      queryClient.setQueryData(profileKey, (old: any) => {
        if (!old) return old;
        return { ...old, lastPeriodDate: iso };
      });
      queryClient.setQueryData(dashboardKey, (old: any) => {
        if (!old) return old;
        return { ...old, lastPeriodDate: iso };
      });
      queryClient.setQueryData(logsKey, (old: any) => {
        const tmp = { id: -Date.now(), user_id: undefined, start_date: iso, end_date: null, flow_intensity: flow, symptoms: selectedSymptoms, notes: notes.trim() || null, created_at: new Date().toISOString() };
        if (!old) return [tmp];
        if (Array.isArray(old)) return [tmp, ...old];
        if (old && Array.isArray(old.items)) return { ...old, items: [tmp, ...old.items] };
        return old;
      });

      await mutateAsync({
        data: {
          startDate: iso,
          flowIntensity: flow,
          symptoms: selectedSymptoms,
          notes: notes.trim() || null,
        },
      });

      // ensure fresh data
      await queryClient.invalidateQueries({ queryKey: logsKey });
      await queryClient.invalidateQueries({ queryKey: dashboardKey });
      await queryClient.invalidateQueries({ queryKey: profileKey });
      setSuccess(true);
    } catch (err) {
      // rollback optimistic changes
      try {
        queryClient.setQueryData(profileKey, prevProfile as any);
        queryClient.setQueryData(dashboardKey, prevDashboard as any);
        queryClient.setQueryData(logsKey, prevLogs as any);
      } catch (_) {
        // ignore rollback errors
      }
    }
  }

  function handleClose() { reset(); onClose(); }

  function onGridLayout(e: LayoutChangeEvent) {
    setGridWidth(e.nativeEvent.layout.width);
  }

  const FLOW_OPTIONS: { value: FlowIntensity; labelKey: string; descKey: string; dots: number }[] = [
    { value: "light",  labelKey: "flowLight",         descKey: "flowLightModalDesc",  dots: 1 },
    { value: "medium", labelKey: "flowMedium",        descKey: "flowMediumModalDesc", dots: 2 },
    { value: "heavy",  labelKey: "flowHeavy",         descKey: "flowHeavyModalDesc",  dots: 3 },
  ];

  const SYMPTOM_KEYS = [
    "symptomCramps", "symptomBackPain", "symptomHeadache", "symptomFatigue",
    "symptomBloating", "symptomMoodSwings", "symptomAnxiety", "symptomAcne",
    "symptomBreastTenderness", "symptomNausea", "symptomSpotting", "symptomClots",
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.outer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {t("logPeriodTitle")}
            </Text>
            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={styles.successContainer}>
              <View style={[styles.successCircle, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="check-circle" size={52} color={colors.primary} />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {t("periodLogged")}
              </Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("cycleDataUpdated")}
              </Text>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleClose}>
                <Text style={[styles.doneBtnText, { fontFamily: "Inter_600SemiBold" }]}>{t("done")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── Calendar ── */}
              <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {t("startDate")}
              </Text>

              <View style={[styles.calCard, { backgroundColor: colors.card, borderRadius: 16 }]}>
                <View style={styles.calMonthRow}>
                  <TouchableOpacity
                    onPress={prevMonth}
                    style={[styles.calNavBtn, { backgroundColor: colors.muted, borderRadius: 10 }]}
                  >
                    <Feather name="chevron-left" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={[styles.calMonthLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    {MONTH_NAMES[calMonth]} {calYear}
                  </Text>
                  <TouchableOpacity
                    onPress={nextMonth}
                    disabled={atMaxMonth}
                    style={[styles.calNavBtn, { backgroundColor: colors.muted, borderRadius: 10, opacity: atMaxMonth ? 0.3 : 1 }]}
                  >
                    <Feather name="chevron-right" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                <View onLayout={onGridLayout} style={styles.calGrid}>
                  <View style={styles.gridRow}>
                    {WEEK_DAYS.map((d, i) => (
                      <View key={i} style={{ width: CELL, alignItems: "center", paddingVertical: 4 }}>
                        <Text style={[styles.weekLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                          {d}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.calDivider, { backgroundColor: colors.border }]} />

                  <View style={styles.gridRow}>
                    {cells.map((day, i) => {
                      if (!day) {
                        return <View key={`e-${i}`} style={{ width: CELL, height: CELL }} />;
                      }
                      const sel = isSelected(day);
                      const tod = isToday(day);
                      const fut = isFuture(day);
                      return (
                        <TouchableOpacity
                          key={`d-${calMonth}-${day}`}
                          style={{ width: CELL, height: CELL, alignItems: "center", justifyContent: "center" }}
                          onPress={() => !fut && setSelectedDate(new Date(calYear, calMonth, day))}
                          disabled={fut}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.dayInner,
                            { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
                            sel && { backgroundColor: colors.primary },
                            !sel && tod && { borderWidth: 2, borderColor: colors.primary },
                          ]}>
                            <Text style={[
                              styles.dayText,
                              {
                                fontFamily: sel || tod ? "Inter_600SemiBold" : "Inter_400Regular",
                                color: sel ? "#fff" : fut ? colors.border : tod ? colors.primary : colors.foreground,
                              },
                            ]}>
                              {day}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={[styles.selectedPill, { backgroundColor: colors.primary + "12", borderRadius: 10 }]}>
                <Feather name="calendar" size={14} color={colors.primary} />
                <Text style={[styles.selectedPillText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  {selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </Text>
              </View>

              {/* ── Flow intensity ── */}
              <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 20 }]}>
                {t("flowIntensity")}
              </Text>
              <View style={styles.flowRow}>
                {FLOW_OPTIONS.map((opt) => {
                  const selected = flow === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setFlow(opt.value)}
                      activeOpacity={0.8}
                      style={[
                        styles.flowCard,
                        {
                          backgroundColor: selected ? colors.primary + "18" : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                          borderWidth: selected ? 2 : 1,
                          borderRadius: 14,
                        },
                      ]}
                    >
                      <View style={styles.flowDots}>
                        {[0, 1, 2].map(i => (
                          <View key={i} style={[styles.flowDot, {
                            backgroundColor: i < opt.dots
                              ? (selected ? colors.primary : colors.mutedForeground)
                              : colors.border,
                          }]} />
                        ))}
                      </View>
                      <Text style={[styles.flowLabel, { color: selected ? colors.primary : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                        {t(opt.labelKey)}
                      </Text>
                      <Text style={[styles.flowDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {t(opt.descKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Symptoms ── */}
              <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 20 }]}>
                {t("symptomsSection")}{" "}
                <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>({t("optional")})</Text>
              </Text>
              <View style={styles.symptomsGrid}>
                {SYMPTOM_KEYS.map((key) => {
                  const label = t(key);
                  const sel = selectedSymptoms.includes(label);
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => toggleSymptom(label)}
                      activeOpacity={0.8}
                      style={[
                        styles.symptomChip,
                        {
                          backgroundColor: sel ? colors.primary : colors.card,
                          borderColor: sel ? colors.primary : colors.border,
                          borderRadius: 20,
                        },
                      ]}
                    >
                      <Text style={[styles.symptomText, { color: sel ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Notes ── */}
              <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 20 }]}>
                {t("notesSection")}{" "}
                <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>({t("optional")})</Text>
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    fontFamily: "Inter_400Regular",
                    borderRadius: 14,
                  },
                ]}
                placeholder={t("notesPlaceholder")}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />

              {/* ── Submit ── */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.primary, borderRadius: 14, opacity: isPending ? 0.7 : 1 },
                ]}
                onPress={handleSubmit}
                disabled={isPending}
                activeOpacity={0.85}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="droplet" size={18} color="#fff" />
                    <Text style={[styles.submitText, { fontFamily: "Inter_600SemiBold" }]}>{t("savePeriodLog")}</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 12 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 20 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  calCard: { padding: 12, marginBottom: 10 },
  calMonthRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
  },
  calNavBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  calMonthLabel: { fontSize: 15 },
  calGrid: { width: "100%" },
  gridRow: { flexDirection: "row", flexWrap: "wrap" },
  weekLabel: { fontSize: 11 },
  calDivider: { height: 1, marginBottom: 4 },
  dayInner: { alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 13 },
  selectedPill: {
    flexDirection: "row", alignItems: "center",
    gap: 8, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 4,
  },
  selectedPillText: { fontSize: 13 },
  flowRow: { flexDirection: "row", gap: 10 },
  flowCard: { flex: 1, padding: 12, alignItems: "center", gap: 6 },
  flowDots: { flexDirection: "row", gap: 4 },
  flowDot: { width: 8, height: 8, borderRadius: 4 },
  flowLabel: { fontSize: 13 },
  flowDesc: { fontSize: 10, textAlign: "center" },
  symptomsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  symptomChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  symptomText: { fontSize: 13 },
  notesInput: { borderWidth: 1, padding: 14, minHeight: 80, fontSize: 14 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, marginTop: 20,
  },
  submitText: { color: "#fff", fontSize: 16 },
  successContainer: { alignItems: "center", paddingVertical: 40, gap: 14 },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 22 },
  successSub: { fontSize: 14, textAlign: "center" },
  doneBtn: { marginTop: 12, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { color: "#fff", fontSize: 16 },
  sectionLabel: { fontSize: 14, marginBottom: 10 },
});
