import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade", title: "" }}>
      <Stack.Screen name="welcome" options={{ title: "" }} />
      <Stack.Screen name="sign-up" options={{ animation: "slide_from_right", title: "" }} />
      <Stack.Screen name="login" options={{ animation: "slide_from_right", title: "" }} />
      <Stack.Screen name="forgot-password" options={{ animation: "slide_from_right", title: "" }} />
    </Stack>
  );
}
