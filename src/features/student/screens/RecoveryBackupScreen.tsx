import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import { SafeAreaView } from "../../../web/safe-area";

import { useStudentStore } from "../store/studentStore";

export default function RecoveryBackupScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const student = useStudentStore(
    (state) => state.student,
  );
  const acknowledgeRecovery = useStudentStore(
    (state) => state.acknowledgeRecovery,
  );

  const [confirmed, setConfirmed] =
    useState(false);
  const [saving, setSaving] = useState(false);

  if (!student || !student.recoveryCode) {
    return null;
  }

  const shareCredentials = async () => {
    try {
      await Share.share({
        title: "NCTB Kids Recovery Details",
        message:
          "NCTB Kids Student Recovery Details\n\n" +
          `Student ID: ${student.studentCode}\n` +
          `Recovery Code: ${student.recoveryCode}\n` +
          `Class: ${student.classLevel}\n\n` +
          "এই তথ্য নিরাপদ স্থানে রাখুন। Student ID এবং Recovery Code একসঙ্গে ব্যবহার করে account restore করা যায়।",
      });
    } catch {
      Alert.alert(
        "Share করা যায়নি",
        "Student ID ও Recovery Code লিখে নিরাপদ স্থানে রাখুন।",
      );
    }
  };

  const continueToApp = async () => {
    if (!confirmed || saving) {
      return;
    }

    setSaving(true);

    try {
      await acknowledgeRecovery();
    } catch (error) {
      setSaving(false);
      Alert.alert(
        "Save হয়নি",
        error instanceof Error
          ? error.message
          : "আবার চেষ্টা করুন।",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
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
          <View style={styles.hero}>
            <View style={styles.heroOrbOne} />
            <View style={styles.heroOrbTwo} />

            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🔐</Text>
            </View>

            <Text style={styles.eyebrow}>
              ONE IMPORTANT STEP
            </Text>
            <Text style={styles.title}>
              Recovery তথ্য{"\n"}নিরাপদে রাখো
            </Text>
            <Text style={styles.subtitle}>
              App delete, phone change বা data
              হারিয়ে গেলে এই দুইটি তথ্য দিয়ে
              account ও শেখার progress ফিরিয়ে
              আনা যাবে।
            </Text>
          </View>

          <View style={styles.credentialsCard}>
            <CredentialRow
              icon="🪪"
              label="STUDENT ID"
              value={student.studentCode}
            />

            <View style={styles.divider} />

            <CredentialRow
              icon="🔑"
              label="RECOVERY CODE"
              value={student.recoveryCode}
              important
            />

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                void shareCredentials()
              }
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.shareIcon}>
                ↗
              </Text>
              <Text style={styles.shareText}>
                Parent-এর কাছে Share করে রাখি
              </Text>
            </Pressable>
          </View>

          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>
              ⚠️
            </Text>
            <Text style={styles.warningText}>
              Recovery Code কাউকে প্রকাশ করবে
              না। Parent বা বিশ্বস্ত অভিভাবকের
              কাছে নিরাপদে রাখবে।
            </Text>
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: confirmed,
            }}
            onPress={() =>
              setConfirmed((value) => !value)
            }
            style={({ pressed }) => [
              styles.confirmRow,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.checkbox,
                confirmed &&
                  styles.checkboxSelected,
              ]}
            >
              {confirmed ? (
                <Text style={styles.checkmark}>
                  ✓
                </Text>
              ) : null}
            </View>

            <Text style={styles.confirmText}>
              আমি Student ID ও Recovery Code
              নিরাপদে সংরক্ষণ করেছি।
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!confirmed || saving}
            onPress={() =>
              void continueToApp()
            }
            style={({ pressed }) => [
              styles.primaryButton,
              (!confirmed || saving) &&
                styles.primaryButtonDisabled,
              pressed &&
                confirmed &&
                !saving &&
                styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryIcon}>
              📚
            </Text>
            <Text style={styles.primaryText}>
              {saving
                ? "Save হচ্ছে…"
                : "শেখা শুরু করি"}
            </Text>
            <Text style={styles.primaryArrow}>
              ›
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CredentialRow({
  icon,
  label,
  value,
  important = false,
}: {
  icon: string;
  label: string;
  value: string;
  important?: boolean;
}) {
  return (
    <View style={styles.credentialRow}>
      <View style={styles.credentialIconCircle}>
        <Text style={styles.credentialIcon}>
          {icon}
        </Text>
      </View>

      <View style={styles.credentialCopy}>
        <Text style={styles.credentialLabel}>
          {label}
        </Text>
        <Text
          selectable
          style={[
            styles.credentialValue,
            important &&
              styles.credentialValueImportant,
          ]}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F3F8",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 18,
    paddingBottom: 28,
  },
  shell: {
    width: "100%",
    alignSelf: "center",
  },
  hero: {
    overflow: "hidden",
    padding: 24,
    borderRadius: 32,
    backgroundColor: "#CBBBF2",
  },
  heroOrbOne: {
    position: "absolute",
    top: -75,
    right: -55,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  heroOrbTwo: {
    position: "absolute",
    left: -60,
    bottom: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.17)",
  },
  iconCircle: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.78)",
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.48)",
  },
  icon: {
    fontSize: 37,
  },
  eyebrow: {
    marginTop: 18,
    fontSize: 9,
    letterSpacing: 1.7,
    fontWeight: "900",
    color: "#5E5272",
  },
  title: {
    marginTop: 6,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "900",
    color: "#171419",
  },
  subtitle: {
    maxWidth: 520,
    marginTop: 9,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: "#554B5B",
  },
  credentialsCard: {
    marginTop: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
  },
  credentialRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
  },
  credentialIconCircle: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    backgroundColor: "#EEE6FF",
  },
  credentialIcon: {
    fontSize: 23,
  },
  credentialCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  credentialLabel: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#918794",
  },
  credentialValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#403843",
  },
  credentialValueImportant: {
    color: "#7553BA",
  },
  divider: {
    height: 1,
    marginVertical: 4,
    backgroundColor: "#ECE7EE",
  },
  shareButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 12,
    borderRadius: 26,
    backgroundColor: "#EEE6FF",
  },
  shareIcon: {
    fontSize: 19,
    fontWeight: "900",
    color: "#6545A8",
  },
  shareText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6545A8",
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 13,
    padding: 13,
    borderRadius: 20,
    backgroundColor: "#FFF1C8",
  },
  warningIcon: {
    fontSize: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#75683F",
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: "#DED7E3",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  checkbox: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#B9AFBE",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: {
    borderColor: "#55B94B",
    backgroundColor: "#55B94B",
  },
  checkmark: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  confirmText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "800",
    color: "#554D58",
  },
  primaryButton: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 18,
    borderRadius: 32,
    backgroundColor: "#17151A",
  },
  primaryButtonDisabled: {
    backgroundColor: "#C8C3CC",
  },
  primaryButtonPressed: {
    transform: [{ translateY: 3 }],
  },
  primaryIcon: {
    fontSize: 23,
  },
  primaryText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  primaryArrow: {
    fontSize: 29,
    color: "#FFFFFF",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
});
