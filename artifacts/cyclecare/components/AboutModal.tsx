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

type Props = {
  visible: boolean;
  onClose: () => void;
};

function InfoRow({ icon, label, value, colors }: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[infoStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[infoStyles.iconWrap, { backgroundColor: colors.primary + "12" }]}>
        <Feather name={icon as any} size={15} color={colors.primary} />
      </View>
      <View style={infoStyles.textCol}>
        <Text style={[infoStyles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  textCol: { flex: 1 },
  label: { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" },
  value: { fontSize: 14, marginTop: 2 },
});

export function AboutModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {t("aboutTitle")}
          </Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary + "12", borderRadius: colors.radius }]}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={[styles.logoText, { fontFamily: "Inter_700Bold" }]}>CC</Text>
            </View>
            <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>CycleCare</Text>
            <Text style={[styles.version, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {t("aboutVersion")}
            </Text>
          </View>

          <Text style={[styles.desc, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
            {t("aboutDesc")}
          </Text>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <InfoRow icon="layers" label="Build" value={t("aboutPhase")} colors={colors} />
            <InfoRow icon="globe" label="Target region" value="Nigeria & wider Africa" colors={colors} />
            <InfoRow icon="shield" label="Data" value="Encrypted & secure" colors={colors} />
            <InfoRow icon="heart" label="By" value="CycleCare Team" colors={colors} />
          </View>

          <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("aboutTagline")}
          </Text>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 20 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  logoBox: { alignItems: "center", paddingVertical: 24, marginBottom: 20 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoText: { color: "#fff", fontSize: 22 },
  appName: { fontSize: 22 },
  version: { fontSize: 13, marginTop: 4 },
  desc: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  infoCard: { marginBottom: 20, overflow: "hidden", paddingHorizontal: 16 },
  tagline: { fontSize: 13, textAlign: "center", paddingBottom: 8, fontStyle: "italic" },
});
