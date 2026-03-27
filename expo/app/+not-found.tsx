import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "404" }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.title}>ئەم لاپەڕەیە بوونی نییە</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>گەڕانەوە بۆ سەرەکی</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#F1F5F9",
    marginBottom: 20,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#60A5FA",
  },
});
