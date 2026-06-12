import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import type { LangCode } from "@/constants/translations";
import { CashDonationModal } from "@/components/CashDonationModal";
import { EditProfileModal } from "@/components/EditProfileModal";
import { CyclePreferencesModal } from "@/components/CyclePreferencesModal";
import { FlowPreferencesModal } from "@/components/FlowPreferencesModal";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { AboutModal } from "@/components/AboutModal";
import { ContactSupportModal } from "@/components/ContactSupportModal";
import { ExportDataModal } from "@/components/ExportDataModal";

const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
];

const ANON_MODE_KEY = "cyclecare_anonymous_mode";

interface SettingRowProps {
  icon: string;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}

function SettingRow({ icon, label, onPress, right, colors, last }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={[
        styles.settingRow,
        !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + "12" }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_400Regular", flex: 1 }]}>
        {label}
      </Text>
      {right ?? <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCyclePrefs, setShowCyclePrefs] = useState(false);
  const [showFlowPrefs, setShowFlowPrefs] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showExportData, setShowExportData] = useState(false);

  const [periodReminders, setPeriodReminders] = useState(true);
  const [pickupUpdates, setPickupUpdates] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ANON_MODE_KEY).then((val) => {
      if (val === "true") setAnonymousMode(true);
    });
  }, []);

  async function toggleAnonymousMode() {
    try {
      const next = !anonymousMode;
      console.log("[AnonymousMode] Toggling:", { current: anonymousMode, next });
      
      setAnonymousMode(next);
      await AsyncStorage.setItem(ANON_MODE_KEY, String(next));
      
      console.log("[AnonymousMode] Saved to AsyncStorage:", next);
      console.log("[AnonymousMode] Alert titles:", {
        title: t("anonymousModeTitle"),
        msg: next ? t("anonymousModeEnabledMsg") : t("anonymousModeDisabledMsg"),
      });
      // Show an alert. Use `window.alert` on web for reliable behavior there.
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(`${t("anonymousModeTitle")}: ${next ? t("anonymousModeEnabledMsg") : t("anonymousModeDisabledMsg")}`);
      } else {
        Alert.alert(
          t("anonymousModeTitle"),
          next ? t("anonymousModeEnabledMsg") : t("anonymousModeDisabledMsg"),
        );
      }
    } catch (error) {
      console.error("[AnonymousMode] Error:", error);
      Alert.alert("Error", "Failed to update anonymous mode");
    }
  }

  async function handleLogout() {
    async function signOut() {
      try {
        await logout();
        router.replace("/(auth)/welcome");
      } catch (error) {
        console.error("Logout failed", error);
      }
    }

    if (Platform.OS === "web") {
      if (window.confirm(`${t("signOutConfirmTitle")}\n\n${t("signOutConfirmMsg")}`)) {
        await signOut();
      }
      return;
    }

    Alert.alert(t("signOutConfirmTitle"), t("signOutConfirmMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("signOut"),
        style: "destructive",
        onPress: signOut,
      },
    ]);
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "CC";

  const locationLine = [user?.city, user?.state].filter(Boolean).join(", ");

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
        {/* ── User card ── */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.initials, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {initials}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {user?.name ?? "—"}
            </Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {user?.email ?? user?.phone ?? "—"}
            </Text>
            {(locationLine || user?.age) ? (
              <Text style={[styles.userMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {[user?.age ? `Age ${user.age}` : null, locationLine].filter(Boolean).join(" · ")}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.muted, borderRadius: 20 }]}
            onPress={() => setShowEditProfile(true)}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={15} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* ── Personal details summary ── */}
        {(user?.address || user?.city || user?.state) ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              {t("personalDetails")}
            </Text>
            <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              {user?.address ? (
                <View style={[styles.detailRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <Feather name="map-pin" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.detailText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {[user.address, user.city, user.state].filter(Boolean).join(", ")}
                  </Text>
                </View>
              ) : null}
              {(user?.city || user?.state) && !user?.address ? (
                <View style={styles.detailRow}>
                  <Feather name="map-pin" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.detailText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {locationLine}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {/* ── Health settings ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          {t("healthSettings")}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow icon="sliders" label={t("cyclePreferences")} colors={colors} onPress={() => setShowCyclePrefs(true)} />
          <SettingRow icon="wind"    label={t("flowPreferences")}  colors={colors} onPress={() => setShowFlowPrefs(true)} last />
        </View>

        {/* ── Notifications ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          {t("notificationsSection")}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow
            icon="bell"
            label={t("periodReminders")}
            colors={colors}
            right={
              <Switch
                value={periodReminders}
                onValueChange={setPeriodReminders}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow
            icon="package"
            label={t("pickupUpdates")}
            colors={colors}
            last
            right={
              <Switch
                value={pickupUpdates}
                onValueChange={setPickupUpdates}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* ── Language ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          {t("languageSection")}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          {LANGUAGES.map((lang, i) => {
            const isActive = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.settingRow,
                  i < LANGUAGES.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  isActive && { backgroundColor: colors.primary + "08" },
                ]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.settingLabel,
                  { flex: 1, fontFamily: isActive ? "Inter_600SemiBold" : "Inter_400Regular" },
                  { color: isActive ? colors.primary : colors.foreground },
                ]}>
                  {lang.label}
                </Text>
                {isActive && <Feather name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Privacy & security ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          {t("privacySection")}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow icon="lock"    label={t("changePassword")} colors={colors} onPress={() => setShowChangePassword(true)} />
          <SettingRow
            icon="eye-off"
            label={t("anonymousMode")}
            colors={colors}
            right={
              <Switch
                value={anonymousMode}
                onValueChange={toggleAnonymousMode}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow icon="download" label={t("exportData")} colors={colors} onPress={() => setShowExportData(true)} last />
        </View>

        {/* ── Help ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          {t("helpSection")}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <SettingRow
            icon="help-circle"
            label={t("faq")}
            colors={colors}
            onPress={() => router.navigate("/(tabs)/support")}
          />
          <SettingRow icon="heart" label={t("donateCash")} colors={colors} onPress={() => setShowDonateModal(true)} />
          <SettingRow icon="mail" label={t("contactSupport")} colors={colors} onPress={() => setShowContact(true)} />
          <SettingRow icon="info" label={t("aboutCycleCare")} colors={colors} onPress={() => setShowAbout(true)} last />
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.destructive + "12", borderRadius: colors.radius }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive, fontFamily: "Inter_600SemiBold" }]}>
            {t("signOut")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
      <CyclePreferencesModal
        visible={showCyclePrefs}
        onClose={() => setShowCyclePrefs(false)}
      />
      <FlowPreferencesModal
        visible={showFlowPrefs}
        onClose={() => setShowFlowPrefs(false)}
      />
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <AboutModal
        visible={showAbout}
        onClose={() => setShowAbout(false)}
      />
      <ContactSupportModal
        visible={showContact}
        onClose={() => setShowContact(false)}
      />
      <CashDonationModal
        visible={showDonateModal}
        anonymousMode={anonymousMode}
        onClose={() => setShowDonateModal(false)}
      />
      <ExportDataModal
        visible={showExportData}
        onClose={() => setShowExportData(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  userCard: {
    flexDirection: "row", alignItems: "center", padding: 16, marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 18 },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 16 },
  userEmail: { fontSize: 13, marginTop: 2 },
  userMeta: { fontSize: 12, marginTop: 3 },
  editBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 10 },
  section: { marginBottom: 20, overflow: "hidden" },
  settingRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 14 },
  detailRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  detailText: { fontSize: 13, flex: 1 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 15, marginTop: 8, marginBottom: 24,
  },
  logoutText: { fontSize: 15 },
});
