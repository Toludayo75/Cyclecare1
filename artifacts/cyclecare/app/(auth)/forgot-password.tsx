import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { getApiUrl } from "@/utils/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { BackButton } from "@/components/BackButton";
import { Feather } from "@/components/Icon";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch(
        `${getApiUrl("/api/auth/forgot-password")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );
      setSent(true);
    } catch {
      Alert.alert(t("error"), t("networkError"));
    } finally {
      setLoading(false);
    }
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
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton />

        {sent ? (
          <View style={styles.sentContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.secondary + "20" }]}>
              <Feather name="check-circle" size={40} color={colors.secondary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {t("checkInbox")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {t("resetSentMessage")}
            </Text>
            <Button
              label={t("backToSignIn")}
              onPress={() => router.replace("/(auth)/login")}
              style={{ marginTop: 32 }}
            />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {t("resetPassword")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("resetSubtitle")}
              </Text>
            </View>

            <Input
              label={t("email")}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />

            <Button
              label={t("sendResetLink")}
              onPress={handleReset}
              loading={loading}
              disabled={!email.trim()}
              style={{ marginTop: 8 }}
            />

            <TouchableOpacity style={styles.backLink} onPress={() => router.replace("/(auth)/login") }>
              <Text style={[styles.backLinkText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                {t("backToSignIn")}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  sentContainer: { alignItems: "center", paddingTop: 40 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  backLink: { alignItems: "center", marginTop: 24 },
  backLinkText: { fontSize: 14 },
});
