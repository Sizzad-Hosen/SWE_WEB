import React, { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import { SafeAreaView } from "../../../web/safe-area";

import { BottomNav } from "../../../components/BottomNav";
import { env } from "../../../config/env";
import { isSupabaseConfigured } from "../../../config/supabase";
import type { ScreenProps } from "../../../navigation/routes";
import { useStudentStore } from "../../student/store/studentStore";

const APP_VERSION = "1.0.0";

export default function SettingsScreen({
  navigation,
}: ScreenProps<"Settings">) {
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 700;

  const maxWidth = isTablet ? 760 : 560;
  const horizontalPadding = isSmallPhone
    ? 12
    : isTablet
      ? 28
      : 16;

  const student = useStudentStore(
    (state) => state.student,
  );
  const refreshParentLink = useStudentStore(
    (state) => state.linkParent,
  );

  const [refreshingLink, setRefreshingLink] =
    useState(false);

  const openUrl = async (
    url: string,
    title: string,
    missingMessage: string,
  ) => {
    if (!url) {
      Alert.alert(title, missingMessage);
      return;
    }

    try {
      const supported =
        await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "লিংক খোলা যায়নি",
          "এই device-এ linkটি খোলা যাচ্ছে না।",
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "লিংক খোলা যায়নি",
        "Internet connection পরীক্ষা করে আবার চেষ্টা করুন।",
      );
    }
  };

  const shareStudentId = async () => {
    if (!student) {
      Alert.alert(
        "Student profile নেই",
        "আগে student profile তৈরি করুন।",
      );
      return;
    }

    try {
      await Share.share({
        title: "NCTB Kids Student ID",
        message:
          `NCTB Kids Student ID: ${student.studentCode}\n` +
          `Class: ${student.classLevel}\n\n` +
          "Parent Dashboard থেকে এই ID ব্যবহার করে link request পাঠানো যাবে।",
      });
    } catch {
      Alert.alert(
        "Share করা যায়নি",
        "আবার চেষ্টা করুন।",
      );
    }
  };

  const handleRefreshParentLink =
    async () => {
      if (!student) {
        return;
      }

      setRefreshingLink(true);

      try {
        await refreshParentLink();

        const updated =
          useStudentStore.getState().student;

        Alert.alert(
          "Parent link status",
          updated?.parentLinked
            ? "এই Student profile Parent account-এর সঙ্গে linked আছে।"
            : "এখনো Parent account linked হয়নি। Parent Dashboard থেকে Student ID দিয়ে request পাঠান।",
        );
      } catch (error) {
        Alert.alert(
          "Status update হয়নি",
          error instanceof Error
            ? error.message
            : "আবার চেষ্টা করুন।",
        );
      } finally {
        setRefreshingLink(false);
      }
    };

  const openDeviceSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        "Settings খোলা যায়নি",
        "Device settings manually খুলুন।",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal:
                horizontalPadding,
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

              <View style={styles.headerCopy}>
                <Text
                  style={styles.headerEyebrow}
                >
                  APP CONTROL
                </Text>
                <Text style={styles.headerTitle}>
                  Settings
                </Text>
              </View>

              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.hero}>
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>
                  NCTB KIDS
                </Text>
                <Text
                  style={[
                    styles.heroTitle,
                    isSmallPhone &&
                      styles.heroTitleSmall,
                    isTablet &&
                      styles.heroTitleTablet,
                  ]}
                >
                  নিরাপদ শেখার
                  {"\n"}সব নিয়ন্ত্রণ
                </Text>
                <Text style={styles.heroText}>
                  Student profile, Parent access,
                  privacy এবং app information এক
                  জায়গায়।
                </Text>
              </View>

              <View
                style={styles.heroIconCircle}
              >
                <Text style={styles.heroIcon}>
                  ⚙️
                </Text>
              </View>

              <View style={styles.versionBadge}>
                <Text
                  style={styles.versionBadgeIcon}
                >
                  📱
                </Text>
                <Text
                  style={styles.versionBadgeText}
                >
                  Version {APP_VERSION}
                </Text>
              </View>
            </View>

            <SectionTitle
              eyebrow="STUDENT PROFILE"
              title="শিক্ষার্থীর তথ্য"
            />

            <View style={styles.profileCard}>
              <View style={styles.profileTop}>
                <View
                  style={
                    styles.studentAvatarCircle
                  }
                >
                  <Text
                    style={styles.studentAvatar}
                  >
                    {student?.avatar ?? "🐯"}
                  </Text>
                </View>

                <View style={styles.profileCopy}>
                  <Text
                    style={styles.profileName}
                    numberOfLines={1}
                  >
                    {student?.nickname &&
                    student.nickname !== "তুমি"
                      ? student.nickname
                      : "NCTB Kids Student"}
                  </Text>

                  <Text
                    style={styles.profileClass}
                  >
                    {student
                      ? `Class ${student.classLevel}`
                      : "Profile unavailable"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.linkBadge,
                    student?.parentLinked
                      ? styles.linkBadgeActive
                      : styles.linkBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.linkBadgeText,
                      student?.parentLinked
                        ? styles.linkBadgeTextActive
                        : styles.linkBadgeTextInactive,
                    ]}
                  >
                    {student?.parentLinked
                      ? "Linked"
                      : "Guest"}
                  </Text>
                </View>
              </View>

              {student ? (
                <View style={styles.studentIdCard}>
                  <View
                    style={
                      styles.studentIdIconCircle
                    }
                  >
                    <Text
                      style={styles.studentIdIcon}
                    >
                      🪪
                    </Text>
                  </View>

                  <View
                    style={styles.studentIdCopy}
                  >
                    <Text
                      style={styles.studentIdLabel}
                    >
                      STUDENT ID
                    </Text>
                    <Text
                      style={styles.studentIdValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {student.studentCode}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Student ID share করি"
                    onPress={() =>
                      void shareStudentId()
                    }
                    style={({ pressed }) => [
                      styles.shareButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={styles.shareIcon}
                    >
                      ↗
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={
                  !student || refreshingLink
                }
                onPress={() =>
                  void handleRefreshParentLink()
                }
                style={({ pressed }) => [
                  styles.refreshButton,
                  (!student ||
                    refreshingLink) &&
                    styles.disabled,
                  pressed &&
                    !refreshingLink &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={styles.refreshIcon}
                >
                  {refreshingLink ? "…" : "↻"}
                </Text>
                <Text
                  style={styles.refreshText}
                >
                  {refreshingLink
                    ? "Status update হচ্ছে…"
                    : "Parent link status refresh"}
                </Text>
              </Pressable>
            </View>

            <SectionTitle
              eyebrow="ADULT AREA"
              title="Parent ও Admin"
            />

            <View style={styles.menuCard}>
              <SettingRow
                icon="👪"
                iconBackground="#EEE6FF"
                title="Parent Area"
                subtitle="Child linking ও progress dashboard"
                onPress={() =>
                  navigation.navigate(
                    "AdultGate",
                    {
                      destination: "parent",
                    },
                  )
                }
              />
              <SettingRow
                icon="🛠️"
                iconBackground="#E3F1FA"
                title="Admin Panel"
                subtitle="Curriculum ও quiz content management"
                onPress={() =>
                  navigation.navigate(
                    "AdultGate",
                    {
                      destination: "admin",
                    },
                  )
                }
              />
              <SettingRow
                icon="❤️"
                iconBackground="#FFE3EC"
                title="সহযোগিতা করুন"
                subtitle="University prototype donation screen"
                onPress={() =>
                  navigation.navigate("Donation")
                }
                last
              />
            </View>

            <SectionTitle
              eyebrow="PRIVACY & SAFETY"
              title="গোপনীয়তা ও নিরাপত্তা"
            />

            <View style={styles.menuCard}>
              <SettingRow
                icon="🛡️"
                iconBackground="#E4F4E1"
                title="Privacy Policy"
                subtitle={
                  env.PRIVACY_POLICY_URL
                    ? "আপনার data কীভাবে ব্যবহৃত হয়"
                    : "URL এখনো configure করা হয়নি"
                }
                onPress={() =>
                  void openUrl(
                    env.PRIVACY_POLICY_URL,
                    "Privacy Policy",
                    "EXPO_PUBLIC_PRIVACY_POLICY_URL এখনো configure করা হয়নি।",
                  )
                }
              />
              <SettingRow
                icon="🗑️"
                iconBackground="#FFE7E7"
                title="Account ও data deletion"
                subtitle={
                  env.ACCOUNT_DELETION_URL
                    ? "Parent account deletion request"
                    : "Request URL configure করা হয়নি"
                }
                danger
                onPress={() =>
                  void openUrl(
                    env.ACCOUNT_DELETION_URL,
                    "Account deletion",
                    "EXPO_PUBLIC_ACCOUNT_DELETION_URL এখনো configure করা হয়নি।",
                  )
                }
              />
              <SettingRow
                icon="📱"
                iconBackground="#FFF1C8"
                title="Device app settings"
                subtitle="Permissions ও system settings"
                onPress={() =>
                  void openDeviceSettings()
                }
                last
              />
            </View>

            <SectionTitle
              eyebrow="APP INFORMATION"
              title="App সম্পর্কে"
            />

            <View style={styles.aboutCard}>
              <View style={styles.appLogoCircle}>
                <Text style={styles.appLogo}>
                  📚
                </Text>
              </View>

              <Text style={styles.appName}>
                NCTB Kids
              </Text>
              <Text style={styles.appDescription}>
                Classes 1–3-এর জন্য Bangla-first
                interactive NCTB learning app।
              </Text>

              <View style={styles.infoGrid}>
                <InfoPill
                  label="Version"
                  value={APP_VERSION}
                />
                <InfoPill
                  label="Curriculum"
                  value={
                    env.USE_REMOTE_CURRICULUM
                      ? "Remote"
                      : "Local"
                  }
                />
                <InfoPill
                  label="Cloud"
                  value={
                    isSupabaseConfigured
                      ? "Connected"
                      : "Offline"
                  }
                />
              </View>

              <View style={styles.safetyNote}>
                <Text
                  style={styles.safetyNoteIcon}
                >
                  🌱
                </Text>
                <Text
                  style={styles.safetyNoteText}
                >
                  শিশুদের জন্য সহজ, ad-free এবং
                  low-distraction শেখার অভিজ্ঞতা
                  তৈরি করাই এই app-এর লক্ষ্য।
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomNavWrap,
            {
              paddingHorizontal:
                horizontalPadding,
            },
          ]}
        >
          <View
            style={[
              styles.bottomNavShell,
              { maxWidth },
            ]}
          >
            <BottomNav
              navigation={navigation}
              active="Settings"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEyebrow}>
        {eyebrow}
      </Text>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>
    </View>
  );
}

function SettingRow({
  icon,
  iconBackground,
  title,
  subtitle,
  onPress,
  danger = false,
  last = false,
}: {
  icon: string;
  iconBackground: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        !last && styles.settingRowBorder,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.settingIconCircle,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <Text style={styles.settingIcon}>
          {icon}
        </Text>
      </View>

      <View style={styles.settingCopy}>
        <Text
          style={[
            styles.settingTitle,
            danger && styles.settingTitleDanger,
          ]}
        >
          {title}
        </Text>
        <Text style={styles.settingSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Text style={styles.settingArrow}>
        ›
      </Text>
    </Pressable>
  );
}

function InfoPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillLabel}>
        {label}
      </Text>
      <Text
        style={styles.infoPillValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F3F8",
  },

  page: {
    flex: 1,
    backgroundColor: "#F6F3F8",
  },

  scrollContent: {
    paddingTop: 7,
    paddingBottom: 112,
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

  headerCopy: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },

  headerEyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: "900",
    color: "#978D9B",
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#211D23",
  },

  headerSpacer: {
    width: 42,
  },

  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },

  disabled: {
    opacity: 0.55,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: 245,
    padding: 23,
    borderRadius: 30,
    backgroundColor: "#CBBBF2",
  },

  heroOrbOne: {
    position: "absolute",
    top: -83,
    right: -62,
    width: 225,
    height: 225,
    borderRadius: 113,
    backgroundColor:
      "rgba(255,255,255,0.24)",
  },

  heroOrbTwo: {
    position: "absolute",
    left: -70,
    bottom: -95,
    width: 215,
    height: 215,
    borderRadius: 108,
    backgroundColor:
      "rgba(255,255,255,0.18)",
  },

  heroCopy: {
    zIndex: 2,
    width: "65%",
  },

  heroEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#5E5272",
  },

  heroTitle: {
    marginTop: 6,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    color: "#171419",
  },

  heroTitleSmall: {
    fontSize: 26,
    lineHeight: 32,
  },

  heroTitleTablet: {
    fontSize: 40,
    lineHeight: 47,
  },

  heroText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#5D5264",
  },

  heroIconCircle: {
    position: "absolute",
    top: 28,
    right: 23,
    width: 108,
    height: 108,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 54,
    backgroundColor:
      "rgba(255,255,255,0.48)",
  },

  heroIcon: {
    fontSize: 49,
  },

  versionBadge: {
    position: "absolute",
    left: 23,
    bottom: 22,
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  versionBadgeIcon: {
    fontSize: 15,
  },

  versionBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#514858",
  },

  sectionHeader: {
    marginTop: 23,
    marginBottom: 10,
  },

  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: "900",
    color: "#968D99",
  },

  sectionTitle: {
    marginTop: 3,
    fontSize: 20,
    fontWeight: "900",
    color: "#1D191F",
  },

  profileCard: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  studentAvatarCircle: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: "#EEE6FF",
  },

  studentAvatar: {
    fontSize: 30,
  },

  profileCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  profileName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#302A32",
  },

  profileClass: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: "700",
    color: "#817884",
  },

  linkBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
  },

  linkBadgeActive: {
    backgroundColor: "#E1F3E4",
  },

  linkBadgeInactive: {
    backgroundColor: "#F2EEF5",
  },

  linkBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  linkBadgeTextActive: {
    color: "#438455",
  },

  linkBadgeTextInactive: {
    color: "#7D7480",
  },

  studentIdCard: {
    minHeight: 63,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
    padding: 9,
    borderRadius: 19,
    backgroundColor: "#F7F4F9",
  },

  studentIdIconCircle: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
  },

  studentIdIcon: {
    fontSize: 19,
  },

  studentIdCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
  },

  studentIdLabel: {
    fontSize: 7,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#958B98",
  },

  studentIdValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "900",
    color: "#514858",
  },

  shareButton: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#1A171C",
  },

  shareIcon: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  refreshButton: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#D9D2DE",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },

  refreshIcon: {
    fontSize: 17,
    fontWeight: "900",
    color: "#7553BA",
  },

  refreshText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#5B535E",
  },

  menuCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  settingRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
  },

  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E9E4EB",
  },

  settingIconCircle: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
  },

  settingIcon: {
    fontSize: 21,
  },

  settingCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  settingTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#3A343D",
  },

  settingTitleDanger: {
    color: "#A94E4E",
  },

  settingSubtitle: {
    marginTop: 3,
    fontSize: 8,
    lineHeight: 12,
    fontWeight: "700",
    color: "#8B828E",
  },

  settingArrow: {
    marginTop: -3,
    fontSize: 25,
    color: "#8C838F",
  },

  aboutCard: {
    alignItems: "center",
    padding: 18,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },

  appLogoCircle: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 35,
    backgroundColor: "#EEE6FF",
  },

  appLogo: {
    fontSize: 34,
  },

  appName: {
    marginTop: 9,
    fontSize: 20,
    fontWeight: "900",
    color: "#29242B",
  },

  appDescription: {
    maxWidth: 390,
    marginTop: 5,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#7C737F",
    textAlign: "center",
  },

  infoGrid: {
    width: "100%",
    flexDirection: "row",
    gap: 7,
    marginTop: 15,
  },

  infoPill: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 11,
    borderRadius: 17,
    backgroundColor: "#F7F4F9",
  },

  infoPillLabel: {
    fontSize: 7,
    fontWeight: "800",
    color: "#958C98",
  },

  infoPillValue: {
    maxWidth: "100%",
    marginTop: 3,
    fontSize: 10,
    fontWeight: "900",
    color: "#514A54",
  },

  safetyNote: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "#E7F4E5",
  },

  safetyNoteIcon: {
    fontSize: 17,
  },

  safetyNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 8,
    lineHeight: 13,
    fontWeight: "700",
    color: "#52734F",
  },

  bottomNavWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 7,
  },

  bottomNavShell: {
    width: "100%",
    alignSelf: "center",
  },
});
