import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {t("notificationsPanelTitle")}
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.empty}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "12" }]}>
              <Feather name="bell" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {t("noNotificationsYet")}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {t("notificationsHint")}
            </Text>
          </View>

          <View style={[styles.tipCard, { backgroundColor: colors.secondary + "10", borderRadius: colors.radius }]}>
            <Feather name="settings" size={15} color={colors.secondary} />
            <Text style={[styles.tipText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {t("manageNotificationsHint")}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  title: { fontSize: 20 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 24, gap: 12 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 17 },
  emptyHint: { fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 280 },
  tipCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 16, marginTop: 24, marginBottom: 8 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
