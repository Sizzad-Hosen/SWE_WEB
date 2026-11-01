import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import { SafeAreaView } from "../../../web/safe-area";
import * as Speech from "../../../web/speech";

import { BottomNav } from "../../../components/BottomNav";
import { env } from "../../../config/env";
import { isSupabaseConfigured } from "../../../config/supabase";
import type { ScreenProps } from "../../../navigation/routes";
import { useGamificationStore } from "../../gamification/store/gamificationStore";
import { getSubjects } from "../../learning/data/curriculum";
import {
  getPublishedChapters,
  type ChapterListItem,
} from "../../learning/services/curriculumService";
import { ParentLinkRequestModal } from "../../parent/components/ParentLinkRequestModal";
import { useStudentStore } from "../../student/store/studentStore";

export default function ProgressScreen({
  navigation,
}: ScreenProps<"Progress">) {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortScreen = height < 760;
  const isTablet = width >= 600;

  const maxWidth = isTablet ? 800 : 580;
  const horizontalPadding = isSmallPhone
    ? 12
    : isTablet
      ? 28
      : 16;
  const heroHeight = isTablet
    ? 290
    : isShortScreen
      ? 210
      : 235;
  const guideSize = isTablet
    ? 220
    : isSmallPhone
      ? 130
      : 160;

  const student = useStudentStore(
    (state) => state.student,
  );
  const refreshParentLink = useStudentStore(
    (state) => state.linkParent,
  );

  const stars = useGamificationStore(
    (state) => state.stars,
  );
  const level = useGamificationStore(
    (state) => state.level,
  );
  const streak = useGamificationStore(
    (state) => state.streak,
  );
  const completed = useGamificationStore(
    (state) => state.completedChapters,
  );

  const classId = student?.classLevel ?? 1;
  const subjects = useMemo(
    () => getSubjects(classId),
    [classId],
  );

  const [remoteChaptersBySubject, setRemoteChaptersBySubject] =
    useState<Record<string, ChapterListItem[]> | null>(null);
  const [curriculumLoading, setCurriculumLoading] =
    useState(env.USE_REMOTE_CURRICULUM);
  const [curriculumError, setCurriculumError] =
    useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let active = true;

    if (!env.USE_REMOTE_CURRICULUM) {
      setRemoteChaptersBySubject(null);
      setCurriculumLoading(false);
      setCurriculumError(null);

      return () => {
        active = false;
      };
    }

    if (!isSupabaseConfigured) {
      setRemoteChaptersBySubject({});
      setCurriculumLoading(false);
      setCurriculumError(
        "এই build-এ Supabase URL অথবা public anon key configure করা নেই।",
      );

      return () => {
        active = false;
      };
    }

    setCurriculumLoading(true);
    setCurriculumError(null);

    void Promise.all(
      subjects.map(
        async (subject) =>
          [
            subject.id,
            await getPublishedChapters(
              classId,
              subject.id,
            ),
          ] as const,
      ),
    )
      .then((entries) => {
        if (!active) {
          return;
        }

        setRemoteChaptersBySubject(
          Object.fromEntries(entries),
        );
        setCurriculumLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) {
          return;
        }

        setRemoteChaptersBySubject({});
        setCurriculumLoading(false);
        setCurriculumError(
          loadError instanceof Error
            ? loadError.message
            : "অনলাইন curriculum লোড করা যায়নি।",
        );
      });

    return () => {
      active = false;
    };
  }, [classId, reloadKey, subjects]);

  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  const subjectProgress = useMemo(
    () =>
      subjects.map((subject) => {
        const chapterIds = env.USE_REMOTE_CURRICULUM
          ? (
              remoteChaptersBySubject?.[subject.id] ?? []
            ).map((chapter) => chapter.id)
          : subject.chapters.map(
              (chapter) => chapter.id,
            );

        const completedCount = chapterIds.filter(
          (chapterId) =>
            Boolean(completed[chapterId]),
        ).length;

        return {
          ...subject,
          chapterIds,
          completedCount,
        };
      }),
    [completed, remoteChaptersBySubject, subjects],
  );

  const totalChapters = useMemo(
    () =>
      subjectProgress.reduce(
        (total, subject) =>
          total + subject.chapterIds.length,
        0,
      ),
    [subjectProgress],
  );

  const completedChapterCount = useMemo(
    () =>
      subjectProgress.reduce(
        (total, subject) =>
          total + subject.completedCount,
        0,
      ),
    [subjectProgress],
  );

  const overall =
    totalChapters > 0
      ? Math.round(
          (completedChapterCount / totalChapters) *
            100,
        )
      : 0;

  const nickname =
    student?.nickname &&
    student.nickname.trim() &&
    student.nickname !== "তুমি"
      ? student.nickname
      : "বন্ধু";

  const encouragement =
    overall >= 100
      ? "চমৎকার! তুমি সব পাঠ শেষ করেছো।"
      : overall >= 60
        ? "দারুণ এগোচ্ছো! আর একটু চেষ্টা করো।"
        : overall > 0
          ? "খুব ভালো শুরু! প্রতিদিন একটি পাঠ শেষ করো।"
          : "চলো আজ প্রথম পাঠটি শুরু করি।";

  const speakEncouragement = useCallback(() => {
    void Speech.stop();

    Speech.speak(
      `${nickname}, ${encouragement}`,
      {
        language: "bn-BD",
        rate: 0.8,
        pitch: 1.05,
        onStart: () => setSpeaking(true),
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      },
    );
  }, [encouragement, nickname]);

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
              <View>
                <Text style={styles.headerEyebrow}>
                  MY PROGRESS
                </Text>
                <Text
                  style={[
                    styles.headerTitle,
                    isTablet &&
                      styles.headerTitleTablet,
                  ]}
                >
                  আমার উন্নতি
                </Text>
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
                <Text style={styles.parentIcon}>
                  🔒
                </Text>
              </Pressable>
            </View>

            {curriculumLoading ? (
              <View style={styles.statusCard}>
                <ActivityIndicator
                  size="small"
                  color="#7653BD"
                />
                <Text style={styles.statusText}>
                  Progress data লোড হচ্ছে...
                </Text>
              </View>
            ) : null}

            {curriculumError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorIcon}>
                  ⚠️
                </Text>

                <View style={styles.errorCopy}>
                  <Text style={styles.errorTitle}>
                    Progress data লোড হয়নি
                  </Text>
                  <Text
                    style={styles.errorText}
                    numberOfLines={2}
                  >
                    {curriculumError}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setReloadKey(
                      (value) => value + 1,
                    )
                  }
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.retryText}>
                    আবার
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View
              style={[
                styles.hero,
                { height: heroHeight },
              ]}
            >
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.heroCopy}>
                <Text style={styles.hello}>
                  হ্যালো, {nickname}! 👋
                </Text>

                <Text
                  style={[
                    styles.heroTitle,
                    isSmallPhone &&
                      styles.heroTitleSmall,
                    isTablet &&
                      styles.heroTitleTablet,
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                >
                  তুমি দারুণ{"\n"}এগোচ্ছো!
                </Text>

                {student ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Student ID ${student.studentCode}`}
                    onPress={openStudentId}
                    style={({ pressed }) => [
                      styles.idChip,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.idChipIcon}>
                      🪪
                    </Text>
                    <View>
                      <Text style={styles.idChipLabel}>
                        STUDENT ID
                      </Text>
                      <Text
                        style={styles.idChipValue}
                        numberOfLines={1}
                      >
                        {student.studentCode}
                      </Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>

              <View
                style={[
                  styles.guideCircle,
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
                accessibilityLabel="মিমির পরামর্শ শুনি"
                onPress={speakEncouragement}
                style={({ pressed }) => [
                  styles.voiceButton,
                  speaking &&
                    styles.voiceButtonActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.voiceIcon}>
                  {speaking ? "🔊" : "▶"}
                </Text>
                <Text style={styles.voiceText}>
                  মিমির পরামর্শ
                </Text>
              </Pressable>
            </View>

            <View style={styles.overallCard}>
              <View style={styles.progressRing}>
                <View style={styles.progressRingInner}>
                  <Text
                    style={[
                      styles.overallValue,
                      isTablet &&
                        styles.overallValueTablet,
                    ]}
                  >
                    {overall}%
                  </Text>
                </View>
              </View>

              <View style={styles.overallCopy}>
                <Text style={styles.overallEyebrow}>
                  OVERALL PROGRESS
                </Text>
                <Text style={styles.overallTitle}>
                  মোট অগ্রগতি
                </Text>
                <Text style={styles.overallText}>
                  {completedChapterCount}/{totalChapters}টি
                  chapter শেষ হয়েছে
                </Text>

                <View style={styles.overallTrack}>
                  <View
                    style={[
                      styles.overallFill,
                      { width: `${overall}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard
                icon="⭐"
                value={stars}
                label="Stars"
                backgroundColor="#FFF1C8"
              />
              <StatCard
                icon="🏅"
                value={level}
                label="Level"
                backgroundColor="#EDE4FF"
              />
              <StatCard
                icon="🔥"
                value={streak}
                label="Streak"
                backgroundColor="#FFE4DE"
              />
            </View>

            <Text style={styles.sectionTitle}>
              বিষয়ভিত্তিক অগ্রগতি
            </Text>

            <View style={styles.subjectList}>
              {subjectProgress.map((subject) => {
                const subjectTotal =
                  subject.chapterIds.length;
                const completedInSubject =
                  subject.completedCount;
                const percent =
                  subjectTotal > 0
                    ? Math.round(
                        (completedInSubject /
                          subjectTotal) *
                          100,
                      )
                    : 0;

                return (
                  <Pressable
                    key={subject.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${subject.title_bn} progress ${percent}%`}
                    onPress={() =>
                      navigation.navigate(
                        "ChapterPath",
                        {
                          classId,
                          subjectId: subject.id,
                        },
                      )
                    }
                    style={({ pressed }) => [
                      styles.subjectCard,
                      pressed &&
                        styles.subjectCardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.subjectIconCircle,
                        {
                          backgroundColor:
                            subject.color,
                        },
                      ]}
                    >
                      <Text
                        style={styles.subjectIcon}
                      >
                        {subject.icon}
                      </Text>
                    </View>

                    <View style={styles.subjectCopy}>
                      <View
                        style={styles.subjectTopRow}
                      >
                        <Text
                          style={[
                            styles.subjectName,
                            isTablet &&
                              styles.subjectNameTablet,
                          ]}
                          numberOfLines={1}
                        >
                          {subject.title_bn}
                        </Text>

                        <Text
                          style={styles.subjectPercent}
                        >
                          {percent}%
                        </Text>
                      </View>

                      <Text
                        style={styles.chapterCount}
                      >
                        {completedInSubject}/{subjectTotal}টি
                        chapter শেষ
                      </Text>

                      <View
                        style={styles.subjectTrack}
                      >
                        <View
                          style={[
                            styles.subjectFill,
                            {
                              width: `${percent}%`,
                              backgroundColor:
                                subject.color,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <Text style={styles.subjectArrow}>
                      ›
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {subjectProgress.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>
                  📭
                </Text>
                <Text style={styles.emptyTitle}>
                  কোনো বিষয় পাওয়া যায়নি
                </Text>
                <Text style={styles.emptyText}>
                  নির্বাচিত ক্লাসের curriculum এখনো
                  যোগ করা হয়নি।
                </Text>
              </View>
            ) : null}

            <View style={styles.tipCard}>
              <View style={styles.tipIconCircle}>
                <Text style={styles.tipIcon}>💡</Text>
              </View>

              <View style={styles.tipCopy}>
                <Text style={styles.tipTitle}>
                  আজকের পরামর্শ
                </Text>
                <Text style={styles.tipText}>
                  {encouragement}
                </Text>
              </View>

              <Pressable
                onPress={speakEncouragement}
                style={({ pressed }) => [
                  styles.tipVoiceButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.tipVoiceIcon}>
                  🔊
                </Text>
              </Pressable>
            </View>
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
            {
              paddingHorizontal: horizontalPadding,
            },
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
              active="Progress"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
  backgroundColor,
}: {
  icon: string;
  value: number;
  label: string;
  backgroundColor: string;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor },
      ]}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text
        style={styles.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  },

  contentShell: {
    width: "100%",
    alignSelf: "center",
  },

  header: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 1.6,
    fontWeight: "900",
    color: "#948A98",
  },

  headerTitle: {
    marginTop: 3,
    fontSize: 25,
    fontWeight: "900",
    color: "#1D191F",
  },

  headerTitleTablet: {
    fontSize: 31,
  },

  parentButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#1A171C",
  },

  parentIcon: {
    fontSize: 18,
  },

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },

  statusCard: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5D5362",
  },

  errorCard: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 11,
    borderWidth: 2,
    borderColor: "#E5B13D",
    borderRadius: 19,
    backgroundColor: "#FFF4D4",
  },

  errorIcon: {
    fontSize: 24,
  },

  errorCopy: {
    flex: 1,
    marginHorizontal: 9,
  },

  errorTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#332E35",
  },

  errorText: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "700",
    color: "#776B77",
  },

  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#1A171C",
  },

  retryText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "#CBBBF2",
  },

  heroOrbOne: {
    position: "absolute",
    top: -66,
    right: -50,
    width: 185,
    height: 185,
    borderRadius: 93,
    backgroundColor: "#B7A2EA",
  },

  heroOrbTwo: {
    position: "absolute",
    left: -48,
    bottom: -68,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#E4B9F0",
  },

  heroCopy: {
    zIndex: 3,
    width: "61%",
    paddingTop: 23,
    paddingLeft: 20,
  },

  hello: {
    fontSize: 12,
    fontWeight: "900",
    color: "#5C4C79",
  },

  heroTitle: {
    marginTop: 6,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "900",
    color: "#171419",
  },

  heroTitleSmall: {
    fontSize: 25,
    lineHeight: 30,
  },

  heroTitleTablet: {
    fontSize: 39,
    lineHeight: 46,
  },

  idChip: {
    alignSelf: "flex-start",
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 10,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.82)",
  },

  idChipIcon: {
    fontSize: 18,
  },

  idChipLabel: {
    fontSize: 7,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#897E8E",
  },

  idChipValue: {
    maxWidth: 140,
    marginTop: 1,
    fontSize: 11,
    fontWeight: "900",
    color: "#3C2A68",
  },

  guideCircle: {
    position: "absolute",
    right: 5,
    bottom: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.4)",
  },

  guideImage: {
    width: "100%",
    height: "100%",
  },

  voiceButton: {
    position: "absolute",
    left: 15,
    bottom: 12,
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },

  voiceButtonActive: {
    backgroundColor: "#E1F6DD",
  },

  voiceIcon: {
    fontSize: 13,
  },

  voiceText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#302A34",
  },

  overallCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 15,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  progressRing: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 10,
    borderColor: "#7653BD",
    borderRadius: 44,
    backgroundColor: "#EEE7FF",
  },

  progressRingInner: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
  },

  overallValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#5D3DA3",
  },

  overallValueTablet: {
    fontSize: 24,
  },

  overallCopy: {
    flex: 1,
    marginLeft: 14,
  },

  overallEyebrow: {
    fontSize: 8,
    letterSpacing: 1.25,
    fontWeight: "900",
    color: "#9A919E",
  },

  overallTitle: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: "900",
    color: "#282329",
  },

  overallText: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: "#756D78",
  },

  overallTrack: {
    height: 9,
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "#EDE9F0",
  },

  overallFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#7653BD",
  },

  statsRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 12,
  },

  statCard: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 21,
  },

  statIcon: {
    fontSize: 21,
  },

  statValue: {
    maxWidth: "100%",
    marginTop: 3,
    fontSize: 19,
    fontWeight: "900",
    color: "#29242B",
  },

  statLabel: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: "800",
    color: "#766D78",
  },

  sectionTitle: {
    marginTop: 23,
    marginBottom: 12,
    fontSize: 22,
    fontWeight: "900",
    color: "#1D191F",
  },

  subjectList: {
    gap: 10,
  },

  subjectCard: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderWidth: 1,
    borderColor: "#E0DBE3",
    borderBottomWidth: 5,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
  },

  subjectCardPressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.92,
  },

  subjectIconCircle: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.78)",
    borderRadius: 27,
  },

  subjectIcon: {
    fontSize: 26,
  },

  subjectCopy: {
    flex: 1,
    marginLeft: 12,
  },

  subjectTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  subjectName: {
    flex: 1,
    marginRight: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "#29242B",
  },

  subjectNameTablet: {
    fontSize: 20,
  },

  subjectPercent: {
    fontSize: 14,
    fontWeight: "900",
    color: "#7553BA",
  },

  chapterCount: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: "700",
    color: "#7B727D",
  },

  subjectTrack: {
    height: 8,
    marginTop: 9,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#ECE8EF",
  },

  subjectFill: {
    height: "100%",
    borderRadius: 4,
  },

  subjectArrow: {
    marginLeft: 9,
    marginTop: -3,
    fontSize: 27,
    color: "#777079",
  },

  emptyCard: {
    alignItems: "center",
    padding: 19,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  emptyIcon: {
    fontSize: 31,
  },

  emptyTitle: {
    marginTop: 7,
    fontSize: 15,
    fontWeight: "900",
    color: "#2D282F",
  },

  emptyText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#776E79",
    textAlign: "center",
  },

  tipCard: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 17,
    padding: 13,
    borderRadius: 22,
    backgroundColor: "#FFF2C9",
  },

  tipIconCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  tipIcon: {
    fontSize: 23,
  },

  tipCopy: {
    flex: 1,
    marginHorizontal: 11,
  },

  tipTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#755300",
  },

  tipText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#725E2E",
  },

  tipVoiceButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },

  tipVoiceIcon: {
    fontSize: 17,
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
