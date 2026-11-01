import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import { SafeAreaView } from "../../../web/safe-area";
import * as Speech from "../../../web/speech";

import type { ScreenProps } from "../../../navigation/routes";
import { BottomNav } from "../../../components/BottomNav";
import { env } from "../../../config/env";
import { useGamificationStore } from "../../gamification/store/gamificationStore";
import { ParentLinkRequestModal } from "../../parent/components/ParentLinkRequestModal";
import { useStudentStore } from "../../student/store/studentStore";
import { getSubjects } from "../data/curriculum";

type Subject = {
  id: string;
  title_bn: string;
  subtitle: string;
  color: string;
  icon: string;
};

type SubjectStyle = {
  backgroundColor: string;
  accentColor: string;
};

function getSubjectStyle(subject: Subject): SubjectStyle {
  const key = `${subject.id} ${subject.title_bn}`.toLowerCase();

  if (key.includes("english") || key.includes("ইংরেজি")) {
    return {
      backgroundColor: "#F0E7FF",
      accentColor: "#7A55C7",
    };
  }

  if (key.includes("math") || key.includes("গণিত")) {
    return {
      backgroundColor: "#FFF1C9",
      accentColor: "#E59C16",
    };
  }

  return {
    backgroundColor: "#DFF3FF",
    accentColor: "#2794CF",
  };
}

