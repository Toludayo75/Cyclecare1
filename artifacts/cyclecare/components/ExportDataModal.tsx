import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function DataRow({ label, value, colors, last }: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}) {
  return (
    <View style={[
      rowStyles.row,
      !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
    ]}>
      <Text style={[rowStyles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{value || "—"}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  label: { fontSize: 13 },
  value: { fontSize: 13, maxWidth: "55%", textAlign: "right" },
});

export function ExportDataModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const locationParts = [user?.city, user?.state].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(", ") : "—";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {t("exportDataTitle")}
          </Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.note, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("exportDataNote")}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <DataRow label="Name" value={user?.name ?? "—"} colors={colors} />
            <DataRow label="Email" value={user?.email ?? "—"} colors={colors} />
            {user?.phone ? <DataRow label="Phone" value={user.phone} colors={colors} /> : null}
            <DataRow label="Age" value={user?.age != null ? String(user.age) : "—"} colors={colors} />
            <DataRow label="Location" value={location} colors={colors} />
            <DataRow label={t("memberSince")} value={joinedDate} colors={colors} last />
          </View>

          <View style={[styles.comingSoon, { backgroundColor: colors.primary + "10", borderRadius: colors.radius }]}>
            <Feather name="download" size={16} color={colors.primary} />
            <Text style={[styles.comingSoonText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              Full CSV / PDF export coming in a future update
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20, maxHeight: "88%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 20 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  note: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  card: { marginBottom: 16, overflow: "hidden", paddingHorizontal: 16 },
  comingSoon: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, marginBottom: 8 },
  comingSoonText: { flex: 1, fontSize: 13 },
});
