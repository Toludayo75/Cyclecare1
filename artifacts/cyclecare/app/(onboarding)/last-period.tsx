import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_SIZE = Math.floor(Math.min((SCREEN_WIDTH - 48 - 32) / 7, 44));

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function LastPeriodScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const MONTHS = [
    t("monthJan"), t("monthFeb"), t("monthMar"), t("monthApr"),
    t("monthMay"), t("monthJun"), t("monthJul"), t("monthAug"),
    t("monthSep"), t("monthOct"), t("monthNov"), t("monthDec"),
  ];

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    const now = new Date();
    if (viewYear > now.getFullYear()) return;
    if (viewYear === now.getFullYear() && viewMonth >= now.getMonth()) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const isAtMaxMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function isFuture(day: number) {
    return new Date(viewYear, viewMonth, day) > today;
  }

  function isToday(day: number) {
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      day === today.getDate()
    );
  }

  function isSelected(day: number) {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  }

  async function handleContinue() {
    if (!selectedDate) return;
    const dateStr = selectedDate.toISOString().split("T")[0];
    await AsyncStorage.setItem("onboarding_last_period", dateStr);
    router.push("/(onboarding)/cycle-length");
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressBar}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                { backgroundColor: i === 0 ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.question, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {t("lastPeriodTitle")}
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {t("lastPeriodHint")}
        </Text>

        <View style={[styles.calCard, { backgroundColor: colors.card, borderRadius: 20 }]}>
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={prevMonth} style={[styles.navBtn, { backgroundColor: colors.muted, borderRadius: 12 }]}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </TouchableOpacity>

            <Text style={[styles.monthLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              onPress={nextMonth}
              style={[
                styles.navBtn,
                {
                  backgroundColor: isAtMaxMonth ? colors.border + "40" : colors.muted,
                  borderRadius: 12,
                  opacity: isAtMaxMonth ? 0.4 : 1,
                },
              ]}
              disabled={isAtMaxMonth}
            >
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((d, idx) => (
              <View key={idx} style={[styles.weekCell, { width: CELL_SIZE }]}>
                <Text style={[styles.weekLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.daysGrid}>
            {cells.map((day, i) => {
              if (!day) {
                return <View key={`empty-${i}`} style={[styles.dayCell, { width: CELL_SIZE, height: CELL_SIZE }]} />;
              }

              const sel = isSelected(day);
              const tod = isToday(day);
              const fut = isFuture(day);

              return (
                <TouchableOpacity
                  key={`day-${day}-${i}`}
                  style={[styles.dayCell, { width: CELL_SIZE, height: CELL_SIZE }]}
                  onPress={() => !fut && setSelectedDate(new Date(viewYear, viewMonth, day))}
                  disabled={fut}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayInner,
                      { width: CELL_SIZE - 4, height: CELL_SIZE - 4, borderRadius: (CELL_SIZE - 4) / 2 },
                      sel && { backgroundColor: colors.primary },
                      !sel && tod && { borderWidth: 2, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          fontFamily: sel || tod ? "Inter_600SemiBold" : "Inter_400Regular",
                          color: sel
                            ? "#fff"
                            : fut
                            ? colors.border
                            : tod
                            ? colors.primary
                            : colors.foreground,
                          fontSize: 14,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedDate ? (
          <View style={[styles.selectedBanner, { backgroundColor: colors.primary + "15", borderRadius: 14 }]}>
            <Feather name="check-circle" size={18} color={colors.primary} />
            <Text style={[styles.selectedText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              {selectedDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        ) : (
          <Text style={[styles.noSelText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("lastPeriodNote")}
          </Text>
        )}

        <Button
          label={t("continue")}
          onPress={handleContinue}
          disabled={!selectedDate}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  progressBar: { flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 28 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  question: { fontSize: 26, lineHeight: 34, marginBottom: 6 },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  calCard: {
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  navBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { fontSize: 17 },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekCell: { alignItems: "center" },
  weekLabel: { fontSize: 12 },
  divider: { height: 1, marginBottom: 10 },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    rowGap: 4,
  },
  dayCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  dayInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {},
  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectedText: { fontSize: 15 },
  noSelText: { textAlign: "center", fontSize: 13, marginBottom: 16 },
});
