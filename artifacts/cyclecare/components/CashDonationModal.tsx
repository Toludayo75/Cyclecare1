import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";
import { useNotifications } from "@/components/NotificationProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CashDonationModalProps {
  visible: boolean;
  onClose: () => void;
  anonymousMode: boolean;
}

export function CashDonationModal({ visible, onClose, anonymousMode }: CashDonationModalProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { token } = useAuth();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { show } = useNotifications();

  useEffect(() => {
    if (!visible) {
      setAmount("");
      setNote("");
      setError(null);
      setLoading(false);
      setSubmitted(false);
    }
  }, [visible]);

  async function handleSubmit() {
    const parsedAmount = Number(amount.trim());
    if (!parsedAmount || parsedAmount <= 0) {
      const msg = t("donationAmountInvalid");
      setError(msg);
      show(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Ensure we include an auth token even if `useAuth().token` hasn't hydrated yet.
      // Try the context token first, then fall back to AsyncStorage.
      let authToken = token;
      if (!authToken) {
        try {
          // Keep the storage key in sync with AuthContext
          authToken = await AsyncStorage.getItem("cyclecare_token");
        } catch {
          authToken = null;
        }
      }

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      if (!authToken && !anonymousMode) {
        setError("Please sign in first or enable anonymous donations.");
        return;
      }

      const response = await fetch(getApiUrl("/api/donations/initialize"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: Math.round(parsedAmount),
          note,
          anonymous: anonymousMode,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        const msg = payload?.error || t("donationError");
        setError(msg);
        show(msg);
      } else if (payload.authorizationUrl) {
        const authUrl = payload.authorizationUrl as string;

        show(t("donationRedirecting"));
        if (Platform.OS === "web") {
          window.location.href = authUrl;
        } else {
          await Linking.openURL(authUrl);
        }

        setSubmitted(true);
      } else {
        setError(t("donationError"));
      }
    } catch (err) {
      setError(t("donationError"));
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    if (submitted) {
      onClose();
      return;
    }

    if (Platform.OS === "web") {
      if (window.confirm(t("cancelDonationConfirm"))) {
        onClose();
      }
      return;
    }

    Alert.alert(t("cancelDonationTitle"), t("cancelDonationConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("close"), style: "destructive", onPress: onClose },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>        
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{t("donateCash")}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}> 
            {t("donationSubtitle")}
          </Text>
          <Input
            label={t("donationAmountLabel")}
            placeholder={t("donationAmountPlaceholder")}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Input
            label={t("donationNoteLabel")}
            placeholder={t("donationNotePlaceholder")}
            value={note}
            onChangeText={setNote}
            autoCapitalize="sentences"
          />
          <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}> 
            {anonymousMode ? t("donationAnonymousOn") : t("donationAnonymousOff")}
          </Text>
          {error ? <Text style={[styles.errorText, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>{error}</Text> : null}
          {submitted ? (
            <View style={styles.successBox}>
              <Text style={[styles.successText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {t("donationRedirecting")}
              </Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {t("donationSubtitle")}
              </Text>
              <Button label={t("done")} onPress={onClose} fullWidth={false} />
            </View>
          ) : (
            <Button
              label={t("donateNow")}
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          )}
          {!submitted ? (
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 500,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 18,
  },
  infoText: {
    fontSize: 13,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  successBox: {
    marginTop: 12,
  },
  successText: {
    fontSize: 15,
    marginBottom: 12,
  },
  closeButton: {
    marginTop: 12,
    alignItems: "center",
  },
  closeText: {
    fontSize: 15,
  },
});
