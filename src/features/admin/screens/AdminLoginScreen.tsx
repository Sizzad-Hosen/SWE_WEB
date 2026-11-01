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

import type { ScreenProps } from "../../../navigation/routes";
import { adminService } from "../services/adminService";

export default function AdminLoginScreen({
  navigation,
}: ScreenProps<"AdminLogin">) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const isSmallPhone = width < 360;
  const maxWidth = isTablet ? 520 : 460;

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "তথ্য প্রয়োজন",
        "Admin email এবং password লিখুন।",
      );
      return;
    }

    setSubmitting(true);

    try {
      await adminService.login(email, password);
      navigation.replace("AdminDashboard");
    } catch (error) {
      Alert.alert(
        "Admin login হয়নি",
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
              paddingHorizontal: isSmallPhone
                ? 14
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
                  STAFF ACCESS
                </Text>
                <Text style={styles.topTitle}>
                  Admin Login
                </Text>
              </View>

              <View style={styles.topSpacer} />
            </View>

            <View style={styles.hero}>
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.adminIconCircle}>
                <Text style={styles.adminIcon}>🛡️</Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isTablet &&
                    styles.heroTitleTablet,
                ]}
              >
                NCTB Kids Admin
              </Text>

              <Text style={styles.heroText}>
                অনুমোদিত Admin অথবা Content Creator
                account দিয়ে login করুন।
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.label}>
                Email address
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  value={email}
                  editable={!submitting}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="admin@example.com"
                  placeholderTextColor="#AAA1AE"
                  selectionColor="#7553BA"
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>Password</Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔑</Text>
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
                />

                <Pressable
                  onPress={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? "🙈" : "👁️"}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                disabled={submitting}
                onPress={() => void handleLogin()}
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
                    : "Admin Panel খুলুন"}
                </Text>

                <Text style={styles.loginArrow}>→</Text>
              </Pressable>

              <View style={styles.securityNote}>
                <Text style={styles.securityIcon}>
                  🔐
                </Text>
                <Text style={styles.securityText}>
                  Access পেতে profiles table-এ role
                  অবশ্যই admin অথবা content_creator
                  হতে হবে।
                </Text>
              </View>
            </View>

            <Pressable
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
    backgroundColor: "#F3F5F8",
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 18,
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
    color: "#182333",
  },
  topCopy: {
    flex: 1,
    alignItems: "center",
  },
  topEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#87909B",
  },
  topTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#172334",
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
    padding: 24,
    borderRadius: 30,
    backgroundColor: "#DCE8F5",
  },
  heroOrbOne: {
    position: "absolute",
    top: -70,
    right: -55,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  heroOrbTwo: {
    position: "absolute",
    left: -55,
    bottom: -78,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(164,194,224,0.45)",
  },
  adminIconCircle: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 41,
    backgroundColor: "#FFFFFF",
  },
  adminIcon: {
    fontSize: 40,
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 27,
    fontWeight: "900",
    color: "#14283D",
  },
  heroTitleTablet: {
    fontSize: 34,
  },
  heroText: {
    maxWidth: 360,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#5D6E7D",
    textAlign: "center",
  },
  formCard: {
    marginTop: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#DDE3E9",
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    shadowColor: "#627282",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    marginLeft: 4,
    marginBottom: 7,
    marginTop: 5,
    fontSize: 11,
    fontWeight: "900",
    color: "#52606E",
  },
  inputWrap: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#D8E0E7",
    borderRadius: 19,
    backgroundColor: "#F8FAFC",
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
    color: "#172334",
  },
  eyeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeText: {
    fontSize: 17,
  },
  loginButton: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 7,
    borderRadius: 31,
    backgroundColor: "#14283D",
    shadowColor: "#14283D",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
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
    backgroundColor: "#67B6E8",
  },
  loginIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  loginText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  loginArrow: {
    marginRight: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 14,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "#F2F6FA",
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
    color: "#687684",
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
    color: "#697783",
  },
});
