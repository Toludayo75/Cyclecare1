import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { ArticleDetailModal, type Article } from "@/components/ArticleDetailModal";
import { ContactSupportModal } from "@/components/ContactSupportModal";

const CATEGORIES = [
  { icon: "layers",   labelKey: "catAll",            value: null },
  { icon: "activity", labelKey: "catIrregularPeriods", value: "catIrregularPeriods" },
  { icon: "zap",      labelKey: "catCramps",          value: "catCramps" },
  { icon: "droplet",  labelKey: "catHygiene",          value: "catHygiene" },
  { icon: "heart",    labelKey: "catPmsMood",          value: "catPmsMood" },
  { icon: "star",     labelKey: "catFirstPeriod",      value: "catFirstPeriod" },
  { icon: "shield",   labelKey: "catReproHealth",      value: "catReproHealth" },
  { icon: "book",     labelKey: "catEducation",        value: "catEducation" },
  { icon: "sun",      labelKey: "catWellness",         value: "catWellness" },
];

const ARTICLES: (Omit<Article, "readTime"> & { readTime: string; filterCategories: string[] })[] = [
  {
    titleKey:   "article1Title",
    excerptKey: "article1Excerpt",
    bodyKey:    "article1Body",
    categoryKey: "catEducation",
    readTime:   "4",
    filterCategories: ["catEducation", "catIrregularPeriods"],
  },
  {
    titleKey:   "article2Title",
    excerptKey: "article2Excerpt",
    bodyKey:    "article2Body",
    categoryKey: "catWellness",
    readTime:   "3",
    filterCategories: ["catWellness", "catCramps", "catPmsMood"],
  },
  {
    titleKey:   "article3Title",
    excerptKey: "article3Excerpt",
    bodyKey:    "article3Body",
    categoryKey: "catHygiene",
    readTime:   "2",
    filterCategories: ["catHygiene", "catFirstPeriod"],
  },
  {
    titleKey:   "article4Title",
    excerptKey: "article4Excerpt",
    bodyKey:    "article4Body",
    categoryKey: "catSupport",
    readTime:   "2",
    filterCategories: ["catSupport", "catReproHealth"],
  },
];

const FAQS = [
  { qKey: "faq1Q", aKey: "faq1A" },
  { qKey: "faq2Q", aKey: "faq2A" },
  { qKey: "faq3Q", aKey: "faq3A" },
];

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showContact, setShowContact] = useState(false);

  const filtered = ARTICLES.filter(a => {
    const matchesSearch =
      !search ||
      t(a.titleKey).toLowerCase().includes(search.toLowerCase()) ||
      t(a.categoryKey).toLowerCase().includes(search.toLowerCase()) ||
      t(a.excerptKey).toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !activeCategory || a.filterCategories.includes(activeCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {t("supportTitle")}
        </Text>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderRadius: colors.radius * 0.75, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={text => { setSearch(text); setActiveCategory(null); }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          {t("topicsLabel")}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow} contentContainerStyle={{ paddingRight: 20 }}>
          {CATEGORIES.map((c, i) => {
            const isActive = activeCategory === c.value;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? colors.primary + "12" : colors.card,
                    borderRadius: colors.radius,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setActiveCategory(isActive ? null : c.value);
                  setSearch("");
                }}
                activeOpacity={0.75}
              >
                <Feather name={c.icon as any} size={14} color={isActive ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.categoryLabel, { color: isActive ? colors.primary : colors.foreground, fontFamily: isActive ? "Inter_600SemiBold" : "Inter_500Medium" }]}>
                  {t(c.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Articles */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          {t("articlesLabel")}
        </Text>
        {filtered.length === 0 ? (
          <View style={[styles.emptySearch, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Feather name="search" size={20} color={colors.mutedForeground} />
            <Text style={[styles.emptySearchText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {t("noArticlesFound")}
            </Text>
            <TouchableOpacity onPress={() => { setSearch(""); setActiveCategory(null); }}>
              <Text style={[styles.clearFilter, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                {t("clearFilters")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((article, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.articleCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}
              onPress={() =>
                setSelectedArticle({
                  titleKey: article.titleKey,
                  bodyKey: article.bodyKey,
                  excerptKey: article.excerptKey,
                  categoryKey: article.categoryKey,
                  readTime: `${article.readTime} ${t("readMin")} read`,
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.articleMeta}>
                <Text style={[styles.articleCategory, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                  {t(article.categoryKey)}
                </Text>
                <View style={styles.readTime}>
                  <Feather name="clock" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.readTimeText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {article.readTime} {t("readMin")}
                  </Text>
                </View>
              </View>
              <Text style={[styles.articleTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {t(article.titleKey)}
              </Text>
              <Text style={[styles.articleExcerpt, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t(article.excerptKey)}
              </Text>
              <View style={styles.readMore}>
                <Text style={[styles.readMoreText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                  {t("readArticle")}
                </Text>
                <Feather name="arrow-right" size={13} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Ask a Health Worker */}
        <View style={[styles.askCard, { backgroundColor: colors.secondary + "12", borderRadius: colors.radius }]}>
          <Feather name="message-circle" size={28} color={colors.secondary} />
          <Text style={[styles.askTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {t("askHealthWorker")}
          </Text>
          <Text style={[styles.askSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("askSubtitle")}
          </Text>
          <TouchableOpacity
            style={[styles.askBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius * 0.75 }]}
            onPress={() => setShowContact(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.askBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
              {t("askQuestion")}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("askDisclaimer")}
          </Text>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          {t("faqLabel")}
        </Text>
        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}
            onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQ, { color: colors.foreground, fontFamily: "Inter_500Medium", flex: 1 }]}>
                {t(faq.qKey)}
              </Text>
              <Feather
                name={expandedFaq === i ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.mutedForeground}
              />
            </View>
            {expandedFaq === i && (
              <Text style={[styles.faqA, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t(faq.aKey)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
      <ContactSupportModal
        visible={showContact}
        onClose={() => setShowContact(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 26, marginBottom: 20 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, marginBottom: 24 },
  searchInput: { flex: 1, fontSize: 14 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 12 },
  categoriesRow: { marginBottom: 24 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, borderWidth: 1.5 },
  categoryLabel: { fontSize: 13 },
  emptySearch: { alignItems: "center", padding: 32, gap: 10, marginBottom: 16 },
  emptySearchText: { fontSize: 14 },
  clearFilter: { fontSize: 13 },
  articleCard: { padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  articleMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  articleCategory: { fontSize: 11 },
  readTime: { flexDirection: "row", alignItems: "center", gap: 4 },
  readTimeText: { fontSize: 11 },
  articleTitle: { fontSize: 15, marginBottom: 6 },
  articleExcerpt: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  readMore: { flexDirection: "row", alignItems: "center", gap: 4 },
  readMoreText: { fontSize: 13 },
  askCard: { padding: 24, alignItems: "center", marginTop: 8, marginBottom: 24 },
  askTitle: { fontSize: 18, marginTop: 12, marginBottom: 8 },
  askSub: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  askBtn: { paddingHorizontal: 28, paddingVertical: 14, marginBottom: 12 },
  askBtnText: { fontSize: 15 },
  disclaimer: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  faqCard: { padding: 16, marginBottom: 8 },
  faqHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  faqQ: { fontSize: 14, lineHeight: 20 },
  faqA: { fontSize: 13, lineHeight: 19, marginTop: 12 },
});
