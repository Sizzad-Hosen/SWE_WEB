import React, {
  useCallback,
  useEffect,
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
import type { NativeStackScreenProps } from "../../../web/navigation";

import { useAuth } from "../../../contexts/AuthContext";
import type { GateStackParamList } from "../../../navigation/gateRoutes";
import {
  parentService,
  type ParentChild,
} from "../../parent/services/parentService";
import { useStudentStore } from "../store/studentStore";

type Props = NativeStackScreenProps<
  GateStackParamList,
  "ParentLinkedRecovery"
>;

function avatarEmoji(
  avatarKey: string,
) {
  const normalized =
    avatarKey.toLowerCase();

  if (normalized.includes("lion")) {
    return "🦁";
  }

  if (normalized.includes("panda")) {
    return "🐼";
  }

  if (normalized.includes("mimi")) {
    return "👧";
  }

  return "🐯";
}

function friendlyError(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "invalid login credentials",
    )
  ) {
    return "Email অথবা password সঠিক নয়।";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch")
  ) {
    return "Internet connection পরীক্ষা করে আবার চেষ্টা করুন।";
  }

  if (
    normalized.includes(
      "do not have parent access",
    ) ||
    normalized.includes(
      "not linked",
    )
  ) {
    return "এই child accountটি বর্তমান Parent account-এর সঙ্গে linked নয়।";
  }

  return (
    message ||
    "Recovery সম্পন্ন হয়নি। আবার চেষ্টা করুন।"
  );
}

