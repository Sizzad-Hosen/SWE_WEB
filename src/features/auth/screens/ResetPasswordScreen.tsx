import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
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

export default function ResetPasswordScreen() {
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

  const {
    startPasswordRecovery,
    updatePassword,
    clearPasswordRecovery,
  } = useAuth();

  const [preparing, setPreparing] =
    useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    let active = true;

    void startPasswordRecovery()
      .then(() => {
        if (active) {
          setReady(true);
          setError("");
        }
      })
      .catch((recoveryError) => {
        if (active) {
          setReady(false);
          setError(
            recoveryError instanceof Error
              ? recoveryError.message
              : "Password reset link খোলা যায়নি।",
          );
        }
      })
      .finally(() => {
        if (active) {
          setPreparing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [startPasswordRecovery]);

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

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const savePassword = async () => {
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
      await updatePassword(password);

      Alert.alert(
        "Password পরিবর্তন হয়েছে",
        "নতুন password এখন Parent Login-এ ব্যবহার করতে পারবেন।",
        [
          {
            text: "ঠিক আছে",
            onPress: clearPasswordRecovery,
          },
        ],
      );
    } catch (updateError) {
      Alert.alert(
        "Password পরিবর্তন হয়নি",
        updateError instanceof Error
          ? updateError.message
          : "আবার চেষ্টা করুন।",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (preparing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingPage}>
          <View style={styles.loadingOrbOne} />
          <View style={styles.loadingOrbTwo} />

          <View style={styles.loadingIconCircle}>
            <Text style={styles.loadingIcon}>
              🔐
            </Text>
          </View>

          <ActivityIndicator
            size="large"
            color="#7553BA"
            style={styles.spinner}
          />

          <Text style={styles.loadingTitle}>
            Reset link যাচাই হচ্ছে
          </Text>
          <Text style={styles.loadingText}>
            Secure recovery session প্রস্তুত করা
            হচ্ছে…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
              <View style={styles.topSpacer} />

              <View style={styles.topCopy}>
                <Text style={styles.topEyebrow}>
                  SECURE RECOVERY
                </Text>
                <Text style={styles.topTitle}>
                  New Password
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recovery বন্ধ করি"
                disabled={submitting}
                onPress={clearPasswordRecovery}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.closeIcon}>
                  ×
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.hero,
                !ready && styles.heroError,
                isTablet && styles.heroTablet,
              ]}
            >
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.heroIconCircle}>
                <Text style={styles.heroIcon}>
                  {ready ? "🔑" : "⚠️"}
                </Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isTablet &&
                    styles.heroTitleTablet,
                ]}
              >
                {ready
                  ? "নতুন Password দিন"
                  : "Reset link কাজ করছে না"}
              </Text>

              <Text style={styles.heroText}>
                {ready
                  ? "শক্তিশালী নতুন password তৈরি করুন এবং নিরাপদে account-এ ফিরে যান।"
                  : "Link invalid, expired অথবা আগেই ব্যবহার করা হয়ে থাকতে পারে।"}
              </Text>
            </View>

            {ready ? (
              <View style={styles.formCard}>
                <View style={styles.cardHeader}>
                  <View
                    style={styles.keyCircle}
                  >
                    <Text style={styles.keyIcon}>
                      🔐
                    </Text>
                  </View>

                  <View
                    style={styles.cardHeaderCopy}
                  >
                    <Text
                      style={styles.cardEyebrow}
                    >
                      UPDATE PASSWORD
                    </Text>
                    <Text style={styles.cardTitle}>
                      নতুন login password
                    </Text>
                  </View>
                </View>

                <Text style={styles.helperText}>
                  Password কমপক্ষে ৮ characters
                  হবে। Capital letter, number ও
                  symbol ব্যবহার করলে আরও নিরাপদ।
                </Text>

                <Text style={styles.label}>
                  New password
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
                    accessibilityLabel="New password"
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
                        item <=
                        passwordStrength.score
                          ? passwordStrength.score <=
                            1
                            ? styles.strengthWeak
                            : passwordStrength.score <=
                                3
                              ? styles.strengthGood
                              : styles.strengthStrong
                          : null,
                      ]}
                    />
                  ))}

                  <Text
                    style={styles.strengthLabel}
                  >
                    {passwordStrength.label}
                  </Text>
                </View>

                <Text style={styles.label}>
                  Confirm new password
                </Text>

                <View
                  style={[
                    styles.inputWrap,
                    confirmPassword &&
                    password !== confirmPassword
                      ? styles.inputWrapError
                      : passwordsMatch
                        ? styles.inputWrapSuccess
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
                      void savePassword()
                    }
                    style={styles.input}
                    accessibilityLabel="Confirm new password"
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

                {confirmPassword ? (
                  <View
                    style={[
                      styles.matchCard,
                      passwordsMatch
                        ? styles.matchCardSuccess
                        : styles.matchCardError,
                    ]}
                  >
                    <View
                      style={[
                        styles.matchIconCircle,
                        passwordsMatch
                          ? styles.matchIconSuccess
                          : styles.matchIconError,
                      ]}
                    >
                      <Text
                        style={styles.matchIcon}
                      >
                        {passwordsMatch
                          ? "✓"
                          : "!"}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.matchText,
                        passwordsMatch
                          ? styles.matchTextSuccess
                          : styles.matchTextError,
                      ]}
                    >
                      {passwordsMatch
                        ? "Password দুটি মিলেছে।"
                        : "Password দুটি মিলছে না।"}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() =>
                    void savePassword()
                  }
                  style={({ pressed }) => [
                    styles.primaryButton,
                    submitting &&
                      styles.primaryButtonDisabled,
                    pressed &&
                      !submitting &&
                      styles.primaryButtonPressed,
                  ]}
                >
                  <View
                    style={
                      styles.primaryIconCircle
                    }
                  >
                    <Text
                      style={styles.primaryIcon}
                    >
                      {submitting ? "…" : "✓"}
                    </Text>
                  </View>

                  <Text
                    style={styles.primaryText}
                  >
                    {submitting
                      ? "Save হচ্ছে…"
                      : "নতুন Password Save করুন"}
                  </Text>

                  <Text
                    style={styles.primaryArrow}
                  >
                    →
                  </Text>
                </Pressable>

                <View style={styles.securityNote}>
                  <Text
                    style={styles.securityIcon}
                  >
                    🛡️
                  </Text>
                  <Text
                    style={styles.securityText}
                  >
                    Save হওয়ার পরে পুরোনো password
                    আর কাজ করবে না। নতুন password
                    দিয়ে Parent Login করুন।
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.errorCard}>
                <View
                  style={styles.errorHeader}
                >
                  <View
                    style={styles.errorIconCircle}
                  >
                    <Text
                      style={styles.errorIcon}
                    >
                      !
                    </Text>
                  </View>

                  <View
                    style={styles.errorHeaderCopy}
                  >
                    <Text
                      style={styles.errorEyebrow}
                    >
                      LINK ERROR
                    </Text>
                    <Text
                      style={styles.errorTitle}
                    >
                      নতুন link প্রয়োজন
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.errorMessageCard}
                >
                  <Text
                    style={styles.errorMessage}
                  >
                    {error ||
                      "Password reset link invalid অথবা expired।"}
                  </Text>
                </View>

                <View style={styles.stepsCard}>
                  <StepRow
                    number="1"
                    text="App-এ ফিরে Parent Login screen খুলুন।"
                  />
                  <StepRow
                    number="2"
                    text="“Password ভুলে গেছেন?” চাপুন।"
                  />
                  <StepRow
                    number="3"
                    text="নতুন email link এই device-এ খুলুন।"
                    last
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={clearPasswordRecovery}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed &&
                      styles.primaryButtonPressed,
                  ]}
                >
                  <View
                    style={
                      styles.primaryIconCircle
                    }
                  >
                    <Text
                      style={styles.primaryIcon}
                    >
                      ↻
                    </Text>
                  </View>

                  <Text
                    style={styles.primaryText}
                  >
                    App-এ ফিরে নতুন link নিন
                  </Text>

                  <Text
                    style={styles.primaryArrow}
                  >
                    →
                  </Text>
                </Pressable>
              </View>
            )}

            {ready ? (
              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={clearPasswordRecovery}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelText}>
                  এখন নয়, App-এ ফিরে যাই
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepRow({
  number,
  text,
  last = false,
}: {
  number: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.stepRow,
        !last && styles.stepBorder,
      ]}
    >
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>
          {number}
        </Text>
      </View>

      <Text style={styles.stepText}>
        {text}
      </Text>
    </View>
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

  loadingPage: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#F6F3F8",
  },

  loadingOrbOne: {
    position: "absolute",
    top: -110,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#E7DDFB",
  },

  loadingOrbTwo: {
    position: "absolute",
    left: -100,
    bottom: -130,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#E2F1EA",
  },

  loadingIconCircle: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#FFFFFF",
    borderRadius: 46,
    backgroundColor: "#EEE6FF",
  },

  loadingIcon: {
    fontSize: 44,
  },

  spinner: {
    marginTop: 22,
  },

  loadingTitle: {
    marginTop: 15,
    fontSize: 21,
    fontWeight: "900",
    color: "#28232B",
    textAlign: "center",
  },

  loadingText: {
    maxWidth: 350,
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#776E79",
    textAlign: "center",
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

  topSpacer: {
    width: 42,
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

  closeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
  },

  closeIcon: {
    marginTop: -2,
    fontSize: 24,
    color: "#49424C",
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
    paddingTop: 23,
    paddingBottom: 25,
    borderRadius: 30,
    backgroundColor: "#CBBBF2",
  },

  heroError: {
    backgroundColor: "#F2C7C7",
  },

  heroTablet: {
    paddingTop: 29,
    paddingBottom: 31,
  },

  heroOrbOne: {
    position: "absolute",
    top: -70,
    right: -55,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor:
      "rgba(255,255,255,0.24)",
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

  heroIconCircle: {
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

  heroIcon: {
    fontSize: 40,
  },

  heroTitle: {
    marginTop: 12,
    fontSize: 27,
    fontWeight: "900",
    color: "#171419",
    textAlign: "center",
  },

  heroTitleTablet: {
    fontSize: 34,
  },

  heroText: {
    maxWidth: 380,
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

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  keyCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#EEE6FF",
  },

  keyIcon: {
    fontSize: 21,
  },

  cardHeaderCopy: {
    flex: 1,
    marginLeft: 11,
  },

  cardEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#9B929F",
  },

  cardTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#29242B",
  },

  helperText: {
    marginTop: 12,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#786F7B",
  },

  label: {
    marginTop: 15,
    marginBottom: 7,
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "900",
    color: "#5A525D",
  },

  inputWrap: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
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

  inputWrapSuccess: {
    borderColor: "#65A77F",
    backgroundColor: "#F5FCF8",
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
    marginTop: 8,
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

  matchCard: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
    padding: 8,
    borderRadius: 16,
  },

  matchCardSuccess: {
    backgroundColor: "#E3F5EA",
  },

  matchCardError: {
    backgroundColor: "#FFE8E8",
  },

  matchIconCircle: {
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  matchIconSuccess: {
    backgroundColor: "#4D9B6B",
  },

  matchIconError: {
    backgroundColor: "#D65A5A",
  },

  matchIcon: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  matchText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9,
    fontWeight: "800",
  },

  matchTextSuccess: {
    color: "#397F55",
  },

  matchTextError: {
    color: "#A64141",
  },

  primaryButton: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
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

  primaryButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },

  primaryButtonPressed: {
    transform: [{ translateY: 2 }],
  },

  primaryIconCircle: {
    width: 47,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#C98BFF",
  },

  primaryIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  primaryText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  primaryArrow: {
    marginRight: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
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

  errorCard: {
    marginTop: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E7CACA",
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

  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  errorIconCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#FFE3E3",
  },

  errorIcon: {
    fontSize: 20,
    fontWeight: "900",
    color: "#B54B4B",
  },

  errorHeaderCopy: {
    flex: 1,
    marginLeft: 11,
  },

  errorEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#B08383",
  },

  errorTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#6D3636",
  },

  errorMessageCard: {
    marginTop: 13,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "#FFF1F1",
  },

  errorMessage: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#9E5050",
    textAlign: "center",
  },

  stepsCard: {
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: "#F8F6F9",
  },

  stepRow: {
    minHeight: 59,
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
  },

  stepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E7E2E9",
  },

  stepNumber: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#EEE6FF",
  },

  stepNumberText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#7553BA",
  },

  stepText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#6F6672",
  },

  cancelButton: {
    alignSelf: "center",
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  cancelText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#777079",
  },
});
