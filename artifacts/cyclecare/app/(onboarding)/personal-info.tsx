import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useUpdateMe } from "@workspace/api-client-react";
import { Button } from "@/components/Button";

export default function PersonalInfoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { mutateAsync: updateMe, isPending } = useUpdateMe();

  const [name, setName] = useState(user?.name ?? "");
  const [age, setAge] = useState(user?.age !== null && user?.age !== undefined ? String(user.age) : "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const parsedAge = Number(age);

    if (!trimmedName || !trimmedAddress || !trimmedCity || !trimmedState || !age) {
      const message = "Please fill in your name, age, address, city, and state to continue.";
      if (Platform.OS === "web") {
        window.alert(`Complete profile\n\n${message}`);
      } else {
        Alert.alert("Complete profile", message);
      }
      setError(message);
      return;
    }

    if (Number.isNaN(parsedAge) || parsedAge < 10 || parsedAge > 100) {
      const message = "Please enter a valid age between 10 and 100.";
      if (Platform.OS === "web") {
        window.alert(`Invalid age\n\n${message}`);
      } else {
        Alert.alert("Invalid age", message);
      }
      setError(message);
      return;
    }

    try {
      const updated = await updateMe({
        data: {
          name: trimmedName,
          age: parsedAge,
          address: trimmedAddress,
          city: trimmedCity,
          state: trimmedState,
        },
      });

      if (!user) throw new Error("No authenticated user");

      await updateUser({
        ...user,
        ...updated,
        email: updated.email ?? user.email,
        phone: updated.phone ?? user.phone,
      });
      router.push("/(onboarding)/last-period");
    } catch (error: unknown) {
      console.error("Update profile failed", error);
      const apiError = error as {
        data?: { error?: string };
        response?: { data?: { error?: string } };
      };
      const msg = apiError?.data?.error ?? apiError?.response?.data?.error;
      const message =
        msg ??
        (error instanceof Error ? error.message : undefined) ??
        "Unable to save your profile right now.";
      if (Platform.OS === "web") {
        window.alert(`Update failed\n\n${message}`);
      } else {
        Alert.alert("Update failed", message);
      }
      setError(message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressBar}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={[
                styles.stepDot,
                { backgroundColor: step === 1 ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Profile information</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Collecting your personal details now means you can complete your first pad request without extra setup later.</Text>

        <View style={[styles.fieldGroup, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
            placeholder="Your full name"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Age</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
            placeholder="Age"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Address</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
            placeholder="Street address"
            placeholderTextColor={colors.mutedForeground}
            value={address}
            onChangeText={setAddress}
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>City</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
            placeholder="City"
            placeholderTextColor={colors.mutedForeground}
            value={city}
            onChangeText={setCity}
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>State</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
            placeholder="State"
            placeholderTextColor={colors.mutedForeground}
            value={state}
            onChangeText={setState}
            returnKeyType="done"
          />
          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>{error}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }]}> 
        <Button label={isPending ? "Saving..." : "Continue"} onPress={handleContinue} loading={isPending} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 20 },
  progressBar: { flexDirection: "row", gap: 8, marginBottom: 28 },
  stepDot: { flex: 1, height: 4, borderRadius: 2 },
  title: { fontSize: 26, lineHeight: 34, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  fieldGroup: { padding: 18, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  label: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, minHeight: 48 },
  footer: {},
  errorText: { marginTop: 10, fontSize: 14, lineHeight: 20 },
});