export default function ParentLinkedRecoveryScreen({
  navigation,
}: Props) {
  const { width } =
    useWindowDimensions();

  const isTablet = width >= 600;
  const maxWidth =
    isTablet ? 720 : 540;

  const {
    user,
    isAuthenticated,
    loading: authLoading,
    login,
    logout,
  } = useAuth();

  const restoreLinkedChild =
    useStudentStore(
      (state) =>
        state.restoreLinkedChild,
    );

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [children, setChildren] =
    useState<ParentChild[]>([]);
  const [loadingChildren, setLoadingChildren] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [recoveringId, setRecoveringId] =
    useState("");
  const [loadError, setLoadError] =
    useState("");

  const loadChildren =
    useCallback(async () => {
      setLoadingChildren(true);
      setLoadError("");

      try {
        const result =
          await parentService
            .getChildren();

        setChildren(result);
      } catch (error) {
        setChildren([]);
        setLoadError(
          friendlyError(error),
        );
      } finally {
        setLoadingChildren(false);
      }
    }, []);

  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated
    ) {
      void loadChildren();
    }
  }, [
    authLoading,
    isAuthenticated,
    loadChildren,
  ]);

  const handleLogin = async () => {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !password
    ) {
      Alert.alert(
        "তথ্য প্রয়োজন",
        "Parent email এবং password লিখুন।",
      );
      return;
    }

    setSubmitting(true);

    try {
      await login({
        email: normalizedEmail,
        password,
      });

      await loadChildren();
    } catch (error) {
      Alert.alert(
        "Login হয়নি",
        friendlyError(error),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const recoverChild = async (
    child: ParentChild,
  ) => {
    setRecoveringId(child.id);

    try {
      await restoreLinkedChild(
        child.id,
      );
    } catch (error) {
      setRecoveringId("");

      Alert.alert(
        "Child account ফিরিয়ে আনা যায়নি",
        friendlyError(error),
      );
    }
  };

  const confirmRecovery = (
    child: ParentChild,
  ) => {
    Alert.alert(
      "এই child account ফিরিয়ে আনবেন?",
      `${child.displayName} — Class ${child.classLevel}\n\nএই deviceটি নতুন active child device হবে। আগের device-এর child access বন্ধ হবে।`,
      [
        {
          text: "না",
          style: "cancel",
        },
        {
          text: "ফিরিয়ে আনুন",
          onPress: () =>
            void recoverChild(child),
        },
      ],
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      setChildren([]);
      setEmail("");
      setPassword("");
    } catch (error) {
      Alert.alert(
        "Logout হয়নি",
        friendlyError(error),
      );
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator
            size="large"
            color="#7553BA"
          />
          <Text style={styles.centerTitle}>
            Parent account পরীক্ষা হচ্ছে…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
              { maxWidth },
            ]}
          >
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="ফিরে যাই"
                disabled={
                  submitting ||
                  Boolean(recoveringId)
                }
                onPress={() =>
                  navigation.goBack()
                }
                style={({ pressed }) => [
                  styles.backButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text style={styles.backIcon}>
                  ‹
                </Text>
              </Pressable>

              <View style={styles.headerCopy}>
                <Text
                  style={styles.headerEyebrow}
                >
                  PARENT RECOVERY
                </Text>
                <Text
                  style={styles.headerTitle}
                >
                  সন্তানের Account ফিরিয়ে আনুন
                </Text>
              </View>

              <View
                style={styles.headerSpacer}
              />
            </View>

            <View style={styles.hero}>
              <View
                style={styles.heroOrbOne}
              />
              <View
                style={styles.heroOrbTwo}
              />

              <View
                style={styles.heroIconCircle}
              >
                <Text style={styles.heroIcon}>
                  👪
                </Text>
              </View>

              <Text style={styles.heroTitle}>
                Parent Login দিয়েই{"\n"}
                শেখা ফিরে আসবে
              </Text>

              <Text style={styles.heroText}>
                Parent account-এর সঙ্গে linked
                child নির্বাচন করলে profile,
                completed chapters, stars এবং
                unlocked lessons এই device-এ
                restore হবে।
              </Text>
            </View>

            {!isAuthenticated ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={styles.cardIconCircle}
                  >
                    <Text
                      style={styles.cardIcon}
                    >
                      🔐
                    </Text>
                  </View>

                  <View
                    style={styles.cardHeaderCopy}
                  >
                    <Text
                      style={styles.cardEyebrow}
                    >
                      PARENT SIGN IN
                    </Text>
                    <Text
                      style={styles.cardTitle}
                    >
                      Parent account-এ Login
                    </Text>
                  </View>
                </View>

                <Text style={styles.label}>
                  Parent email
                </Text>

                <View
                  style={styles.inputWrap}
                >
                  <Text
                    style={styles.inputIcon}
                  >
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
                    returnKeyType="next"
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>
                  Password
                </Text>

                <View
                  style={styles.inputWrap}
                >
                  <Text
                    style={styles.inputIcon}
                  >
                    🔑
                  </Text>

                  <TextInput
                    value={password}
                    editable={!submitting}
                    onChangeText={setPassword}
                    secureTextEntry={
                      !showPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Password"
                    placeholderTextColor="#AAA1AE"
                    returnKeyType="done"
                    onSubmitEditing={() =>
                      void handleLogin()
                    }
                    style={styles.input}
                  />

                  <Pressable
                    accessibilityRole="button"
                    disabled={submitting}
                    onPress={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    style={styles.eyeButton}
                  >
                    <Text
                      style={styles.eyeIcon}
                    >
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
                    styles.primaryButton,
                    submitting &&
                      styles.disabledButton,
                    pressed &&
                      !submitting &&
                      styles.primaryPressed,
                  ]}
                >
                  <View
                    style={styles.primaryIconCircle}
                  >
                    <Text
                      style={styles.primaryIcon}
                    >
                      {submitting
                        ? "…"
                        : "✓"}
                    </Text>
                  </View>

                  <Text
                    style={styles.primaryText}
                  >
                    {submitting
                      ? "Login হচ্ছে…"
                      : "Linked children দেখুন"}
                  </Text>

                  {submitting ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={styles.primaryArrow}
                    >
                      →
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.accountRow}>
                  <View
                    style={styles.accountIconCircle}
                  >
                    <Text
                      style={styles.accountIcon}
                    >
                      ✓
                    </Text>
                  </View>

                  <View
                    style={styles.accountCopy}
                  >
                    <Text
                      style={styles.accountLabel}
                    >
                      LOGGED IN AS
                    </Text>
                    <Text
                      style={styles.accountValue}
                      numberOfLines={1}
                    >
                      {user?.name ??
                        user?.email ??
                        "Parent"}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    disabled={
                      Boolean(
                        recoveringId,
                      )
                    }
                    onPress={() =>
                      void handleLogout()
                    }
                    style={({ pressed }) => [
                      styles.logoutButton,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={styles.logoutText}
                    >
                      অন্য Account
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={styles.sectionHeader}
                >
                  <Text
                    style={styles.sectionEyebrow}
                  >
                    LINKED CHILDREN
                  </Text>
                  <Text
                    style={styles.sectionTitle}
                  >
                    যাকে ফিরিয়ে আনবেন
                  </Text>
                </View>

                {loadingChildren ? (
                  <View
                    style={styles.loadingBox}
                  >
                    <ActivityIndicator
                      size="small"
                      color="#7553BA"
                    />
                    <Text
                      style={styles.loadingText}
                    >
                      Linked children খোঁজা
                      হচ্ছে…
                    </Text>
                  </View>
                ) : null}

                {loadError ? (
                  <View
                    style={styles.errorBox}
                  >
                    <Text
                      style={styles.errorIcon}
                    >
                      ⚠️
                    </Text>
                    <View
                      style={styles.errorCopy}
                    >
                      <Text
                        style={styles.errorTitle}
                      >
                        Data load হয়নি
                      </Text>
                      <Text
                        style={styles.errorText}
                      >
                        {loadError}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        void loadChildren()
                      }
                      style={styles.retryButton}
                    >
                      <Text
                        style={styles.retryText}
                      >
                        আবার
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {!loadingChildren &&
                !loadError &&
                children.length === 0 ? (
                  <View
                    style={styles.emptyBox}
                  >
                    <Text
                      style={styles.emptyIcon}
                    >
                      👧
                    </Text>
                    <Text
                      style={styles.emptyTitle}
                    >
                      Linked child পাওয়া যায়নি
                    </Text>
                    <Text
                      style={styles.emptyText}
                    >
                      এই Parent account-এর সঙ্গে
                      এখনো কোনো approved child
                      account linked নেই।
                    </Text>
                  </View>
                ) : null}

                <View
                  style={styles.childrenList}
                >
                  {children.map(
                    (child) => {
                      const recovering =
                        recoveringId ===
                        child.id;

                      return (
                        <View
                          key={child.id}
                          style={
                            styles.childCard
                          }
                        >
                          <View
                            style={
                              styles.childTop
                            }
                          >
                            <View
                              style={
                                styles.childAvatar
                              }
                            >
                              <Text
                                style={
                                  styles.childAvatarText
                                }
                              >
                                {avatarEmoji(
                                  child.avatarKey,
                                )}
                              </Text>
                            </View>

                            <View
                              style={
                                styles.childCopy
                              }
                            >
                              <Text
                                style={
                                  styles.childName
                                }
                                numberOfLines={
                                  1
                                }
                              >
                                {child.displayName}
                              </Text>

                              <Text
                                style={
                                  styles.childMeta
                                }
                              >
                                Class{" "}
                                {
                                  child.classLevel
                                }{" "}
                                ·{" "}
                                {
                                  child.studentCode
                                }
                              </Text>
                            </View>

                            <View
                              style={
                                styles.starBadge
                              }
                            >
                              <Text
                                style={
                                  styles.starText
                                }
                              >
                                ⭐{" "}
                                {
                                  child.totalStars
                                }
                              </Text>
                            </View>
                          </View>

                          <View
                            style={
                              styles.progressRow
                            }
                          >
                            <View
                              style={
                                styles.progressTrack
                              }
                            >
                              <View
                                style={[
                                  styles.progressFill,
                                  {
                                    width:
                                      `${Math.max(
                                        0,
                                        Math.min(
                                          100,
                                          child.totalProgress,
                                        ),
                                      )}%`,
                                  },
                                ]}
                              />
                            </View>

                            <Text
                              style={
                                styles.progressValue
                              }
                            >
                              {Math.round(
                                child.totalProgress,
                              )}
                              %
                            </Text>
                          </View>

                          <Pressable
                            accessibilityRole="button"
                            disabled={
                              Boolean(
                                recoveringId,
                              )
                            }
                            onPress={() =>
                              confirmRecovery(
                                child,
                              )
                            }
                            style={({
                              pressed,
                            }) => [
                              styles.recoverButton,
                              recovering &&
                                styles.disabledButton,
                              pressed &&
                                !recoveringId &&
                                styles.primaryPressed,
                            ]}
                          >
                            <Text
                              style={
                                styles.recoverIcon
                              }
                            >
                              ↻
                            </Text>
                            <Text
                              style={
                                styles.recoverText
                              }
                            >
                              {recovering
                                ? "Account ফিরিয়ে আনা হচ্ছে…"
                                : "এই device-এ ফিরিয়ে আনুন"}
                            </Text>
                            {recovering ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <Text
                                style={
                                  styles.recoverArrow
                                }
                              >
                                ›
                              </Text>
                            )}
                          </Pressable>
                        </View>
                      );
                    },
                  )}
                </View>
              </View>
            )}

            <View
              style={styles.backupCard}
            >
              <Text
                style={styles.backupIcon}
              >
                🔑
              </Text>

              <View
                style={styles.backupCopy}
              >
                <Text
                  style={styles.backupTitle}
                >
                  Parent account দিয়ে সম্ভব নয়?
                </Text>
                <Text
                  style={styles.backupText}
                >
                  Student ID ও Recovery Code দিয়ে
                  backup recovery ব্যবহার করুন।
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={
                  Boolean(recoveringId)
                }
                onPress={() =>
                  navigation.navigate(
                    "StudentRecovery",
                  )
                }
                style={({ pressed }) => [
                  styles.backupButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={styles.backupButtonText}
                >
                  খুলুন
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
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
      fontSize: 15,
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
      backgroundColor:
        "rgba(255,255,255,0.24)",
    },
    heroOrbTwo: {
      position: "absolute",
      left: -55,
      bottom: -95,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor:
        "rgba(255,255,255,0.17)",
    },
    heroIconCircle: {
      width: 72,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 5,
      borderColor:
        "rgba(255,255,255,0.8)",
      borderRadius: 36,
      backgroundColor:
        "rgba(255,255,255,0.45)",
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
      maxWidth: 560,
      marginTop: 9,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: "700",
      color: "#554B5B",
    },
    card: {
      marginTop: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: "#E1DCE5",
      borderRadius: 26,
      backgroundColor: "#FFFFFF",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    cardIconCircle: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 24,
      backgroundColor: "#EEE6FF",
    },
    cardIcon: {
      fontSize: 23,
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
      marginTop: 3,
      fontSize: 17,
      fontWeight: "900",
      color: "#29242B",
    },
    label: {
      marginTop: 8,
      marginBottom: 7,
      marginLeft: 4,
      fontSize: 11,
      fontWeight: "900",
      color: "#5A525D",
    },
    inputWrap: {
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      borderWidth: 2,
      borderColor: "#E2DCE7",
      borderRadius: 20,
      backgroundColor: "#FAF8FB",
    },
    inputIcon: {
      fontSize: 20,
    },
    input: {
      flex: 1,
      marginLeft: 9,
      paddingVertical: 13,
      fontSize: 15,
      fontWeight: "800",
      color: "#2D2730",
    },
    eyeButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    eyeIcon: {
      fontSize: 18,
    },
    primaryButton: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      paddingHorizontal: 8,
      borderRadius: 31,
      backgroundColor: "#17151A",
    },
    primaryIconCircle: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: "#FFFFFF",
      borderRadius: 24,
      backgroundColor: "#9A78DB",
    },
    primaryIcon: {
      fontSize: 20,
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
      fontSize: 23,
      color: "#FFFFFF",
    },
    primaryPressed: {
      transform: [
        { translateY: 3 },
      ],
    },
    disabledButton: {
      opacity: 0.62,
    },
    accountRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 11,
      borderRadius: 20,
      backgroundColor: "#E7F4E5",
    },
    accountIconCircle: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      backgroundColor: "#55B94B",
    },
    accountIcon: {
      fontSize: 18,
      fontWeight: "900",
      color: "#FFFFFF",
    },
    accountCopy: {
      flex: 1,
      minWidth: 0,
      marginLeft: 10,
    },
    accountLabel: {
      fontSize: 7,
      letterSpacing: 1,
      fontWeight: "900",
      color: "#668264",
    },
    accountValue: {
      marginTop: 3,
      fontSize: 12,
      fontWeight: "900",
      color: "#3F5F3C",
    },
    logoutButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 15,
      backgroundColor: "#FFFFFF",
    },
    logoutText: {
      fontSize: 9,
      fontWeight: "900",
      color: "#685D6B",
    },
    sectionHeader: {
      marginTop: 18,
      marginBottom: 10,
    },
    sectionEyebrow: {
      fontSize: 8,
      letterSpacing: 1.3,
      fontWeight: "900",
      color: "#958B98",
    },
    sectionTitle: {
      marginTop: 3,
      fontSize: 19,
      fontWeight: "900",
      color: "#29242B",
    },
    loadingBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      padding: 17,
      borderRadius: 20,
      backgroundColor: "#F7F4F9",
    },
    loadingText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#6F6573",
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 20,
      backgroundColor: "#FFE7E7",
    },
    errorIcon: {
      fontSize: 20,
    },
    errorCopy: {
      flex: 1,
      marginLeft: 9,
    },
    errorTitle: {
      fontSize: 11,
      fontWeight: "900",
      color: "#8B4747",
    },
    errorText: {
      marginTop: 3,
      fontSize: 9,
      lineHeight: 14,
      fontWeight: "700",
      color: "#9A5E5E",
    },
    retryButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: "#FFFFFF",
    },
    retryText: {
      fontSize: 9,
      fontWeight: "900",
      color: "#8B4747",
    },
    emptyBox: {
      alignItems: "center",
      padding: 20,
      borderRadius: 22,
      backgroundColor: "#F7F4F9",
    },
    emptyIcon: {
      fontSize: 32,
    },
    emptyTitle: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: "900",
      color: "#514A54",
    },
    emptyText: {
      maxWidth: 360,
      marginTop: 5,
      fontSize: 10,
      lineHeight: 16,
      fontWeight: "700",
      color: "#817884",
      textAlign: "center",
    },
    childrenList: {
      gap: 11,
    },
    childCard: {
      padding: 13,
      borderWidth: 1,
      borderColor: "#E3DDE7",
      borderRadius: 23,
      backgroundColor: "#FAF8FB",
    },
    childTop: {
      flexDirection: "row",
      alignItems: "center",
    },
    childAvatar: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 26,
      backgroundColor: "#EEE6FF",
    },
    childAvatarText: {
      fontSize: 28,
    },
    childCopy: {
      flex: 1,
      minWidth: 0,
      marginLeft: 10,
    },
    childName: {
      fontSize: 15,
      fontWeight: "900",
      color: "#342E36",
    },
    childMeta: {
      marginTop: 4,
      fontSize: 8,
      fontWeight: "700",
      color: "#887E8B",
    },
    starBadge: {
      paddingHorizontal: 9,
      paddingVertical: 7,
      borderRadius: 15,
      backgroundColor: "#FFF1C8",
    },
    starText: {
      fontSize: 9,
      fontWeight: "900",
      color: "#8A6A1E",
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
    },
    progressTrack: {
      flex: 1,
      height: 9,
      overflow: "hidden",
      borderRadius: 5,
      backgroundColor: "#E8E2EB",
    },
    progressFill: {
      height: "100%",
      borderRadius: 5,
      backgroundColor: "#55B94B",
    },
    progressValue: {
      width: 42,
      marginLeft: 8,
      fontSize: 10,
      fontWeight: "900",
      color: "#625967",
      textAlign: "right",
    },
    recoverButton: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 12,
      paddingHorizontal: 14,
      borderRadius: 25,
      backgroundColor: "#17151A",
    },
    recoverIcon: {
      fontSize: 19,
      fontWeight: "900",
      color: "#FFFFFF",
    },
    recoverText: {
      flex: 1,
      fontSize: 11,
      fontWeight: "900",
      color: "#FFFFFF",
      textAlign: "center",
    },
    recoverArrow: {
      fontSize: 24,
      color: "#FFFFFF",
    },
    backupCard: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 14,
      padding: 13,
      borderRadius: 22,
      backgroundColor: "#FFF1C8",
    },
    backupIcon: {
      fontSize: 23,
    },
    backupCopy: {
      flex: 1,
      marginLeft: 10,
    },
    backupTitle: {
      fontSize: 11,
      fontWeight: "900",
      color: "#5F512C",
    },
    backupText: {
      marginTop: 3,
      fontSize: 9,
      lineHeight: 14,
      fontWeight: "700",
      color: "#786A43",
    },
    backupButton: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: "#FFFFFF",
    },
    backupButtonText: {
      fontSize: 9,
      fontWeight: "900",
      color: "#7553BA",
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    centerTitle: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: "900",
      color: "#5E5562",
    },
    pressed: {
      transform: [
        { scale: 0.97 },
      ],
      opacity: 0.88,
    },
  });
