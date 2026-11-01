import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import { SafeAreaView } from "../../../web/safe-area";

import { useAuth } from "../../../contexts/AuthContext";
import type { ScreenProps } from "../../../navigation/routes";

export default function LoginScreen({
  navigation,
}: ScreenProps<"Login">) {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortScreen = height < 720;
  const isTablet = width >= 600;

  const maxWidth = isTablet ? 520 : 470;
  const horizontalPadding = isSmallPhone
    ? 14
    : isTablet
      ? 28
      : 20;

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const handleLogin = async () => {
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert(
        "তথ্য প্রয়োজন",
        "Email এবং password লিখুন।",
      );
      return;
    }

    if (
      !normalizedEmail.includes("@") ||
      !normalizedEmail.includes(".")
    ) {
      Alert.alert(
        "সঠিক email লিখুন",
        "Email address আবার পরীক্ষা করুন।",
      );
      return;
    }

    setSubmitting(true);

    try {
      await login({
        email: normalizedEmail,
        password,
      });

      navigation.replace(
        "ParentDashboard",
      );
    } catch (error) {
      Alert.alert(
        "Login হয়নি",
        error instanceof Error
          ? error.message
          : "আবার চেষ্টা করুন।",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal:
                horizontalPadding,
              paddingVertical: isShortScreen
                ? 12
                : 22,
            },
          ]}
        >
          <View
            style={[
              styles.shell,
              { maxWidth },
            ]}
          >
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="ফিরে যাই"
                onPress={() =>
                  navigation.goBack()
                }
                disabled={submitting}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.backIcon}>
                  ‹
                </Text>
              </Pressable>

              <View style={styles.topCopy}>
                <Text style={styles.topEyebrow}>
                  PARENT ACCESS
                </Text>
                <Text style={styles.topTitle}>
                  Parent Login
                </Text>
              </View>

              <View style={styles.topSpacer} />
            </View>

            <View
              style={[
                styles.hero,
                isTablet && styles.heroTablet,
              ]}
            >
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.familyCircle}>
                <Text style={styles.familyIcon}>
                  👪
                </Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isTablet &&
                    styles.heroTitleTablet,
                ]}
              >
                সন্তানের পাশে থাকুন
              </Text>

              <Text style={styles.heroText}>
                Progress, learning activity এবং
                cloud backup দেখার জন্য Parent
                account-এ login করুন।
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View style={styles.lockCircle}>
                  <Text style={styles.lockIcon}>
                    🔐
                  </Text>
                </View>

                <View style={styles.formHeaderCopy}>
                  <Text style={styles.formEyebrow}>
                    WELCOME BACK
                  </Text>
                  <Text style={styles.formTitle}>
                    Account-এ প্রবেশ করুন
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>
                Parent email
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>
                  ✉️
                </Text>

                <TextInput
                  value={email}
                  editable={!submitting}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="parent@example.com"
                  placeholderTextColor="#AAA1AE"
                  selectionColor="#7553BA"
                  returnKeyType="next"
                  style={styles.input}
                  accessibilityLabel="Parent email"
                />
              </View>

              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>
                  Password
                </Text>

                <Pressable
                  disabled={submitting}
                  onPress={() =>
                    navigation.navigate(
                      "ForgotPassword",
                    )
                  }
                >
                  <Text
                    style={styles.forgotText}
                  >
                    ভুলে গেছেন?
                  </Text>
                </Pressable>
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>
                  🔑
                </Text>

                <TextInput
                  value={password}
                  editable={!submitting}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Password"
                  placeholderTextColor="#AAA1AE"
                  selectionColor="#7553BA"
                  returnKeyType="done"
                  onSubmitEditing={() =>
                    void handleLogin()
                  }
                  style={styles.input}
                  accessibilityLabel="Password"
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword
                      ? "Password লুকাই"
                      : "Password দেখি"
                  }
                  disabled={submitting}
                  onPress={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword
                      ? "🙈"
                      : "👁️"}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() =>
                  void handleLogin()
                }
                style={({ pressed }) => [
                  styles.loginButton,
                  submitting &&
                    styles.loginButtonDisabled,
                  pressed &&
                    !submitting &&
                    styles.loginButtonPressed,
                ]}
              >
                <View style={styles.loginIconCircle}>
                  <Text style={styles.loginIcon}>
                    {submitting ? "…" : "✓"}
                  </Text>
                </View>

                <Text style={styles.loginText}>
                  {submitting
                    ? "Login হচ্ছে…"
                    : "Parent Dashboard খুলুন"}
                </Text>

                <Text style={styles.loginArrow}>
                  →
                </Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  নতুন Parent?
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() =>
                  navigation.navigate("Register")
                }
                style={({ pressed }) => [
                  styles.registerButton,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={styles.registerIconCircle}
                >
                  <Text
                    style={styles.registerIcon}
                  >
                    ＋
                  </Text>
                </View>

                <Text
                  style={styles.registerText}
                >
                  নতুন Parent account তৈরি করুন
                </Text>

                <Text
                  style={styles.registerArrow}
                >
                  ›
                </Text>
              </Pressable>

              <View style={styles.securityNote}>
                <Text style={styles.securityIcon}>
                  🛡️
                </Text>
                <Text style={styles.securityText}>
                  Parent account ছাড়া কোনো
                  সন্তানের private progress data
                  দেখা যাবে না।
                </Text>
              </View>
            </View>

            <Pressable
              disabled={submitting}
              onPress={() =>
                navigation.navigate("Subjects")
              }
              style={({ pressed }) => [
                styles.studentButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.studentText}>
                Student app-এ ফিরে যাই
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F3F8",
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  shell: {
    width: "100%",
    alignSelf: "center",
  },

  topBar: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
  },

  backIcon: {
    marginTop: -4,
    fontSize: 32,
    fontWeight: "500",
    color: "#28232B",
  },

  topCopy: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },

  topEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#978D9B",
  },

  topTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#211D23",
  },

  topSpacer: {
    width: 42,
  },

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    borderRadius: 30,
    backgroundColor: "#CBBBF2",
  },

  heroTablet: {
    paddingTop: 28,
    paddingBottom: 30,
  },

  heroOrbOne: {
    position: "absolute",
    top: -70,
    right: -55,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor:
      "rgba(255,255,255,0.23)",
  },

  heroOrbTwo: {
    position: "absolute",
    left: -55,
    bottom: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor:
      "rgba(255,255,255,0.18)",
  },

  familyCircle: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor:
      "rgba(255,255,255,0.75)",
    borderRadius: 41,
    backgroundColor:
      "rgba(255,255,255,0.43)",
  },

  familyIcon: {
    fontSize: 40,
  },

  heroTitle: {
    marginTop: 12,
    fontSize: 26,
    fontWeight: "900",
    color: "#171419",
    textAlign: "center",
  },

  heroTitleTablet: {
    fontSize: 34,
  },

  heroText: {
    maxWidth: 370,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#5D5264",
    textAlign: "center",
  },

  formCard: {
    marginTop: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    shadowColor: "#7C7381",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },

  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  lockCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#EEE6FF",
  },

  lockIcon: {
    fontSize: 21,
  },

  formHeaderCopy: {
    flex: 1,
    marginLeft: 11,
  },

  formEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#9B929F",
  },

  formTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#29242B",
  },

  label: {
    marginLeft: 4,
    marginBottom: 7,
    marginTop: 5,
    fontSize: 11,
    fontWeight: "900",
    color: "#5A525D",
  },

  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  forgotText: {
    marginTop: 5,
    marginRight: 4,
    fontSize: 10,
    fontWeight: "900",
    color: "#7553BA",
  },

  inputWrap: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#D9D2DE",
    borderRadius: 19,
    backgroundColor: "#FBFAFC",
  },

  inputIcon: {
    fontSize: 18,
  },

  input: {
    flex: 1,
    minHeight: 54,
    marginLeft: 9,
    fontSize: 15,
    fontWeight: "700",
    color: "#28232B",
  },

  eyeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  eyeIcon: {
    fontSize: 17,
  },

  loginButton: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 7,
    borderRadius: 31,
    backgroundColor: "#1A171C",
    shadowColor: "#1A171C",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },

  loginButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },

  loginButtonPressed: {
    transform: [{ translateY: 2 }],
  },

  loginIconCircle: {
    width: 47,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#C98BFF",
  },

  loginIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  loginText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  loginArrow: {
    marginRight: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginVertical: 15,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E6E1E8",
  },

  dividerText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#958D98",
  },

  registerButton: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: "#D9D2DE",
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
  },

  registerIconCircle: {
    width: 41,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#EEE6FF",
  },

  registerIcon: {
    fontSize: 20,
    fontWeight: "900",
    color: "#7553BA",
  },

  registerText: {
    flex: 1,
    marginLeft: 11,
    fontSize: 11,
    fontWeight: "900",
    color: "#3C3540",
  },

  registerArrow: {
    marginRight: 11,
    marginTop: -2,
    fontSize: 25,
    color: "#777079",
  },

  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 13,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "#F7F4F9",
  },

  securityIcon: {
    fontSize: 17,
  },

  securityText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#756D78",
  },

  studentButton: {
    alignSelf: "center",
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  studentText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#777079",
  },
});
