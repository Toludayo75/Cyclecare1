import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { getApiUrl } from "@/utils/api";

export async function getExpoPushTokenAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    // tokenData.data looks like "ExponentPushToken[xxxxxxxxxx]"
    return tokenData.data ?? null;
  } catch (err) {
    console.warn("Failed to get expo push token", err);
    return null;
  }
}

export async function registerPushTokenOnServer(expoToken: string, authToken?: string) {
  try {
    const res = await fetch(getApiUrl("/notifications/register-token"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ token: expoToken, platform: Platform.OS }),
    });

    if (!res.ok) {
      console.warn("Failed to register push token on server", await res.text());
    }
  } catch (err) {
    console.warn("Error registering push token", err);
  }
}
