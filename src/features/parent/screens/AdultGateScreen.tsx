import React, {
  useMemo,
  useRef,
  useState,
} from "react";
import {
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

type Destination = "parent" | "admin";

function createChallenge() {
  const b = Math.floor(Math.random() * 25) + 12;
  const answer =
    Math.floor(Math.random() * 25) + 15;

  return {
    a: b + answer,
    b,
    answer,
  };
}

export default function AdultGateScreen({
  navigation,
  route,
}: ScreenProps<"AdultGate">) {
  const { width, height } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isShortScreen = height < 700;
  const isTablet = width >= 600;

  const maxWidth = isTablet ? 560 : 480;
  const horizontalPadding = isSmallPhone
    ? 14
    : isTablet
      ? 28
      : 20;

  const { isAuthenticated, loading } = useAuth();

  const challenge = useMemo(
    () => createChallenge(),
    [],
  );

  const inputRef = useRef<TextInput>(null);

  const [destination, setDestination] =
    useState<Destination>(
      route.params.destination,
    );
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const verify = () => {
    if (loading) {
      return;
    }

    if (!value.trim()) {
      setError("উত্তরটি লিখুন।");
      inputRef.current?.focus();
      return;
    }

    if (Number(value) !== challenge.answer) {
      setError(
        "উত্তরটি সঠিক হয়নি। আবার চেষ্টা করুন।",
      );
      setValue("");
      inputRef.current?.focus();
      return;
    }

    setError("");

    if (destination === "admin") {
      navigation.replace("AdminLogin");
      return;
    }

    navigation.replace(
      isAuthenticated
        ? "ParentDashboard"
        : "Login",
    );
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
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.backIcon}>‹</Text>
              </Pressable>

              <View style={styles.topCopy}>
                <Text style={styles.topEyebrow}>
                  SECURE ACCESS
                </Text>
                <Text style={styles.topTitle}>
                  Adult Area
                </Text>
              </View>

              <View style={styles.topSpacer} />
            </View>

            <View style={styles.hero}>
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.shieldCircle}>
                <Text style={styles.shieldIcon}>
                  🛡️
                </Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isTablet &&
                    styles.heroTitleTablet,
                ]}
              >
                বড়দের জন্য
              </Text>

              <Text style={styles.heroText}>
                Parent অথবা Admin area নির্বাচন করে
                প্রশ্নটির উত্তর দিন।
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.modeLabel}>
                কোথায় যেতে চান?
              </Text>

              <View style={styles.modeSwitch}>
                <Pressable
                  onPress={() => {
                    setDestination("parent");
                    setError("");
                    setValue("");
                  }}
                  style={[
                    styles.modeButton,
                    destination === "parent" &&
                      styles.modeButtonActive,
                  ]}
                >
                  <Text style={styles.modeIcon}>
                    👪
                  </Text>
                  <Text
                    style={[
                      styles.modeText,
                      destination ===
                        "parent" &&
                        styles.modeTextActive,
                    ]}
                  >
                    Parent
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setDestination("admin");
                    setError("");
                    setValue("");
                  }}
                  style={[
                    styles.modeButton,
                    destination === "admin" &&
                      styles.modeButtonActive,
                  ]}
                >
                  <Text style={styles.modeIcon}>
                    🧑‍💻
                  </Text>
                  <Text
                    style={[
                      styles.modeText,
                      destination === "admin" &&
                        styles.modeTextActive,
                    ]}
                  >
                    Admin
                  </Text>
                </Pressable>
              </View>

              <View style={styles.questionBox}>
                <Text style={styles.questionLabel}>
                  কত হবে?
                </Text>
                <Text
                  style={[
                    styles.question,
                    isTablet &&
                      styles.questionTablet,
                  ]}
                >
                  {challenge.a} − {challenge.b} = ?
                </Text>
              </View>

              <Text style={styles.inputLabel}>
                আপনার উত্তর
              </Text>

              <TextInput
                ref={inputRef}
                value={value}
                editable={!loading}
                onChangeText={(nextValue) => {
                  setValue(
                    nextValue.replace(
                      /[^0-9]/g,
                      "",
                    ),
                  );
                  setError("");
                }}
                onSubmitEditing={verify}
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={3}
                placeholder="উত্তর লিখুন"
                placeholderTextColor="#AAA1AE"
                selectionColor="#7553BA"
                style={[
                  styles.input,
                  error && styles.inputError,
                ]}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorMark}>
                    !
                  </Text>
                  <Text style={styles.errorText}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <Pressable
                disabled={loading}
                onPress={verify}
                style={({ pressed }) => [
                  styles.verifyButton,
                  loading &&
                    styles.verifyDisabled,
                  pressed &&
                    !loading &&
                    styles.verifyPressed,
                ]}
              >
                <View style={styles.verifyIconCircle}>
                  <Text style={styles.verifyIcon}>
                    {loading ? "…" : "✓"}
                  </Text>
                </View>

                <Text style={styles.verifyText}>
                  {loading
                    ? "অপেক্ষা করুন…"
                    : destination === "admin"
                      ? "Admin Login-এ যান"
                      : "Parent Area খুলুন"}
                </Text>

                <Text style={styles.verifyArrow}>
                  →
                </Text>
              </Pressable>

              <View style={styles.note}>
                <Text style={styles.noteIcon}>
                  🔐
                </Text>
                <Text style={styles.noteText}>
                  Admin mode-এর পরে অনুমোদিত
                  admin/content_creator email ও
                  password প্রয়োজন হবে।
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelText}>
                এখন নয়, ফিরে যাই
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
    color: "#28232B",
  },
  topCopy: {
    flex: 1,
    alignItems: "center",
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
    padding: 22,
    borderRadius: 30,
    backgroundColor: "#CBBBF2",
  },
  heroOrbOne: {
    position: "absolute",
    top: -70,
    right: -55,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor:
      "rgba(255,255,255,0.22)",
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
  shieldCircle: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor:
      "rgba(255,255,255,0.72)",
    borderRadius: 39,
    backgroundColor:
      "rgba(255,255,255,0.42)",
  },
  shieldIcon: {
    fontSize: 38,
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 27,
    fontWeight: "900",
    color: "#171419",
  },
  heroTitleTablet: {
    fontSize: 34,
  },
  heroText: {
    maxWidth: 360,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#5D5264",
    textAlign: "center",
  },
  formCard: {
    marginTop: 14,
    padding: 17,
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
  modeLabel: {
    marginLeft: 3,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "900",
    color: "#554D59",
  },
  modeSwitch: {
    flexDirection: "row",
    gap: 8,
    padding: 5,
    borderRadius: 22,
    backgroundColor: "#F2EEF5",
  },
  modeButton: {
    flex: 1,
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 18,
  },
  modeButtonActive: {
    backgroundColor: "#1A171C",
  },
  modeIcon: {
    fontSize: 17,
  },
  modeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#746C77",
  },
  modeTextActive: {
    color: "#FFFFFF",
  },
  questionBox: {
    alignItems: "center",
    marginTop: 15,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#F1EBFF",
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#776A83",
  },
  question: {
    marginTop: 4,
    fontSize: 35,
    fontWeight: "900",
    color: "#4C337F",
  },
  questionTablet: {
    fontSize: 42,
  },
  inputLabel: {
    marginTop: 15,
    marginBottom: 7,
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "900",
    color: "#5A525D",
  },
  input: {
    minHeight: 58,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: "#D9D2DE",
    borderRadius: 19,
    backgroundColor: "#FBFAFC",
    fontSize: 20,
    fontWeight: "900",
    color: "#28232B",
    textAlign: "center",
  },
  inputError: {
    borderColor: "#D96363",
    backgroundColor: "#FFF7F7",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
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
  verifyButton: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 7,
    borderRadius: 30,
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
  verifyDisabled: {
    opacity: 0.58,
  },
  verifyPressed: {
    transform: [{ translateY: 2 }],
  },
  verifyIconCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#C98BFF",
  },
  verifyIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  verifyText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  verifyArrow: {
    marginRight: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 13,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "#F7F4F9",
  },
  noteIcon: {
    fontSize: 17,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#756D78",
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
