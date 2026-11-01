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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({
  navigation,
}: ScreenProps<"ForgotPassword">) {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortScreen = height < 700;
  const isTablet = width >= 600;

  const maxWidth = isTablet ? 520 : 470;
  const horizontalPadding = isSmallPhone
    ? 14
    : isTablet
      ? 28
      : 20;

  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [sent, setSent] = useState(false);

  const sendResetLink = async () => {
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      Alert.alert(
        "সঠিক Email দিন",
        "Parent account-এর valid email লিখুন।",
      );
      return;
    }

    setSubmitting(true);

    try {
      await requestPasswordReset(
        normalizedEmail,
      );
      setSent(true);
    } catch (error) {
      Alert.alert(
        "Reset link পাঠানো যায়নি",
        error instanceof Error
          ? error.message
          : "আবার চেষ্টা করুন।",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSent(false);
    setEmail("");
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
                  ACCOUNT RECOVERY
                </Text>
                <Text style={styles.topTitle}>
                  Forgot Password
                </Text>
              </View>

              <View style={styles.topSpacer} />
            </View>

            <View
              style={[
                styles.hero,
                sent && styles.heroSuccess,
                isTablet && styles.heroTablet,
              ]}
            >
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.heroIconCircle}>
                <Text style={styles.heroIcon}>
                  {sent ? "📨" : "🔐"}
                </Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isTablet &&
                    styles.heroTitleTablet,
                ]}
              >
                {sent
                  ? "Email পরীক্ষা করুন"
                  : "Password ফিরে পান"}
              </Text>

              <Text style={styles.heroText}>
                {sent
                  ? "Reset link পাঠানো হয়েছে। Email-এর link এই device-এ খুলুন।"
                  : "Parent account-এর email দিন। আমরা secure reset link পাঠাব।"}
              </Text>
            </View>

            <View style={styles.formCard}>
              {!sent ? (
                <>
                  <View style={styles.cardHeader}>
                    <View
                      style={styles.mailCircle}
                    >
                      <Text style={styles.mailIcon}>
                        ✉️
                      </Text>
                    </View>

                    <View
                      style={styles.cardHeaderCopy}
                    >
                      <Text
                        style={styles.cardEyebrow}
                      >
                        RESET REQUEST
                      </Text>
                      <Text style={styles.cardTitle}>
                        Account email লিখুন
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.helperText}>
                    আপনার Parent account-এর সঙ্গে
                    ব্যবহার করা email address দিন।
                  </Text>

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
                      returnKeyType="send"
                      onSubmitEditing={() =>
                        void sendResetLink()
                      }
                      style={styles.input}
                      accessibilityLabel="Parent email"
                    />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    disabled={submitting}
                    onPress={() =>
                      void sendResetLink()
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
                        {submitting ? "…" : "→"}
                      </Text>
                    </View>

                    <Text
                      style={styles.primaryText}
                    >
                      {submitting
                        ? "পাঠানো হচ্ছে…"
                        : "Reset Link পাঠান"}
                    </Text>

                    <Text
                      style={styles.primaryArrow}
                    >
                      ›
                    </Text>
                  </Pressable>

                  <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>
                      🛡️
                    </Text>
                    <Text style={styles.infoText}>
                      নিরাপত্তার জন্য account আছে
                      কি না আলাদা করে দেখানো হবে না।
                      Email এলে link খুলে নতুন
                      password দিন।
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View
                    style={styles.successHeader}
                  >
                    <View
                      style={styles.successCircle}
                    >
                      <Text
                        style={styles.successIcon}
                      >
                        ✓
                      </Text>
                    </View>

                    <View
                      style={styles.successCopy}
                    >
                      <Text
                        style={
                          styles.successEyebrow
                        }
                      >
                        EMAIL SENT
                      </Text>
                      <Text
                        style={styles.successTitle}
                      >
                        Reset link প্রস্তুত
                      </Text>
                    </View>
                  </View>

                  <View style={styles.emailCard}>
                    <Text
                      style={styles.emailCardIcon}
                    >
                      ✉️
                    </Text>

                    <View
                      style={styles.emailCardCopy}
                    >
                      <Text
                        style={
                          styles.emailCardLabel
                        }
                      >
                        Link পাঠানো হয়েছে
                      </Text>
                      <Text
                        style={
                          styles.emailCardValue
                        }
                        numberOfLines={1}
                      >
                        {email.trim().toLowerCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepsCard}>
                    <StepRow
                      number="1"
                      text="Email inbox এবং Spam folder পরীক্ষা করুন।"
                    />
                    <StepRow
                      number="2"
                      text="Password reset link এই Android ফোনে খুলুন।"
                    />
                    <StepRow
                      number="3"
                      text="নতুন password দিয়ে Parent Login করুন।"
                      last
                    />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      navigation.replace("Login")
                    }
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
                        🔐
                      </Text>
                    </View>

                    <Text
                      style={styles.primaryText}
                    >
                      Login screen-এ ফিরুন
                    </Text>

                    <Text
                      style={styles.primaryArrow}
                    >
                      ›
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={resetForm}
                    style={({ pressed }) => [
                      styles.resendButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={styles.resendIcon}
                    >
                      ↻
                    </Text>
                    <Text
                      style={styles.resendText}
                    >
                      অন্য email ব্যবহার করুন
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() =>
                navigation.replace("Login")
              }
              style={({ pressed }) => [
                styles.loginLink,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.loginLinkText}>
                Password মনে পড়েছে? Parent Login
              </Text>
            </Pressable>
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
    paddingTop: 23,
    paddingBottom: 25,
    borderRadius: 30,
    backgroundColor: "#CBBBF2",
  },

  heroSuccess: {
    backgroundColor: "#BFE0D2",
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

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  mailCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#EEE6FF",
  },

  mailIcon: {
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
    marginTop: -2,
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 13,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "#F7F4F9",
  },

  infoIcon: {
    fontSize: 17,
  },

  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#756D78",
  },

  successHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  successCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#DDF3E8",
  },

  successIcon: {
    fontSize: 21,
    fontWeight: "900",
    color: "#3D8B68",
  },

  successCopy: {
    flex: 1,
    marginLeft: 11,
  },

  successEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#7C9E8F",
  },

  successTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#29483B",
  },

  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#F2EEF5",
  },

  emailCardIcon: {
    fontSize: 20,
  },

  emailCardCopy: {
    flex: 1,
    marginLeft: 9,
  },

  emailCardLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#8D8490",
  },

  emailCardValue: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "900",
    color: "#4A424D",
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

  resendButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#D9D2DE",
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
  },

  resendIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#7553BA",
  },

  resendText: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: "900",
    color: "#554D59",
  },

  loginLink: {
    alignSelf: "center",
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  loginLinkText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#777079",
  },
});
