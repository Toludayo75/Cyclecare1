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
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { getApiUrl } from "@/utils/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { BackButton } from "@/components/BackButton";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = t("emailRequired");
    if (!password) e.password = t("passwordRequired");
    return e;
  }

  async function handleLogin() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await fetch(
        `${getApiUrl("/api/auth/login")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        Alert.alert(t("loginFailed"), data.error ?? "Invalid credentials");
        return;
      }
      await login(data.token, data.user);
      if (!data.user.hasCompletedOnboarding) {
        router.replace("/(onboarding)/intro");
      } else {
        router.replace("/(tabs)");
      }
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
        showsVerticalScrollIndicator={false}
      >
        <BackButton />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {t("loginTitle")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("loginSubtitle")}
          </Text>
        </View>

        <Input
          label={t("emailOrPhone")}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={errors.email}
          returnKeyType="next"
        />
        <Input
          label={t("password")}
          placeholder={t("yourPassword")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => router.push("/(auth)/forgot-password")}
        >
          <Text style={[styles.forgotText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
            {t("forgotPassword")}
          </Text>
        </TouchableOpacity>

        <Button
          label={t("signIn")}
          onPress={handleLogin}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("noAccount")}{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
            <Text style={[styles.footerLink, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              {t("signUp")}
            </Text>
          </TouchableOpacity>
        </View>
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
  forgotButton: { alignSelf: "flex-end", marginBottom: 8, marginTop: -4 },
  forgotText: { fontSize: 14 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
