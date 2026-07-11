import { useState } from "react";
import { Alert, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MaxContentWidth, Spacing } from "@/constants/theme";
import { signInWithGoogle } from "@/features/auth/use-google-auth";
import { useAuth } from "@/lib/auth-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";

export default function LoginScreen() {
  const { session, user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.type === "error") {
        Alert.alert("ログインエラー", result.error.message);
      }
      // "cancelled" は静かに終了
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.card} type="backgroundElement">
          <ThemedText type="subtitle" style={styles.heading}>
            move-mate
          </ThemedText>

          {session ? (
            <>
              <ThemedText type="default" style={styles.message}>
                ログイン済み
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.email}
              >
                {user?.email}
              </ThemedText>
              <Pressable
                style={[
                  styles.button,
                  { backgroundColor: theme.backgroundSelected },
                ]}
                onPress={handleSignOut}
              >
                <ThemedText type="default">ログアウト</ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.message}
              >
                Google アカウントでログインしてください
              </ThemedText>
              <Pressable
                style={[
                  styles.button,
                  styles.googleButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                <ThemedText type="default" style={styles.googleButtonText}>
                  {isLoading ? "認証中..." : "Google でログイン"}
                </ThemedText>
              </Pressable>
            </>
          )}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
  },
  card: {
    alignSelf: "stretch",
    borderRadius: Spacing.four,
    padding: Spacing.five,
    gap: Spacing.three,
    alignItems: "center",
  },
  heading: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
  },
  email: {
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
  },
  googleButton: {
    backgroundColor: "#4285F4",
  },
  googleButtonText: {
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
