import React, { useMemo, useState } from "react";
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({
  navigation,
}: ScreenProps<"Register">) {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortScreen = height < 760;
  const isTablet = width >= 600;

  const maxWidth = isTablet ? 540 : 480;
  const horizontalPadding = isSmallPhone
    ? 14
    : isTablet
      ? 28
      : 20;

  const { registerParent } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        label: "Password লিখুন",
      };
    }

    let score = 0;

    if (password.length >= 8) {
      score += 1;
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }

    if (score <= 1) {
      return {
        score,
        label: "Weak",
      };
    }

    if (score <= 3) {
      return {
        score,
        label: "Good",
      };
    }

    return {
      score,
      label: "Strong",
    };
  }, [password]);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (
      !trimmedName ||
      !normalizedEmail ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "তথ্য প্রয়োজন",
        "সবগুলো field পূরণ করুন।",
      );
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      Alert.alert(
        "সঠিক Email দিন",
        "Parent account-এর valid email লিখুন।",
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak password",
        "Password কমপক্ষে 8 characters হতে হবে।",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password মিলছে না",
        "দুই জায়গায় একই password লিখুন।",
      );
      return;
    }

    setSubmitting(true);

    try {
      const result = await registerParent({
        name: trimmedName,
        email: normalizedEmail,
        password,
      });

      if (result.requiresEmailConfirmation) {
        Alert.alert(
          "Email confirm করুন",
          "Supabase থেকে পাঠানো confirmation email-এর link চাপুন। তারপর app-এ ফিরে Login করুন।",
          [
            {
              text: "ঠিক আছে",
              onPress: () =>
                navigation.replace("Login"),
            },
          ],
        );
        return;
      }

      navigation.replace("ParentDashboard");
    } catch (error) {
      Alert.alert(
        "Account তৈরি হয়নি",
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
                disabled={submitting}
                onPress={() =>
                  navigation.goBack()
                }
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
                  NEW PARENT
                </Text>
                <Text style={styles.topTitle}>
                  Create Account
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

              <View style={styles.cloudCircle}>
                <Text style={styles.cloudIcon}>
                  ☁️
                </Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isTablet &&
                    styles.heroTitleTablet,
                ]}
              >
                Parent account তৈরি করুন
              </Text>

              <Text style={styles.heroText}>
                একাধিক শিশুকে link, progress monitor
                এবং cloud backup restore করতে
                পারবেন।
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View style={styles.profileCircle}>
                  <Text style={styles.profileIcon}>
                    👤
                  </Text>
                </View>

                <View style={styles.formHeaderCopy}>
                  <Text style={styles.formEyebrow}>
                    ACCOUNT DETAILS
                  </Text>
                  <Text style={styles.formTitle}>
                    আপনার তথ্য দিন
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>
                Parent name
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>
                  👤
                </Text>

                <TextInput
                  value={name}
                  editable={!submitting}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="আপনার নাম"
                  placeholderTextColor="#AAA1AE"
                  selectionColor="#7553BA"
                  returnKeyType="next"
                  style={styles.input}
                  accessibilityLabel="Parent name"
                />
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

              <Text style={styles.label}>
                Password
              </Text>

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
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#AAA1AE"
                  selectionColor="#7553BA"
                  returnKeyType="next"
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

              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map((item) => (
                  <View
                    key={item}
                    style={[
                      styles.strengthSegment,
                      item <= passwordStrength.score
                        ? passwordStrength.score <= 1
                          ? styles.strengthWeak
                          : passwordStrength.score <= 3
                            ? styles.strengthGood
                            : styles.strengthStrong
                        : null,
                    ]}
                  />
                ))}

                <Text style={styles.strengthLabel}>
                  {passwordStrength.label}
                </Text>
              </View>

              <View style={styles.passwordHint}>
                <Text style={styles.passwordHintIcon}>
                  💡
                </Text>
                <Text style={styles.passwordHintText}>
                  কমপক্ষে ৮ characters ব্যবহার করুন।
                  Number, capital letter ও symbol দিলে
                  password আরও শক্তিশালী হবে।
                </Text>
              </View>

              <Text style={styles.label}>
                Confirm password
              </Text>

              <View
                style={[
                  styles.inputWrap,
                  confirmPassword &&
                  password !== confirmPassword
                    ? styles.inputWrapError
                    : null,
                ]}
              >
                <Text style={styles.inputIcon}>
                  🔒
                </Text>

                <TextInput
                  value={confirmPassword}
                  editable={!submitting}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Password আবার লিখুন"
                  placeholderTextColor="#AAA1AE"
                  selectionColor="#7553BA"
                  returnKeyType="done"
                  onSubmitEditing={() =>
                    void handleRegister()
                  }
                  style={styles.input}
                  accessibilityLabel="Confirm password"
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirmPassword
                      ? "Confirm password লুকাই"
                      : "Confirm password দেখি"
                  }
                  disabled={submitting}
                  onPress={() =>
                    setShowConfirmPassword(
                      (current) => !current,
                    )
                  }
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword
                      ? "🙈"
                      : "👁️"}
                  </Text>
                </Pressable>
              </View>

              {confirmPassword &&
              password !== confirmPassword ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorMark}>
                    !
                  </Text>
                  <Text style={styles.errorText}>
                    Password দুটি মিলছে না।
                  </Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() =>
                  void handleRegister()
                }
                style={({ pressed }) => [
                  styles.registerButton,
                  submitting &&
                    styles.registerButtonDisabled,
                  pressed &&
                    !submitting &&
                    styles.registerButtonPressed,
                ]}
              >
                <View
                  style={styles.registerIconCircle}
                >
                  <Text style={styles.registerIcon}>
                    {submitting ? "…" : "✓"}
                  </Text>
                </View>

                <Text style={styles.registerText}>
                  {submitting
                    ? "Account তৈরি হচ্ছে…"
                    : "Parent Account তৈরি করুন"}
                </Text>

                <Text style={styles.registerArrow}>
                  →
                </Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  Account আছে?
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() =>
                  navigation.replace("Login")
                }
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.loginIcon}>
                  🔐
                </Text>
                <Text style={styles.loginText}>
                  Parent Login করুন
                </Text>
                <Text style={styles.loginArrow}>
                  ›
                </Text>
              </Pressable>

              <View style={styles.privacyNote}>
                <Text style={styles.privacyIcon}>
                  🛡️
                </Text>
                <Text style={styles.privacyText}>
                  Account তৈরি করলে email confirmation
                  প্রয়োজন হতে পারে। Confirmation link
                  Supabase থেকে পাঠানো হবে।
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

  cloudCircle: {
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

  cloudIcon: {
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

  profileCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#EEE6FF",
  },

  profileIcon: {
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

  inputWrapError: {
    borderColor: "#D96363",
    backgroundColor: "#FFF7F7",
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

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: -1,
    marginBottom: 9,
    paddingHorizontal: 3,
  },

  strengthSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E7E2E9",
  },

  strengthWeak: {
    backgroundColor: "#E16D6D",
  },

  strengthGood: {
    backgroundColor: "#E2AB3D",
  },

  strengthStrong: {
    backgroundColor: "#58A950",
  },

  strengthLabel: {
    minWidth: 58,
    marginLeft: 3,
    fontSize: 8,
    fontWeight: "900",
    color: "#746B77",
    textAlign: "right",
  },

  passwordHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#FFF3D0",
  },

  passwordHintIcon: {
    fontSize: 16,
  },

  passwordHintText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 8,
    lineHeight: 13,
    fontWeight: "700",
    color: "#715D2E",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -1,
    marginBottom: 8,
    padding: 9,
    borderRadius: 16,
    backgroundColor: "#FFE8E8",
  },

  errorMark: {
    width: 24,
    height: 24,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 12,
    backgroundColor: "#D65A5A",
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    fontWeight: "800",
    color: "#A64141",
  },

  registerButton: {
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

  registerButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },

  registerButtonPressed: {
    transform: [{ translateY: 2 }],
  },

  registerIconCircle: {
    width: 47,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#C98BFF",
  },

  registerIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  registerText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  registerArrow: {
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

  loginButton: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#D9D2DE",
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
  },

  loginIcon: {
    fontSize: 18,
  },

  loginText: {
    flex: 1,
    marginLeft: 11,
    fontSize: 11,
    fontWeight: "900",
    color: "#3C3540",
  },

  loginArrow: {
    marginRight: 7,
    marginTop: -2,
    fontSize: 25,
    color: "#777079",
  },

  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 13,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "#F7F4F9",
  },

  privacyIcon: {
    fontSize: 17,
  },

  privacyText: {
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
