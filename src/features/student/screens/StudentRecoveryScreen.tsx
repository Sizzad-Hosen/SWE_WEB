import React, { useMemo, useState } from "react";
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
import type { NativeStackScreenProps } from "../../../web/navigation";

import type { GateStackParamList } from "../../../navigation/gateRoutes";
import { useStudentStore } from "../store/studentStore";

type Props = NativeStackScreenProps<
  GateStackParamList,
  "StudentRecovery"
>;

function normalize(value: string) {
  return value
    .toUpperCase()
    .replace(/\s+/g, "");
}

function friendlyError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  const normalized = message.toLowerCase();

  if (
    normalized.includes("incorrect") ||
    normalized.includes("invalid") ||
    normalized.includes("not found")
  ) {
    return "Student ID অথবা Recovery Code সঠিক নয়। আবার পরীক্ষা করো।";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch")
  ) {
    return "Internet connection পাওয়া যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করো।";
  }

  if (
    normalized.includes("cloud sync is not configured")
  ) {
    return "এই build-এ Supabase configure করা নেই।";
  }

  return (
    message ||
    "Account recovery সম্পন্ন হয়নি। আবার চেষ্টা করো।"
  );
}

export default function StudentRecoveryScreen({
  navigation,
}: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const restoreStudent = useStudentStore(
    (state) => state.restoreStudent,
  );

  const [studentCode, setStudentCode] =
    useState("");
  const [recoveryCode, setRecoveryCode] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const normalizedStudentCode = useMemo(
    () => normalize(studentCode),
    [studentCode],
  );
  const normalizedRecoveryCode = useMemo(
    () => normalize(recoveryCode),
    [recoveryCode],
  );

  const canSubmit =
    normalizedStudentCode.length >= 8 &&
    normalizedRecoveryCode.length >= 6 &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) {
      Alert.alert(
        "তথ্য সম্পূর্ণ নয়",
        "Student ID এবং Recovery Code দুটোই লিখো।",
      );
      return;
    }

    setSubmitting(true);

    try {
      await restoreStudent(
        normalizedStudentCode,
        normalizedRecoveryCode,
      );
    } catch (error) {
      Alert.alert(
        "Account ফিরিয়ে আনা যায়নি",
        friendlyError(error),
      );
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
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
                isTablet ? 30 : 16,
            },
          ]}
        >
          <View
            style={[
              styles.shell,
              {
                maxWidth: isTablet ? 700 : 540,
              },
            ]}
          >
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="ফিরে যাই"
                disabled={submitting}
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.backIcon}>
                  ‹
                </Text>
              </Pressable>

              <View style={styles.headerCopy}>
                <Text style={styles.headerEyebrow}>
                  SECURE RECOVERY
                </Text>
                <Text style={styles.headerTitle}>
                  আগের Account ফিরিয়ে আনি
                </Text>
              </View>

              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.hero}>
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.heroIconCircle}>
                <Text style={styles.heroIcon}>
                  🔐
                </Text>
              </View>

              <Text style={styles.heroTitle}>
                তোমার শেখা আবার{"\n"}ফিরে আসবে
              </Text>

              <Text style={styles.heroText}>
                Student ID এবং Recovery Code
                যাচাই করে profile, completed
                chapters, stars ও unlocked lessons
                এই device-এ restore হবে।
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  STUDENT ID
                </Text>
                <View style={styles.inputShell}>
                  <Text style={styles.inputIcon}>
                    🪪
                  </Text>
                  <TextInput
                    value={studentCode}
                    editable={!submitting}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="NCTB-C1-12345"
                    placeholderTextColor="#AAA1AD"
                    onChangeText={(value) =>
                      setStudentCode(
                        normalize(value),
                      )
                    }
                    style={styles.input}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  RECOVERY CODE
                </Text>
                <View style={styles.inputShell}>
                  <Text style={styles.inputIcon}>
                    🔑
                  </Text>
                  <TextInput
                    value={recoveryCode}
                    editable={!submitting}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="ABCD-EFGH"
                    placeholderTextColor="#AAA1AD"
                    onChangeText={(value) =>
                      setRecoveryCode(
                        normalize(value),
                      )
                    }
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={() =>
                      void submit()
                    }
                  />
                </View>
              </View>

              <View style={styles.securityNote}>
                <Text style={styles.noteIcon}>
                  🛡️
                </Text>
                <Text style={styles.noteText}>
                  সফল recovery-এর পরে এই নতুন
                  device active child device হবে।
                  Parent account link অপরিবর্তিত
                  থাকবে।
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!canSubmit}
                onPress={() => void submit()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !canSubmit &&
                    styles.primaryButtonDisabled,
                  pressed &&
                    canSubmit &&
                    styles.primaryButtonPressed,
                ]}
              >
                <View style={styles.primaryIconCircle}>
                  <Text style={styles.primaryIcon}>
                    ↻
                  </Text>
                </View>

                <Text style={styles.primaryText}>
                  {submitting
                    ? "Account restore হচ্ছে…"
                    : "আমার Account ফিরিয়ে আনো"}
                </Text>

                {submitting ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.primaryArrow}>
                    ›
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.helpCard}>
              <Text style={styles.helpIcon}>💡</Text>
              <View style={styles.helpCopy}>
                <Text style={styles.helpTitle}>
                  Code কোথায় পাওয়া যাবে?
                </Text>
                <Text style={styles.helpText}>
                  Student profile তৈরির পরে যে
                  Recovery Details screen দেখানো
                  হয়েছিল, সেখানে Student ID ও
                  Recovery Code ছিল।
                </Text>
              </View>
            </View>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 28,
  },
  shell: {
    width: "100%",
    alignSelf: "center",
  },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  backIcon: {
    marginTop: -4,
    fontSize: 34,
    color: "#28232B",
  },
  headerCopy: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#8C8290",
  },
  headerTitle: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "900",
    color: "#211D23",
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },
  hero: {
    overflow: "hidden",
    padding: 22,
    borderRadius: 30,
    backgroundColor: "#CBBBF2",
  },
  heroOrbOne: {
    position: "absolute",
    top: -70,
    right: -45,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  heroOrbTwo: {
    position: "absolute",
    left: -55,
    bottom: -95,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.17)",
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  heroIcon: {
    fontSize: 35,
  },
  heroTitle: {
    marginTop: 15,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "900",
    color: "#171419",
  },
  heroText: {
    maxWidth: 520,
    marginTop: 9,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: "#554B5B",
  },
  formCard: {
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 7,
    marginLeft: 4,
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#776E7B",
  },
  inputShell: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#E2DCE7",
    borderRadius: 20,
    backgroundColor: "#FAF8FB",
  },
  inputIcon: {
    fontSize: 21,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: "#2D2730",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#E7F4E5",
  },
  noteIcon: {
    fontSize: 19,
  },
  noteText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#52734F",
  },
  primaryButton: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 8,
    borderRadius: 32,
    backgroundColor: "#17151A",
  },
  primaryButtonDisabled: {
    backgroundColor: "#C8C3CC",
  },
  primaryButtonPressed: {
    transform: [{ translateY: 3 }],
  },
  primaryIconCircle: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 25,
    backgroundColor: "#9A78DB",
  },
  primaryIcon: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  primaryText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  primaryArrow: {
    marginRight: 16,
    fontSize: 28,
    color: "#FFFFFF",
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#FFF1C8",
  },
  helpIcon: {
    fontSize: 23,
  },
  helpCopy: {
    flex: 1,
    marginLeft: 10,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#514526",
  },
  helpText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#75683F",
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.86,
  },
});
