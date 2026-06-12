import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { useGetCycleDashboard, useGetCycleLogs } from "@workspace/api-client-react";
import { LogPeriodModal } from "@/components/LogPeriodModal";
import { SymptomsModal } from "@/components/SymptomsModal";
import { NotificationsModal } from "@/components/NotificationsModal";

const PHASE_COLORS: Record<string, string> = {
  menstrual: "#E96C8A",
  follicular: "#A8D8B9",
  ovulation: "#2FB7A3",
  luteal: "#B39CD0",
  unknown: "#E5E3EA",
};

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isInRange(year: number, month: number, day: number, startStr?: string | null, endStr?: string | null): boolean {
  if (!startStr || !endStr) return false;
  const date = new Date(year, month, day).getTime();
  return date >= parseLocalDate(startStr).getTime() && date <= parseLocalDate(endStr).getTime();
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: dashboard, isLoading } = useGetCycleDashboard();
  const { data: logs } = useGetCycleLogs();

  const today = new Date();
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSymptomsModal, setShowSymptomsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [calViewYear, setCalViewYear] = useState(today.getFullYear());
  const [calViewMonth, setCalViewMonth] = useState(today.getMonth());

  const phase = dashboard?.currentPhase ?? "unknown";
  const phaseColor = PHASE_COLORS[phase] ?? colors.border;

  const PHASE_LABELS: Record<string, string> = {
    menstrual: t("phaseMenstrual"),
    follicular: t("phaseFollicular"),
    ovulation: t("phaseOvulation"),
    luteal: t("phaseLuteal"),
    unknown: t("phaseUnknown"),
  };

  const MONTH_NAMES = [
    t("monthJan"), t("monthFeb"), t("monthMar"), t("monthApr"),
    t("monthMay"), t("monthJun"), t("monthJul"), t("monthAug"),
    t("monthSep"), t("monthOct"), t("monthNov"), t("monthDec"),
  ];

  const firstWeekday = new Date(calViewYear, calViewMonth, 1).getDay();
  const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
  const calendarDays: (number | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Use the profile's lastPeriodDate (which is updated by the server when a log is submitted)
  // This is authoritative and reflects the most recently submitted period start date
  const lastPeriodDateIso = dashboard?.lastPeriodDate ?? null;
  const latestLogDateObj = lastPeriodDateIso ? parseLocalDate(lastPeriodDateIso) : null;

  const nextPeriodStart = dashboard?.nextPeriodDate ?? null;
  const periodDur = dashboard?.periodDuration ?? 5;
  const currentPeriodStart =
    dashboard?.currentPhase === "menstrual" && dashboard.cycleDay != null
      ? (() => {
          const d = new Date(today);
          d.setDate(d.getDate() - (dashboard.cycleDay - 1));
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })()
      : null;
  const currentPeriodEnd = currentPeriodStart
    ? (() => {
        const d = parseLocalDate(currentPeriodStart);
        d.setDate(d.getDate() + periodDur - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })()
    : null;
  const nextPeriodEnd = nextPeriodStart
    ? (() => {
        const d = parseLocalDate(nextPeriodStart);
        d.setDate(d.getDate() + periodDur - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })()
    : null;
  const periodStart = currentPeriodStart ?? nextPeriodStart;
  const periodEnd = currentPeriodEnd ?? nextPeriodEnd;

  function prevMonth() {
    if (calViewMonth === 0) { setCalViewMonth(11); setCalViewYear(y => y - 1); }
    else setCalViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (calViewMonth === 11) { setCalViewMonth(0); setCalViewYear(y => y + 1); }
    else setCalViewMonth(m => m + 1);
  }

  const hour = today.getHours();
  const greeting = hour < 12 ? t("goodMorning") : hour < 17 ? t("goodAfternoon") : t("goodEvening");

  const QUICK_ACTIONS = [
    { icon: "droplet",  labelKey: "logPeriod",  color: colors.primary,    onPress: () => setShowLogModal(true) },
    { icon: "zap",      labelKey: "symptoms",   color: colors.secondary,  onPress: () => setShowSymptomsModal(true) },
    { icon: "edit-2",   labelKey: "updateFlow", color: "#B39CD0",         onPress: () => setShowLogModal(true) },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {greeting}
            </Text>
            <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {user?.name?.split(" ")[0] ?? "there"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.card, borderRadius: colors.radius * 0.75 }]}
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.8}
          >
            <Feather name="bell" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Cycle phase card */}
        {isLoading ? (
          <View style={[styles.cycleCard, { backgroundColor: colors.primary + "15", borderRadius: colors.radius }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View
            style={[
              styles.cycleCard,
              {
                backgroundColor: phaseColor + "18",
                borderRadius: colors.radius,
                borderLeftWidth: 4,
                borderLeftColor: phaseColor,
              },
            ]}
          >
            <View style={styles.cycleCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.phaseLabel, { color: phaseColor, fontFamily: "Inter_600SemiBold" }]}>
                  {PHASE_LABELS[phase]}
                </Text>
                {dashboard?.daysUntilNextPeriod != null && (
                  <Text style={[styles.nextPeriod, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    {t("nextPeriodIn", {
                      n: dashboard.daysUntilNextPeriod,
                      unit: dashboard.daysUntilNextPeriod === 1 ? t("day") : t("days"),
                    })}
                  </Text>
                )}
                {dashboard?.cycleDay != null && (
                  <Text style={[styles.cycleDay, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {t("dayOfCycle", { n: dashboard.cycleDay })}
                  </Text>
                )}
              </View>
              <View style={[styles.phaseCircle, { backgroundColor: phaseColor }]}>
                <Feather name="activity" size={22} color="#fff" />
              </View>
            </View>

            {dashboard?.fertileWindowStart && (
              <View style={[styles.fertileBar, { backgroundColor: colors.secondary + "20" }]}>
                <Feather name="sun" size={13} color={colors.secondary} />
                <Text style={[styles.fertileText, { color: colors.secondary, fontFamily: "Inter_400Regular" }]}>
                  {t("fertileWindow")}{" "}
                  {parseLocalDate(dashboard.fertileWindowStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {" – "}
                  {parseLocalDate(dashboard.fertileWindowEnd!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Calendar card */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <View style={styles.calHeader}>
            <TouchableOpacity
              onPress={prevMonth}
              style={[styles.calNavBtn, { backgroundColor: colors.muted, borderRadius: 10 }]}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={18} color={colors.foreground} />
            </TouchableOpacity>

            <Text style={[styles.calMonth, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {MONTH_NAMES[calViewMonth]} {calViewYear}
            </Text>

            <TouchableOpacity
              onPress={nextMonth}
              style={[styles.calNavBtn, { backgroundColor: colors.muted, borderRadius: 10 }]}
              activeOpacity={0.7}
            >
              <Feather name="chevron-right" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>


          <View style={styles.weekRow}>
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <Text key={i} style={[styles.weekDay, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>{d}</Text>
            ))}
          </View>

          <View style={[styles.calDivider, { backgroundColor: colors.border }]} />

          <View style={styles.daysGrid}>
            {calendarDays.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.dayCell} />;

              const isToday =
                day === today.getDate() &&
                calViewMonth === today.getMonth() &&
                calViewYear === today.getFullYear();

              const isNextPeriod = isInRange(calViewYear, calViewMonth, day, periodStart, periodEnd);
              const isFertile = isInRange(
                calViewYear, calViewMonth, day,
                dashboard?.fertileWindowStart,
                dashboard?.fertileWindowEnd
              );
              const isLastPeriodDay =
                latestLogDateObj !== null &&
                day === latestLogDateObj.getDate() &&
                calViewMonth === latestLogDateObj.getMonth() &&
                calViewYear === latestLogDateObj.getFullYear();

              let bgColor: string | undefined;
              let borderColor: string | undefined;
              let textColor = colors.foreground;

              if (isToday) {
                bgColor = colors.primary;
                textColor = "#fff";
              } else if (isLastPeriodDay) {
                // Deep green highlight for the most recent logged period only
                bgColor = colors.secondary + "40";
                borderColor = colors.secondary;
                textColor = colors.secondary;
              } else if (isNextPeriod) {
                bgColor = colors.primary + "22";
                borderColor = colors.primary;
                textColor = colors.primary;
              } else if (isFertile) {
                bgColor = colors.secondary + "25";
                textColor = colors.secondary;
              }

              return (
                <View key={`day-${calViewMonth}-${day}`} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayInner,
                      bgColor ? { backgroundColor: bgColor, borderRadius: 20 } : undefined,
                      borderColor ? { borderWidth: 1.5, borderColor, borderRadius: 20 } : undefined,
                    ]}
                  >
                    <Text style={[styles.dayText, { color: textColor, fontFamily: isToday || isNextPeriod ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{t("legendToday")}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary + "25", borderWidth: 1.5, borderColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{t("legendNextPeriod")}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.secondary + "30" }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{t("legendFertile")}</Text>
            </View>
          </View>
        </View>

        {/* Quick log */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {t("logToday")}
        </Text>
        <View style={styles.quickLog}>
          {QUICK_ACTIONS.map((btn, i) => (
            <TouchableOpacity
              key={i}
              onPress={btn.onPress}
              style={[styles.logBtn, { backgroundColor: btn.color + "15", borderRadius: colors.radius * 0.75 }]}
              activeOpacity={0.75}
            >
              <Feather name={btn.icon as any} size={20} color={btn.color} />
              <Text style={[styles.logBtnText, { color: btn.color, fontFamily: "Inter_500Medium" }]}>
                {t(btn.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Support card */}
        <View style={[styles.supportCard, { backgroundColor: colors.secondary + "12", borderRadius: colors.radius }]}>
          <View style={styles.supportCardContent}>
            <Feather name="message-circle" size={22} color={colors.secondary} />
            <View>
              <Text style={[styles.supportTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {t("needHelp")}
              </Text>
              <Text style={[styles.supportSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("talkToHealthWorker")}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.supportBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius * 0.5 }]}
            onPress={() => router.push("/(tabs)/support")}
            activeOpacity={0.8}
          >
            <Text style={[styles.supportBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>{t("open")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LogPeriodModal visible={showLogModal} onClose={() => setShowLogModal(false)} />
      <SymptomsModal visible={showSymptomsModal} onClose={() => setShowSymptomsModal(false)} />
      <NotificationsModal visible={showNotifications} onClose={() => setShowNotifications(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  greeting: { fontSize: 13 },
  name: { fontSize: 24, marginTop: 2 },
  notifBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cycleCard: { padding: 20, marginBottom: 16 },
  cycleCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  phaseLabel: { fontSize: 12, marginBottom: 4 },
  nextPeriod: { fontSize: 20, marginBottom: 2 },
  cycleDay: { fontSize: 13 },
  phaseCircle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  fertileBar: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, padding: 10, borderRadius: 8 },
  fertileText: { fontSize: 12 },
  calendarCard: { padding: 16, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  calNavBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  calMonth: { fontSize: 15 },
  calDivider: { height: 1, marginBottom: 8 },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekDay: { flex: 1, textAlign: "center", fontSize: 11 },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayInner: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 12 },
  legend: { flexDirection: "row", gap: 16, marginTop: 12, justifyContent: "center", flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  lastPeriodLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 17, marginBottom: 12 },
  quickLog: { flexDirection: "row", gap: 10, marginBottom: 24 },
  logBtn: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 6 },
  logBtnText: { fontSize: 12 },
  supportCard: { padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  supportCardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  supportTitle: { fontSize: 15 },
  supportSub: { fontSize: 12, marginTop: 1 },
  supportBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  supportBtnText: { fontSize: 13 },
});
