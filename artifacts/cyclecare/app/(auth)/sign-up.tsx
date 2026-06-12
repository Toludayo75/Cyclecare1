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

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("nameRequired");
    if (!email.trim()) e.email = t("emailRequired");
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = t("enterValidEmail");
    if (!password) e.password = t("passwordRequired");
    else if (password.length < 6) e.password = t("atLeast6Chars");
    return e;
  }

  async function handleSignUp() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await fetch(
        `${getApiUrl("/api/auth/register")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        Alert.alert(t("signUpFailed"), data.error ?? "Something went wrong");
        return;
      }
      await login(data.token, data.user);
      router.replace("/(onboarding)/intro");
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
            {t("signUpTitle")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("signUpSubtitle")}
          </Text>
        </View>

        <Input
          label={t("fullName")}
          placeholder={t("yourName")}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          error={errors.name}
          returnKeyType="next"
        />
        <Input
          label={t("email")}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={errors.email}
          returnKeyType="next"
        />
        <Input
          label={t("password")}
          placeholder={t("passwordMinChars")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
        />

        <Button
          label={t("createAccount")}
          onPress={handleSignUp}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("alreadyHaveAccount")}{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={[styles.footerLink, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              {t("signIn")}
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
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
