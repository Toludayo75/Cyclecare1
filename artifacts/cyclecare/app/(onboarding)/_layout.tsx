import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", title: "" }}>
      <Stack.Screen name="intro" options={{ title: "" }} />
      <Stack.Screen name="last-period" options={{ title: "" }} />
      <Stack.Screen name="cycle-length" options={{ title: "" }} />
      <Stack.Screen name="period-duration" options={{ title: "" }} />
      <Stack.Screen name="flow-type" options={{ title: "" }} />
      <Stack.Screen name="notifications" options={{ title: "" }} />
      <Stack.Screen name="complete" options={{ title: "" }} />
    </Stack>
  );
}
