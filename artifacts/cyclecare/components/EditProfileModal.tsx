import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { useUpdateMe } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function EditProfileModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { updateUser, user } = useAuth();
  const { mutateAsync, isPending } = useUpdateMe();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setName(user.name ?? "");
      setAge(user.age != null ? String(user.age) : "");
      setAddress(user.address ?? "");
      setCity(user.city ?? "");
      setState(user.state ?? "");
      setError("");
      setSuccess(false);
    }
  }, [visible, user]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("nameCannotBeEmpty"));
      return;
    }

    const parsedAge = age.trim() ? parseInt(age.trim(), 10) : null;
    if (age.trim() && (isNaN(parsedAge!) || parsedAge! < 10 || parsedAge! > 100)) {
      setError(t("enterValidAge"));
      return;
    }

    setError("");
    try {
      const updated = await mutateAsync({
        data: {
          name: trimmedName,
          age: parsedAge,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
        },
      });
      if (user) {
        await updateUser({
          ...user,
          name: updated.name,
          age: updated.age ?? null,
          address: updated.address ?? null,
          city: updated.city ?? null,
          state: updated.state ?? null,
        });
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch {
      setError(t("profileUpdateFailed"));
    }
  }

  const inputStyle = (hasError?: boolean) => [
    styles.input,
    {
      backgroundColor: colors.card,
      borderColor: hasError ? colors.destructive : colors.border,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
  ];

  const labelStyle = [styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.outer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {t("editProfileTitle")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("editProfileSubtitle")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Full Name */}
            <Text style={labelStyle}>{t("fullName")}</Text>
            <TextInput
              style={inputStyle(!name.trim())}
              placeholder={t("yourFullName")}
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={(v) => { setName(v); setError(""); }}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/* Age */}
            <Text style={labelStyle}>{t("profileAge")}</Text>
            <TextInput
              style={inputStyle()}
              placeholder={t("agePlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              value={age}
              onChangeText={(v) => { setAge(v); setError(""); }}
              keyboardType="number-pad"
              maxLength={3}
              returnKeyType="next"
            />

            {/* Address */}
            <Text style={labelStyle}>{t("profileAddress")}</Text>
            <TextInput
              style={inputStyle()}
              placeholder={t("addressPlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              value={address}
              onChangeText={(v) => { setAddress(v); setError(""); }}
              autoCapitalize="sentences"
              returnKeyType="next"
            />

            {/* City */}
            <Text style={labelStyle}>{t("profileCity")}</Text>
            <TextInput
              style={inputStyle()}
              placeholder={t("cityPlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              value={city}
              onChangeText={(v) => { setCity(v); setError(""); }}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/* State */}
            <Text style={labelStyle}>{t("profileState")}</Text>
            <TextInput
              style={inputStyle()}
              placeholder={t("statePlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              value={state}
              onChangeText={(v) => { setState(v); setError(""); }}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            {/* Error / success feedback */}
            {!!error && (
              <Text style={[styles.feedbackText, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
                {error}
              </Text>
            )}
            {success && (
              <Text style={[styles.feedbackText, { color: colors.secondary, fontFamily: "Inter_400Regular" }]}>
                {t("profileUpdated")}
              </Text>
            )}

            {/* Save button */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  opacity: isPending || !name.trim() ? 0.6 : 1,
                  marginTop: 20,
                  marginBottom: 4,
                },
              ]}
              onPress={handleSave}
              disabled={isPending || !name.trim()}
              activeOpacity={0.85}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                  {t("saveChanges")}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: { fontSize: 20, marginBottom: 2 },
  subtitle: { fontSize: 13 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
  },
  feedbackText: { fontSize: 13, marginTop: 10 },
  saveBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  saveBtnText: { color: "#fff", fontSize: 16 },
});
