import { Feather } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Feather name="alert-triangle" size={48} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          404
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Screen not found
        </Text>
        <Link href="/" asChild>
          <TouchableOpacity style={[styles.btn, { borderColor: colors.primary }]}>
            <Text style={[styles.btnText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              Back to Chat
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  title: { fontSize: 48 },
  sub: { fontSize: 16 },
  btn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  btnText: { fontSize: 15 },
});
