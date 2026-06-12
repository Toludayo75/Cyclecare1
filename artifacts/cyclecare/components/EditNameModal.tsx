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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { useUpdateMe } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";

type Props = {
  visible: boolean;
  currentName: string;
  onClose: () => void;
};

export function EditNameModal({ visible, currentName, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { updateUser, user } = useAuth();
  const { mutateAsync, isPending } = useUpdateMe();

  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setError("");
    }
  }, [visible, currentName]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("nameCannotBeEmpty"));
      return;
    }
    setError("");
    try {
      const updated = await mutateAsync({ data: { name: trimmed } });
      if (user) {
        await updateUser({ ...user, name: updated.name });
      }
      onClose();
    } catch {
      setError(t("nameUpdateFailed"));
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.outer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {t("editNameTitle")}
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("editNameLabel")}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: error ? colors.destructive : colors.border,
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
                borderRadius: 14,
              },
            ]}
            placeholder={t("yourFullName")}
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={(val) => { setName(val); setError(""); }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          {!!error && (
            <Text style={[styles.errorText, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: 14,
                opacity: isPending || !name.trim() ? 0.6 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={isPending || !name.trim()}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>{t("saveChanges")}</Text>
            )}
          </TouchableOpacity>
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
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 20 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  label: { fontSize: 13, marginBottom: 16 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: { fontSize: 13, marginBottom: 8 },
  saveBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginTop: 12,
  },
  saveBtnText: { color: "#fff", fontSize: 16 },
});
