import * as Notifications from "expo-notifications";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/NotificationProvider";
import { getExpoPushTokenAsync, registerPushTokenOnServer } from "@/hooks/usePushNotifications";

export function PushNotificationManager() {
  const { token } = useAuth();
  const { show } = useNotifications();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    async function registerToken() {
      const expoToken = await getExpoPushTokenAsync();
      if (expoToken && isMounted) {
        await registerPushTokenOnServer(expoToken, token);
      }
    }

    registerToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      const message = notification.request.content.body ?? notification.request.content.title ?? "New notification";
      show(message, 5000);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle presses on notifications here if needed.
      console.log("Notification response:", response);
    });

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, [show]);

  return null;
}
