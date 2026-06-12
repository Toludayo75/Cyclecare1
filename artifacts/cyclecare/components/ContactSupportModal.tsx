import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function ContactRow({
  icon,
  label,
  value,
  onPress,
  colors,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        rowStyles.row,
        !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[rowStyles.iconWrap, { backgroundColor: colors.primary + "12" }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={rowStyles.textCol}>
        <Text style={[rowStyles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
        <Text style={[rowStyles.value, { color: onPress ? colors.primary : colors.foreground, fontFamily: "Inter_500Medium" }]}>
          {value}
        </Text>
      </View>
      {onPress && <Feather name="external-link" size={14} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  textCol: { flex: 1 },
  label: { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" },
  value: { fontSize: 14, marginTop: 2 },
});

export function ContactSupportModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  function openEmail() {
    Linking.openURL("mailto:support@cyclecare.app?subject=CycleCare Support");
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {t("contactTitle")}
          </Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {t("contactDesc")}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <ContactRow
            icon="mail"
            label={t("contactEmailLabel")}
            value={t("contactEmailAddress")}
            onPress={openEmail}
            colors={colors}
          />
          <ContactRow
            icon="clock"
            label={t("contactHoursLabel")}
            value={t("contactHoursValue")}
            colors={colors}
            last
          />
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.secondary + "12", borderRadius: colors.radius }]}>
          <Feather name="info" size={15} color={colors.secondary} />
          <Text style={[styles.infoText, { color: colors.secondary, fontFamily: "Inter_400Regular" }]}>
            Your health data is never shared with support agents without your consent.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 20 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  card: { marginBottom: 16, overflow: "hidden", paddingHorizontal: 16 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, marginBottom: 8 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
