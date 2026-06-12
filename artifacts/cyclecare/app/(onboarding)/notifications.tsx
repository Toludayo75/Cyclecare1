// import React, { useState } from "react";
// import { View, Text, StyleSheet, Platform, Alert } from "react-native";
// import { router } from "expo-router";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { Feather } from "@/components/Icon";
// import { useColors } from "@/hooks/useColors";
// import { useTranslation } from "@/context/LanguageContext";
// import { getApiUrl } from "@/utils/api";
// import { Button } from "@/components/Button";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useAuth } from "@/context/AuthContext";

// export default function NotificationsScreen() {
//   const colors = useColors();
//   const insets = useSafeAreaInsets();
//   const { token, updateUser, user } = useAuth();
//   const { t } = useTranslation();
//   const [loading, setLoading] = useState(false);

//   const BENEFITS = [
//     "benefitPeriodReminders",
//     "benefitFertileAlerts",
//     "benefitPickupUpdates",
//     "benefitHealthReplies",
//   ];

//   async function saveAndContinue(enabled: boolean) {
//     setLoading(true);
//     try {
//       const [lastPeriodDate, cycleLength, periodDuration, flowType] = await Promise.all([
//         AsyncStorage.getItem("onboarding_last_period"),
//         AsyncStorage.getItem("onboarding_cycle_length"),
//         AsyncStorage.getItem("onboarding_period_duration"),
//         AsyncStorage.getItem("onboarding_flow_type"),
//       ]);

//       const response = await fetch(
//         `${getApiUrl("/api/cycle/profile")}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//           body: JSON.stringify({
//             lastPeriodDate: lastPeriodDate ?? new Date().toISOString().split("T")[0],
//             cycleLength: parseInt(cycleLength ?? "28"),
//             periodDuration: parseInt(periodDuration ?? "5"),
//             flowType: flowType ?? "medium",
//             notificationsEnabled: enabled,
//           }),
//         }
//       );

//       if (!response.ok) {
//         const d = await response.json();
//         Alert.alert(t("error"), d.error ?? "Could not save profile");
//         return;
//       }

//       if (user) {
//         await updateUser({ ...user, hasCompletedOnboarding: true });
//       }

//       await Promise.all([
//         AsyncStorage.removeItem("onboarding_last_period"),
//         AsyncStorage.removeItem("onboarding_cycle_length"),
//         AsyncStorage.removeItem("onboarding_period_duration"),
//         AsyncStorage.removeItem("onboarding_flow_type"),
//       ]);

//       router.replace("/(onboarding)/complete");
//     } catch {
//       Alert.alert(t("error"), t("networkError"));
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <View
//       style={[
//         styles.container,
//         {
//           backgroundColor: colors.background,
//           paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
//           paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
//         },
//       ]}
//     >
//       <View style={styles.content}>
//         <View style={[styles.iconCircle, { backgroundColor: colors.secondary + "15" }]}>
//           <Feather name="bell" size={40} color={colors.secondary} />
//         </View>

//         <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
//           {t("notificationsTitle")}
//         </Text>
//         <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
//           {t("notificationsSubtitle")}
//         </Text>

//         <View style={styles.benefits}>
//           {BENEFITS.map((key, i) => (
//             <View key={i} style={styles.benefitRow}>
//               <Feather name="check" size={16} color={colors.secondary} />
//               <Text style={[styles.benefitText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
//                 {t(key)}
//               </Text>
//             </View>
//           ))}
//         </View>
//       </View>

//       <View style={[styles.footer, { paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }]}>
//         <Button
//           label={t("allowNotifications")}
//           onPress={() => saveAndContinue(true)}
//           loading={loading}
//           style={{ marginBottom: 12 }}
//         />
//         <Button
//           label={t("maybeLater")}
//           onPress={() => saveAndContinue(false)}
//           variant="ghost"
//           disabled={loading}
//         />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
//   iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 32 },
//   title: { fontSize: 26, textAlign: "center", marginBottom: 12 },
//   subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 36 },
//   benefits: { gap: 14, width: "100%" },
//   benefitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
//   benefitText: { fontSize: 15 },
//   footer: {},
// });