export default function SubjectSelectionScreen({
  navigation,
}: ScreenProps<"Subjects">) {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortScreen = height < 760;
  const isTablet = width >= 600;

  const maxWidth = isTablet ? 760 : 560;
  const horizontalPadding = isSmallPhone ? 12 : isTablet ? 28 : 16;
  const heroHeight = isTablet ? 280 : isShortScreen ? 205 : 230;
  const guideSize = isTablet ? 220 : isSmallPhone ? 135 : 165;

  const student = useStudentStore((state) => state.student);
  const refreshParentLink = useStudentStore((state) => state.linkParent);

  const stars = useGamificationStore((state) => state.stars);
  const streak = useGamificationStore((state) => state.streak);
  const completed = useGamificationStore(
    (state) => Object.keys(state.completedChapters).length,
  );

  const classId = student?.classLevel ?? 1;

  const subjects: Subject[] = useMemo(
    () =>
      getSubjects(classId).map((subject) => ({
        id: subject.id,
        title_bn: subject.title_bn,
        subtitle: subject.subtitle,
        color: subject.color,
        icon: subject.icon,
      })),
    [classId],
  );

  const subjectCards = useMemo(
    () =>
      subjects.map((subject) => ({
        ...subject,
        visual: getSubjectStyle(subject),
      })),
    [subjects],
  );

  const [speaking, setSpeaking] = useState(false);

  const nickname =
    student?.nickname &&
    student.nickname.trim() &&
    student.nickname !== "তুমি"
      ? student.nickname
      : "বন্ধু";

  const guideMessage =
    `হ্যালো ${nickname}! আজ তুমি কোন বিষয় শিখতে চাও? নিচের একটি বই বেছে নাও।`;

  const speakGuide = useCallback(() => {
    void Speech.stop();

    Speech.speak(guideMessage, {
      language: "bn-BD",
      rate: 0.8,
      pitch: 1.05,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [guideMessage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      speakGuide();
    }, 600);

    return () => {
      clearTimeout(timer);
      void Speech.stop();
    };
  }, [speakGuide]);

  const openStudentId = () => {
    if (!student) {
      return;
    }

    Alert.alert(
      "Student ID",
      `${student.studentCode}\n\n${
        student.parentLinked
          ? "এই profile Parent account-এর সঙ্গে যুক্ত আছে।"
          : "Parent Dashboard থেকে এই ID ব্যবহার করে Link Request পাঠানো যাবে।"
      }`,
    );
  };

  const openPrivacyPolicy = () => {
    if (!env.PRIVACY_POLICY_URL) {
      Alert.alert(
        "Privacy Policy",
        "Privacy Policy URL এখনো configure করা হয়নি।",
      );
      return;
    }

    void Linking.openURL(env.PRIVACY_POLICY_URL).catch(() => {
      Alert.alert("লিংক খোলা যায়নি", "আবার চেষ্টা করুন।");
    });
  };

  const dailyCompleted = Math.min(completed, 5);
  const dailyProgress = Math.min(100, dailyCompleted * 20);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: isTablet ? 30 : 22,
            },
          ]}
        >
          <View
            style={[
              styles.contentShell,
              { maxWidth },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.brand}>
                <Image
                  source={'/splash-icon.png'}
                  style={[
                    styles.logo,
                    isTablet && styles.logoTablet,
                  ]}
                  resizeMode="contain"
                />

                <View>
                  <Text style={styles.appName}>NCTB Kids</Text>
                  <Text style={styles.classText}>Class {classId}</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <View style={styles.smallStat}>
                  <Text style={styles.smallStatIcon}>⭐</Text>
                  <Text style={styles.smallStatValue}>{stars}</Text>
                </View>

                <View style={styles.smallStat}>
                  <Text style={styles.smallStatIcon}>🔥</Text>
                  <Text style={styles.smallStatValue}>{streak}</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Parent area"
                  onPress={() =>
                    navigation.navigate("AdultGate", {
                      destination: "parent",
                    })
                  }
                  style={({ pressed }) => [
                    styles.parentButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.parentIcon}>🔒</Text>
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.hero,
                { height: heroHeight },
              ]}
            >
              <View style={styles.heroCircleOne} />
              <View style={styles.heroCircleTwo} />

              <View style={styles.heroCopy}>
                <Text style={styles.hello}>হ্যালো, {nickname}! 👋</Text>

                <Text
                  style={[
                    styles.heroTitle,
                    isSmallPhone && styles.heroTitleSmall,
                    isTablet && styles.heroTitleTablet,
                  ]}
                  numberOfLines={3}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  আজ কোন বিষয়{"\n"}শিখবে?
                </Text>
              </View>

              <View
                style={[
                  styles.guideWrap,
                  {
                    width: guideSize,
                    height: guideSize,
                    borderRadius: guideSize / 2,
                  },
                ]}
              >
                <Image
                  source={'/characters/mimi/waving.png'}
                  style={styles.guideImage}
                  resizeMode="contain"
                />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="মিমির কথা আবার শুনি"
                onPress={speakGuide}
                style={({ pressed }) => [
                  styles.voiceButton,
                  speaking && styles.voiceButtonActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.voiceIcon}>
                  {speaking ? "🔊" : "▶"}
                </Text>
                <Text style={styles.voiceText}>
                  একটি বই বেছে নাও
                </Text>
              </Pressable>
            </View>

            {student ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Student ID ${student.studentCode}`}
                onPress={openStudentId}
                style={({ pressed }) => [
                  styles.studentIdCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.idIconCircle}>
                  <Text style={styles.idIcon}>🪪</Text>
                </View>

                <View style={styles.idContent}>
                  <Text style={styles.idLabel}>STUDENT ID</Text>
                  <Text
                    style={styles.idValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {student.studentCode}
                  </Text>
                  <Text style={styles.idHelp}>
                    {student.parentLinked
                      ? "✓ Parent account linked"
                      : "Parent-কে এই ID দিন"}
                  </Text>
                </View>

                <View style={styles.idArrowCircle}>
                  <Text style={styles.idArrow}>›</Text>
                </View>
              </Pressable>
            ) : null}

            <Text style={styles.sectionTitle}>আমার বইগুলো</Text>

            <View style={styles.subjectList}>
              {subjectCards.map((subject) => (
                <Pressable
                  key={subject.id}
                  accessibilityRole="button"
                  accessibilityLabel={subject.title_bn}
                  onPress={() =>
                    navigation.navigate("ChapterPath", {
                      classId,
                      subjectId: subject.id,
                    })
                  }
                  style={({ pressed }) => [
                    styles.subjectCard,
                    {
                      minHeight: isTablet ? 132 : 112,
                      backgroundColor:
                        subject.visual.backgroundColor,
                      borderColor: subject.visual.accentColor,
                    },
                    pressed && styles.subjectCardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.subjectIconCircle,
                      {
                        backgroundColor:
                          subject.visual.accentColor,
                      },
                    ]}
                  >
                    <Text style={styles.subjectIcon}>
                      {subject.icon}
                    </Text>
                  </View>

                  <View style={styles.subjectCopy}>
                    <Text
                      style={[
                        styles.subjectTitle,
                        isTablet && styles.subjectTitleTablet,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {subject.title_bn}
                    </Text>

                    <Text
                      style={styles.subjectSubtitle}
                      numberOfLines={1}
                    >
                      {subject.subtitle}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.subjectArrowCircle,
                      {
                        backgroundColor:
                          subject.visual.accentColor,
                      },
                    ]}
                  >
                    <Text style={styles.subjectArrow}>→</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={styles.goalCard}>
              <View style={styles.goalIconCircle}>
                <Text style={styles.goalIcon}>🎯</Text>
              </View>

              <View style={styles.goalContent}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>আজকের লক্ষ্য</Text>
                  <Text style={styles.goalCount}>
                    {dailyCompleted}/৫
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${dailyProgress}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            <Pressable
              onPress={openPrivacyPolicy}
              style={styles.privacyButton}
            >
              <Text style={styles.privacyText}>Privacy Policy</Text>
            </Pressable>
          </View>
        </ScrollView>

        {student ? (
          <ParentLinkRequestModal
            studentId={student.id}
            onLinked={refreshParentLink}
          />
        ) : null}

        <View
          style={[
            styles.bottomNavShell,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <View
            style={[
              styles.bottomNavInner,
              { maxWidth },
            ]}
          >
            <BottomNav
              navigation={navigation}
              active="Subjects"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
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
    paddingTop: 6,
  },

  contentShell: {
    width: "100%",
    alignSelf: "center",
  },

  header: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 48,
    height: 48,
    marginRight: 7,
  },

  logoTablet: {
    width: 60,
    height: 60,
  },

  appName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1B171E",
  },

  classText: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "800",
    color: "#777079",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  smallStat: {
    minWidth: 43,
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 6,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
  },

  smallStatIcon: {
    fontSize: 14,
  },

  smallStatValue: {
    fontSize: 11,
    fontWeight: "900",
    color: "#29242D",
  },

  parentButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#1A171C",
  },

  parentIcon: {
    fontSize: 16,
  },

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#CBBBF2",
  },

  heroCircleOne: {
    position: "absolute",
    top: -60,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#B6A1EB",
  },

  heroCircleTwo: {
    position: "absolute",
    left: -40,
    bottom: -60,
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: "#E4B9F1",
  },

  heroCopy: {
    zIndex: 3,
    width: "58%",
    paddingLeft: 20,
    paddingTop: 28,
  },

  hello: {
    fontSize: 12,
    fontWeight: "900",
    color: "#5B4B79",
  },

  heroTitle: {
    marginTop: 7,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    color: "#171419",
  },

  heroTitleSmall: {
    fontSize: 27,
    lineHeight: 32,
  },

  heroTitleTablet: {
    fontSize: 39,
    lineHeight: 46,
  },

  guideWrap: {
    position: "absolute",
    right: 4,
    bottom: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.42)",
  },

  guideImage: {
    width: "100%",
    height: "100%",
  },

  voiceButton: {
    position: "absolute",
    left: 15,
    bottom: 13,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
  },

  voiceButtonActive: {
    backgroundColor: "#E1F6DC",
  },

  voiceIcon: {
    fontSize: 14,
    fontWeight: "900",
  },

  voiceText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#302A34",
  },

  studentIdCard: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 2,
    borderColor: "#7D61B6",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  idIconCircle: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#EEE5FF",
  },

  idIcon: {
    fontSize: 25,
  },

  idContent: {
    flex: 1,
    marginLeft: 12,
  },

  idLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: "900",
    color: "#8A7E92",
  },

  idValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "900",
    color: "#3A2866",
  },

  idHelp: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#786C80",
  },

  idArrowCircle: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#1A171C",
  },

  idArrow: {
    marginTop: -2,
    fontSize: 25,
    color: "#FFFFFF",
  },

  sectionTitle: {
    marginTop: 23,
    marginBottom: 12,
    fontSize: 24,
    fontWeight: "900",
    color: "#1B171E",
  },

  subjectList: {
    gap: 11,
  },

  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderRadius: 24,
  },

  subjectCardPressed: {
    transform: [{ translateY: 3 }],
    opacity: 0.9,
  },

  subjectIconCircle: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.78)",
    borderRadius: 29,
  },

  subjectIcon: {
    fontSize: 28,
  },

  subjectCopy: {
    flex: 1,
    marginLeft: 13,
    marginRight: 10,
  },

  subjectTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#221E25",
  },

  subjectTitleTablet: {
    fontSize: 24,
  },

  subjectSubtitle: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: "#605963",
  },

  subjectArrowCircle: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },

  subjectArrow: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  goalCard: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 19,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  goalIconCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFE8A6",
  },

  goalIcon: {
    fontSize: 23,
  },

  goalContent: {
    flex: 1,
    marginLeft: 12,
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  goalTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#282329",
  },

  goalCount: {
    fontSize: 13,
    fontWeight: "900",
    color: "#7553BA",
  },

  progressTrack: {
    height: 10,
    marginTop: 9,
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "#ECE8EF",
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#7553BA",
  },

  privacyButton: {
    alignSelf: "center",
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  privacyText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#777079",
    textDecorationLine: "underline",
  },

  bottomNavShell: {
    paddingTop: 5,
    paddingBottom: 7,
    backgroundColor: "#F6F3F8",
  },

  bottomNavInner: {
    width: "100%",
    alignSelf: "center",
  },
});
