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
import { useChangePassword } from "@workspace/api-client-react";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess(false);
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [visible]);

  async function handleSave() {
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError(t("atLeast6Chars"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("passwordsMustMatch"));
      return;
    }

    try {
      await mutateAsync({ data: { currentPassword, newPassword } });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg?.toLowerCase().includes("incorrect") || msg?.toLowerCase().includes("wrong")) {
        setError(t("wrongCurrentPassword"));
      } else {
        setError(t("passwordChangeFailed"));
      }
    }
  }

  const inputBase = [
    styles.input,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
  ];

  const labelStyle = [styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }];

  function PasswordField({
    label,
    value,
    onChange,
    visible: show,
    onToggle,
    placeholder,
    returnKey = "next",
    onSubmit,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    visible: boolean;
    onToggle: () => void;
    placeholder: string;
    returnKey?: "next" | "done";
    onSubmit?: () => void;
  }) {
    return (
      <>
        <Text style={labelStyle}>{label}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[inputBase, styles.inputPadded]}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            value={value}
            onChangeText={(v) => { onChange(v); setError(""); }}
            secureTextEntry={!show}
            autoCapitalize="none"
            returnKeyType={returnKey}
            onSubmitEditing={onSubmit}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={onToggle} activeOpacity={0.7}>
            <Feather name={show ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.outer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {t("changePasswordTitle")}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <PasswordField
              label={t("currentPasswordLabel")}
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              placeholder={t("enterCurrentPassword")}
            />
            <PasswordField
              label={t("newPasswordLabel")}
              value={newPassword}
              onChange={setNewPassword}
              visible={showNew}
              onToggle={() => setShowNew((v) => !v)}
              placeholder={t("enterNewPassword")}
            />
            <PasswordField
              label={t("confirmPasswordLabel")}
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              placeholder={t("confirmNewPasswordPlaceholder")}
              returnKey="done"
              onSubmit={handleSave}
            />

            {!!error && (
              <Text style={[styles.feedback, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
                {error}
              </Text>
            )}
            {success && (
              <Text style={[styles.feedback, { color: colors.secondary, fontFamily: "Inter_400Regular" }]}>
                {t("passwordChanged")}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  opacity: isPending ? 0.6 : 1,
                  marginTop: 24,
                  marginBottom: 4,
                },
              ]}
              onPress={handleSave}
              disabled={isPending}
              activeOpacity={0.85}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>{t("saveChanges")}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20, maxHeight: "90%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 20 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  fieldLabel: {
    fontSize: 12, marginBottom: 6, marginTop: 18,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  inputWrap: { position: "relative" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  inputPadded: { paddingRight: 48 },
  eyeBtn: {
    position: "absolute", right: 14, top: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  feedback: { fontSize: 13, marginTop: 12 },
  saveBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 15 },
  saveBtnText: { color: "#fff", fontSize: 16 },
});
