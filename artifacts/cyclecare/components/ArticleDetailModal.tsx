import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";

export interface Article {
  titleKey: string;
  bodyKey: string;
  excerptKey: string;
  categoryKey: string;
  readTime: string;
}

interface Props {
  article: Article | null;
  onClose: () => void;
}

function renderBody(body: string, colors: ReturnType<typeof useColors>) {
  return body.split("\n\n").map((para, i) => {
    if (!para.trim()) return null;
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <Text key={i} style={[styles.bodyPara, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <Text key={j} style={{ fontFamily: "Inter_600SemiBold" }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  });
}

export function ArticleDetailModal({ article, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Modal visible={!!article} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            style={[styles.topBarCategory, { color: colors.primary, fontFamily: "Inter_500Medium" }]}
            numberOfLines={1}
          >
            {article ? t(article.categoryKey) : ""}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {article && (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "12" }]}>
              <Text style={[styles.categoryLabel, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                {t(article.categoryKey)}
              </Text>
            </View>

            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {t(article.titleKey)}
            </Text>

            <View style={styles.meta}>
              <Feather name="clock" size={13} color={colors.mutedForeground} />
              <Text style={[styles.readTime, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {article.readTime}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.body}>
              {renderBody(t(article.bodyKey), colors)}
            </View>

            <View style={[styles.footer, { backgroundColor: colors.secondary + "10", borderRadius: colors.radius }]}>
              <Feather name="info" size={15} color={colors.secondary} />
              <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("articleDisclaimer")}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  topBarCategory: { fontSize: 13 },
  scroll: { padding: 24 },
  categoryBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, marginBottom: 14 },
  categoryLabel: { fontSize: 12 },
  title: { fontSize: 24, lineHeight: 32, marginBottom: 12 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  readTime: { fontSize: 13 },
  divider: { height: 1, marginBottom: 20 },
  body: { gap: 0 },
  bodyPara: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
  footer: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 16, marginTop: 8 },
  footerText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
