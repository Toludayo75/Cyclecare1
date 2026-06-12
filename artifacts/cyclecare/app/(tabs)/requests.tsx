import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";
import {
  useGetRequests,
  useCreateRequest,
  useMarkRequestCollected,
  useGetCycleProfile,
  getGetRequestsQueryKey,
} from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  pending:   "#F59E0B",
  approved:  "#B39CD0",
  ready:     "#E96C8A",
  collected: "#2FB7A3",
  rejected:  "#EF4444",
};

const STATUS_KEYS: Record<string, string> = {
  pending:   "statusPending",
  approved:  "statusApproved",
  ready:     "statusReady",
  collected: "statusCollected",
  rejected:  "statusRejected",
};

const QUANTITY_OPTIONS = [5, 10, 15, 20, 25];

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const color = STATUS_COLORS[status] ?? "#888";
  return (
    <View style={[badge.wrap, { backgroundColor: color + "20" }]}>
      <Text style={[badge.text, { color, fontFamily: "Inter_600SemiBold" }]}>
        {t(STATUS_KEYS[status] ?? status)}
      </Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  text: { fontSize: 12 },
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function RequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showCode, setShowCode] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedQty, setSelectedQty] = useState(10);
  const [isUnusedActionPending, setIsUnusedActionPending] = useState(false);

  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useGetRequests();
  const { data: cycleProfile } = useGetCycleProfile();
  const { mutateAsync: createRequest, isPending: isCreating } = useCreateRequest();
  const { mutateAsync: markCollected, isPending: isCollecting } = useMarkRequestCollected();

  const allocation = data?.allocation ?? { total: 25, used: 0, remaining: 25 };
  const currentRequest = data?.currentRequest ?? null;
  const history = data?.history ?? [];
  const progress = allocation.total > 0 ? allocation.used / allocation.total : 0;

  const today = new Date();
  const getCycleWindow = (profile: any) => {
    if (!profile?.lastPeriodDate || !profile?.cycleLength || !profile?.periodDuration) return null;

    const lastPeriod = new Date(profile.lastPeriodDate);
    if (Number.isNaN(lastPeriod.getTime())) return null;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const candidates: Date[] = [];
    let cursor = new Date(lastPeriod);

    while (cursor < monthEnd) {
      candidates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + profile.cycleLength);
    }

    if (candidates.length > 0 && candidates[0] > monthStart) {
      const previous = new Date(candidates[0]);
      previous.setDate(previous.getDate() - profile.cycleLength);
      candidates.unshift(previous);
    }

    const window = candidates
      .map((start) => ({
        start,
        end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + profile.periodDuration - 1),
      }))
      .find((range) => range.end >= monthStart && range.start < monthEnd);

    return window ?? (candidates.length > 0 ? {
      start: candidates[candidates.length - 1],
      end: new Date(candidates[candidates.length - 1].getFullYear(), candidates[candidates.length - 1].getMonth(), candidates[candidates.length - 1].getDate() + profile.periodDuration - 1),
    } : null);
  };

  const periodWindow = getCycleWindow(cycleProfile);
  const hasWindowClosed = periodWindow ? today > periodWindow.end : false;
  const showReminder = periodWindow ? today >= periodWindow.start && today <= periodWindow.end && !currentRequest && allocation.remaining > 0 : false;
  const canMakeRequest = !currentRequest && allocation.remaining > 0 && !hasWindowClosed;

  async function handleSubmitRequest() {
    if (selectedQty > allocation.remaining) {
      Alert.alert(t("error"), t("allocationExceeded"));
      return;
    }
    try {
      await createRequest({ data: { quantity: selectedQty } });
      await queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });
      setShowRequestModal(false);
      setShowCode(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg?.includes("active request")) {
        Alert.alert(t("error"), t("alreadyHasRequest"));
      } else {
        Alert.alert(t("error"), msg ?? t("requestError"));
      }
    }
  }

  async function handleMarkCollected() {
    if (!currentRequest) return;
    // Quick visual confirmation for debugging (can be removed later)
    async function doMark() {
      try {
        await markCollected({ id: currentRequest.id });
        await queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });
        setShowCode(false);
      } catch {
        Alert.alert(t("error"), t("requestError"));
      }
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const ok = window.confirm(t("markCollectedMsg"));
      if (ok) await doMark();
      return;
    }

    Alert.alert(t("markCollected"), t("markCollectedMsg"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("yes"), onPress: () => { void doMark(); } },
    ]);
  }

  async function handleUnusedAction(action: "donate" | "rollover") {
    if (!token) {
      Alert.alert(t("error"), "You must be signed in to perform this action.");
      return;
    }

    setIsUnusedActionPending(true);
    try {
      const response = await fetch(getApiUrl("/api/requests/unused-action"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json() as { donatedAmount?: number; publicStockAvailablePads?: number; error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update unused pads");
      }

      await queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });
      const successMessage =
        action === "donate"
          ? result.donatedAmount
            ? `Donated ${result.donatedAmount} unused pads to CycleCare public stock.`
            : "Unused pads have been donated to the CycleCare public stock."
          : "Your remaining pads will roll over into next month.";

      const stockMessage = result.publicStockAvailablePads != null
        ? ` Public stock now has ${result.publicStockAvailablePads} pads available.`
        : "";

      Alert.alert("Success", `${successMessage}${stockMessage}`);
    } catch (error: unknown) {
      const msg = (error as Error).message;
      Alert.alert(t("error"), msg || t("requestError"));
    } finally {
      setIsUnusedActionPending(false);
    }
  }

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
          {t("requestsTitle")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {t("requestsSubtitle")}
        </Text>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {t("loadingRequests")}
            </Text>
          </View>
        ) : error ? (
          <TouchableOpacity
            style={[styles.errorBox, { backgroundColor: colors.destructive + "10", borderRadius: colors.radius }]}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Feather name="alert-circle" size={18} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
              Failed to load requests. Tap to retry.
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* ── Allocation card ── */}
            <View style={[styles.allocationCard, { backgroundColor: colors.primary + "10", borderRadius: colors.radius }]}>
              <View style={styles.allocationHeader}>
                <Text style={[styles.allocationTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {t("monthlyAllocation")}
                </Text>
                <Text style={[styles.allocationTotal, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  {allocation.total} {t("pads")}
                </Text>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${Math.min(progress * 100, 100)}%` as any },
                  ]}
                />
              </View>

              <View style={styles.allocationMeta}>
                <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {allocation.used} {t("requested")}
                </Text>
                <Text style={[styles.metaText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  {allocation.remaining} {t("remaining")}
                </Text>
              </View>
            </View>

            {/* ── Request button ── */}
            <TouchableOpacity
              style={[
                styles.requestBtn,
                {
                  backgroundColor: canMakeRequest ? colors.primary : colors.muted,
                  borderRadius: colors.radius,
                  opacity: canMakeRequest ? 1 : 0.6,
                },
              ]}
              onPress={() => {
                if (!canMakeRequest) {
                  if (currentRequest) {
                    Alert.alert(t("error"), t("alreadyHasRequest"));
                  } else if (hasWindowClosed) {
                    Alert.alert(
                      t("error"),
                      periodWindow
                        ? `Your predicted period window ended on ${periodWindow.end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. You can donate or rollover unused pads instead.`
                        : t("allocationExceeded"),
                    );
                  } else {
                    Alert.alert(t("error"), t("allocationExceeded"));
                  }
                  return;
                }
                setSelectedQty(Math.min(10, allocation.remaining));
                setShowRequestModal(true);
              }}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={[styles.requestBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                {t("requestPads")}
              </Text>
            </TouchableOpacity>

            {showReminder ? (
              <View style={[styles.warningCard, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B", borderRadius: colors.radius }]}> 
                <Feather name="alert-triangle" size={16} color="#B45309" />
                <Text style={[styles.warningText, { color: "#92400E", fontFamily: "Inter_500Medium" }]}>Your predicted cycle window is open. Submit your request before it closes.</Text>
              </View>
            ) : null}

            {hasWindowClosed && allocation.remaining > 0 && !currentRequest ? (
              <View style={[styles.unusedCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
                <Text style={[styles.unusedTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Your current cycle window has closed</Text>
                <Text style={[styles.unusedDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>You still have {allocation.remaining} unused pads for this month. Choose whether to donate them now, or roll the remainder into next month's allocation.</Text>
                <View style={styles.unusedActions}>
                  <TouchableOpacity
                    style={[styles.unusedButton, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
                    onPress={() => handleUnusedAction("donate")}
                    disabled={isUnusedActionPending}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.unusedButtonText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Donate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unusedButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
                    onPress={() => handleUnusedAction("rollover")}
                    disabled={isUnusedActionPending}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.unusedButtonText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Rollover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* ── Current request ── */}
            {currentRequest ? (
              <View style={[styles.currentRequest, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
                <View style={styles.requestHeader}>
                  <Text style={[styles.requestLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    {t("currentRequest")}
                  </Text>
                  <StatusBadge status={currentRequest.status} t={t} />
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.detailRow}>
                    <Feather name="package" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.detailText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                      {currentRequest.quantity} {t("padsApproved")}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="calendar" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.detailText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {formatDate(currentRequest.createdAt)}
                    </Text>
                  </View>
                </View>

                {currentRequest.status === "pending" ? (
                  <View style={[styles.pendingNotice, { backgroundColor: "#F59E0B18", borderRadius: colors.radius * 0.75, borderColor: "#F59E0B40" }]}>
                    <Feather name="clock" size={16} color="#F59E0B" />
                    <Text style={[styles.pendingText, { color: "#92640A", fontFamily: "Inter_400Regular" }]}>
                      Your request is being reviewed by an NGO partner. You'll receive your pickup code and location once it's approved.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.requestDetails}>
                      {currentRequest.pickupLocation ? (
                        <View style={styles.detailRow}>
                          <Feather name="map-pin" size={14} color={colors.mutedForeground} />
                          <Text style={[styles.detailText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                            {currentRequest.pickupLocation}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.detailRow}>
                        <Feather name="clock" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.detailText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                          {t("pickupHours")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.pickupCodeBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius * 0.75, flex: 1 }]}
                        onPress={() => setShowCode(v => !v)}
                      >
                        <Feather name={showCode ? "eye-off" : "eye"} size={16} color="#fff" />
                        <Text style={[styles.pickupCodeText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                          {showCode ? t("hidePickupCode") : t("viewPickupCode")}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.collectBtn,
                          { backgroundColor: colors.primary + "15", borderRadius: colors.radius * 0.75, opacity: isCollecting ? 0.6 : 1 },
                        ]}
                        onPress={handleMarkCollected}
                        accessibilityRole="button"
                        disabled={isCollecting}
                        activeOpacity={0.75}
                      >
                        {isCollecting ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Feather name="check" size={16} color={colors.primary} />
                            <Text style={[styles.collectBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                              {t("markCollected")}
                            </Text>
                            
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {showCode && currentRequest.pickupCode ? (
                      <View style={[styles.codeContainer, { backgroundColor: colors.background, borderRadius: colors.radius * 0.75 }]}>
                        <Text style={[styles.codeLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                          {t("pickupCodeLabel")}
                        </Text>
                        <Text style={[styles.code, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                          {currentRequest.pickupCode}
                        </Text>
                        <Text style={[styles.codeHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                          {t("pickupCodeHint")}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "12" }]}>
                  <Feather name="package" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {t("noActiveRequest")}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {t("makeFirstRequest")}
                </Text>
              </View>
            )}

            {/* ── History ── */}
            {history.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                  {t("historyLabel")}
                </Text>
                {history.map(item => (
                  <View key={item.id} style={[styles.historyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
                    <View style={styles.historyTop}>
                      <Text style={[styles.historyDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {formatDate(item.createdAt)}
                      </Text>
                      <StatusBadge status={item.status} t={t} />
                    </View>
                    <Text style={[styles.historyQty, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {item.quantity} {t("pads")}
                    </Text>
                    <Text style={[styles.historyLocation, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {item.pickupLocation}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {history.length === 0 && !currentRequest && (
              <Text style={[styles.noHistory, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("noHistory")}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Request Pads Modal ── */}
      <Modal visible={showRequestModal} animationType="slide" transparent onRequestClose={() => setShowRequestModal(false)}>
        <KeyboardAvoidingView style={modal.outer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowRequestModal(false)} />
          <View style={[modal.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={[modal.handle, { backgroundColor: colors.border }]} />

            <View style={modal.header}>
              <Text style={[modal.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {t("requestPads")}
              </Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)} style={[modal.closeBtn, { backgroundColor: colors.muted }]}>
                <Feather name="x" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text style={[modal.qtyLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {t("quantityLabel")}
            </Text>
            <Text style={[modal.qtyHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Up to {allocation.remaining} {t("pads")} {t("remaining")} this month
            </Text>

            <View style={modal.qtyGrid}>
              {QUANTITY_OPTIONS.map(qty => {
                const disabled = qty > allocation.remaining;
                const isSelected = selectedQty === qty;
                return (
                  <TouchableOpacity
                    key={qty}
                    style={[
                      modal.qtyOption,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: disabled ? 0.35 : 1,
                      },
                    ]}
                    onPress={() => !disabled && setSelectedQty(qty)}
                    disabled={disabled}
                    activeOpacity={0.75}
                  >
                    <Text style={[modal.qtyNumber, { color: isSelected ? "#fff" : colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      {qty}
                    </Text>
                    <Text style={[modal.qtyUnit, { color: isSelected ? "#fff" : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {t("pads")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[modal.summaryBox, { backgroundColor: colors.primary + "10", borderRadius: colors.radius }]}>
              <Feather name="map-pin" size={14} color={colors.primary} />
              <Text style={[modal.summaryText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                Your nearest NGO pickup centre will be assigned after submission.
              </Text>
            </View>

            <TouchableOpacity
              style={[modal.confirmBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: isCreating ? 0.6 : 1 }]}
              onPress={handleSubmitRequest}
              disabled={isCreating}
              activeOpacity={0.85}
            >
              {isCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={[modal.confirmText, { fontFamily: "Inter_600SemiBold" }]}>
                    {t("confirmRequest")} · {selectedQty} {t("pads")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 26, marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  loadingBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, marginBottom: 20 },
  errorText: { flex: 1, fontSize: 14 },
  allocationCard: { padding: 20, marginBottom: 16 },
  allocationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  allocationTitle: { fontSize: 15 },
  allocationTotal: { fontSize: 18 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 4 },
  allocationMeta: { flexDirection: "row", justifyContent: "space-between" },
  metaText: { fontSize: 13 },
  requestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, marginBottom: 20 },
  requestBtnText: { fontSize: 16 },
  currentRequest: { padding: 18, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  requestHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  requestLabel: { fontSize: 15 },
  requestDetails: { gap: 10, marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { fontSize: 14, flex: 1 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 0 },
  pickupCodeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  pickupCodeText: { fontSize: 13 },
  collectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 14 },
  collectBtnText: { fontSize: 13 },
  codeContainer: { marginTop: 14, padding: 20, alignItems: "center" },
  codeLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },
  code: { fontSize: 28, letterSpacing: 4, marginBottom: 8 },
  codeHint: { fontSize: 12, textAlign: "center" },
  emptyCard: { padding: 32, marginBottom: 24, alignItems: "center", gap: 12 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 16 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 12 },
  historyCard: { padding: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  historyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  historyDate: { fontSize: 12 },
  historyQty: { fontSize: 15, marginBottom: 4 },
  historyLocation: { fontSize: 13 },
  noHistory: { textAlign: "center", fontSize: 13, paddingVertical: 20 },
  pendingNotice: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderWidth: 1, marginTop: 4 },
  pendingText: { flex: 1, fontSize: 13, lineHeight: 19 },
  warningCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 13, lineHeight: 20 },
  unusedCard: { padding: 18, marginBottom: 16, gap: 14 },
  unusedTitle: { fontSize: 16 },
  unusedDesc: { fontSize: 13, lineHeight: 20 },
  unusedActions: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" },
  unusedButton: {
    flex: 0.48,
    minWidth: 110,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unusedButtonText: { fontSize: 13, textAlign: "center" },
});

const modal = StyleSheet.create({
  outer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 20 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  qtyLabel: { fontSize: 13, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
  qtyHint: { fontSize: 13, marginBottom: 16 },
  qtyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  qtyOption: { width: "18%", aspectRatio: 1, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  qtyNumber: { fontSize: 18 },
  qtyUnit: { fontSize: 11 },
  summaryBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, marginBottom: 20 },
  summaryText: { flex: 1, fontSize: 13, lineHeight: 18 },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, marginBottom: 8 },
  confirmText: { color: "#fff", fontSize: 16 },
});
