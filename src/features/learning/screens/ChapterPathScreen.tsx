import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
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

import type { ScreenProps } from "../../../navigation/routes";
import { BottomNav } from "../../../components/BottomNav";
import { useGamificationStore } from "../../gamification/store/gamificationStore";
import { useChapterPath } from "../hooks/useChapterPath";

export default function ChapterPathScreen({
  navigation,
  route,
}: ScreenProps<"ChapterPath">) {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortScreen = height < 760;
  const isTablet = width >= 600;

  const maxWidth = isTablet ? 760 : 560;
  const horizontalPadding = isSmallPhone ? 12 : isTablet ? 28 : 16;
  const heroHeight = isTablet ? 210 : isShortScreen ? 152 : 172;
  const guideSize = isTablet ? 150 : isSmallPhone ? 102 : 120;

  const { classId, subjectId } = route.params;

  const {
    subject,
    chapters,
    loading,
    error,
    retry,
    source,
  } = useChapterPath(classId, subjectId);

  const unlocked = useGamificationStore(
    (state) => state.unlockedChapterIds,
  );
  const completed = useGamificationStore(
    (state) => state.completedChapters,
  );

  const [speaking, setSpeaking] = useState(false);

  const completedCount = useMemo(
    () =>
      chapters.filter((chapter) =>
        Boolean(completed[chapter.id]),
      ).length,
    [chapters, completed],
  );

  const progressPercent =
    chapters.length > 0
      ? Math.min(
          100,
          (completedCount / chapters.length) * 100,
        )
      : 0;

  const subjectTitle =
    subject?.title_bn || subject?.title || "পাঠ";

  const guideMessage =
    completedCount === 0
      ? `চলো ${subjectTitle} শেখা শুরু করি। প্রথম খোলা পাঠে চাপ দাও।`
      : completedCount >= chapters.length &&
          chapters.length > 0
        ? `দারুণ! তুমি ${subjectTitle}-এর সব পাঠ শেষ করেছো।`
        : `দারুণ এগোচ্ছো! এবার পরের খোলা পাঠে চাপ দাও।`;

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
    if (loading || error || chapters.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      speakGuide();
    }, 550);

    return () => {
      clearTimeout(timer);
      void Speech.stop();
    };
  }, [
    chapters.length,
    error,
    loading,
    speakGuide,
  ]);

  if (!subject) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerEmoji}>📚</Text>
          <Text style={styles.centerTitle}>
            বিষয়টি পাওয়া যায়নি
          </Text>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backHomeButton}
          >
            <Text style={styles.backHomeText}>
              ফিরে যাই
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="পেছনে যাই"
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.headerButtonText}>‹</Text>
              </Pressable>

              <View style={styles.headerCopy}>
                <Text
                  style={styles.headerTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {subjectTitle}
                </Text>
                <Text style={styles.headerSubtitle}>
                  Class {classId}
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
                <Text style={styles.parentIcon}>🔒</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.hero,
                {
                  height: heroHeight,
                  backgroundColor:
                    subject.color || "#CBBBF2",
                },
              ]}
            >
              <View style={styles.heroCircleOne} />
              <View style={styles.heroCircleTwo} />

              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>
                  LEARNING PATH
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
                  ধাপে ধাপে{"\n"}শিখি
                </Text>

                <View style={styles.progressSummary}>
                  <Text style={styles.progressSummaryText}>
                    {completedCount}/{chapters.length} পাঠ শেষ
                  </Text>
                </View>
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
                  {completedCount === 0
                    ? "প্রথম পাঠ থেকে শুরু করো"
                    : "পরের পাঠে এগিয়ে যাও"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressTopRow}>
                <View>
                  <Text style={styles.progressEyebrow}>
                    YOUR PROGRESS
                  </Text>
                  <Text style={styles.progressTitle}>
                    শেখার অগ্রগতি
                  </Text>
                </View>

                <Text style={styles.progressValue}>
                  {Math.round(progressPercent)}%
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor:
                        subject.color || "#7653BD",
                    },
                  ]}
                />
              </View>
            </View>

            {loading ? (
              <View style={styles.statusCard}>
                <ActivityIndicator
                  size="small"
                  color="#7653BD"
                />
                <Text style={styles.statusText}>
                  নতুন পাঠ খোঁজা হচ্ছে...
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>
                  অনলাইন পাঠ লোড হয়নি
                </Text>
                <Text style={styles.errorText}>
                  {error}
                </Text>

                <Pressable
                  onPress={retry}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.retryText}>
                    আবার চেষ্টা করি
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {!loading &&
            !error &&
            chapters.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>
                  এখনো কোনো পাঠ প্রকাশ হয়নি
                </Text>
                <Text style={styles.emptyText}>
                  এই class ও subject-এর published chapter
                  পাওয়া যায়নি।
                </Text>

                <Pressable
                  onPress={retry}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.retryText}>
                    আবার দেখুন
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {chapters.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>
                  তোমার পাঠগুলো
                </Text>

                <View style={styles.chapterList}>
                  {chapters.map((chapter, index) => {
                    const completedInfo =
                      completed[chapter.id];
                    const isCompleted =
                      Boolean(completedInfo);
                    const isUnlocked =
                      index === 0 ||
                      unlocked.includes(chapter.id) ||
                      isCompleted;

                    const statusText = isCompleted
                      ? `শেষ হয়েছে · ⭐ ${
                          completedInfo?.starsEarned ?? 0
                        }`
                      : isUnlocked
                        ? "শুরু করো"
                        : "আগের পাঠ শেষ করো";

                    return (
                      <Pressable
                        key={chapter.id}
                        accessibilityRole="button"
                        accessibilityState={{
                          disabled: !isUnlocked,
                        }}
                        disabled={!isUnlocked}
                        onPress={() =>
                          navigation.navigate("Lesson", {
                            chapterId: chapter.id,
                          })
                        }
                        style={({ pressed }) => [
                          styles.chapterCard,
                          isCompleted &&
                            styles.chapterCardCompleted,
                          !isUnlocked &&
                            styles.chapterCardLocked,
                          pressed &&
                            isUnlocked &&
                            styles.chapterCardPressed,
                        ]}
                      >
                        <View style={styles.stepColumn}>
                          <View
                            style={[
                              styles.stepCircle,
                              {
                                backgroundColor: isCompleted
                                  ? "#55B94B"
                                  : isUnlocked
                                    ? subject.color ||
                                      "#7653BD"
                                    : "#C8C3CC",
                              },
                            ]}
                          >
                            <Text style={styles.stepNumber}>
                              {isCompleted
                                ? "✓"
                                : isUnlocked
                                  ? index + 1
                                  : "🔒"}
                            </Text>
                          </View>

                          {index <
                          chapters.length - 1 ? (
                            <View
                              style={[
                                styles.connector,
                                isCompleted &&
                                  styles.connectorDone,
                              ]}
                            />
                          ) : null}
                        </View>

                        <View style={styles.chapterMain}>
                          <View style={styles.chapterTitleRow}>
                            <View
                              style={[
                                styles.chapterIconCircle,
                                {
                                  backgroundColor:
                                    isUnlocked
                                      ? "#F0EAFF"
                                      : "#EEECEF",
                                },
                              ]}
                            >
                              <Text style={styles.chapterIcon}>
                                {isUnlocked
                                  ? chapter.icon
                                  : "🔒"}
                              </Text>
                            </View>

                            <View style={styles.chapterCopy}>
                              <Text
                                style={styles.chapterTitle}
                                numberOfLines={2}
                              >
                                {chapter.title}
                              </Text>

                              <Text
                                style={styles.chapterSubtitle}
                                numberOfLines={2}
                              >
                                {chapter.subtitle}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.statusRow}>
                            <View
                              style={[
                                styles.statusBadge,
                                isCompleted
                                  ? styles.statusBadgeCompleted
                                  : isUnlocked
                                    ? styles.statusBadgeOpen
                                    : styles.statusBadgeLocked,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  isCompleted
                                    ? styles.statusTextCompleted
                                    : isUnlocked
                                      ? styles.statusTextOpen
                                      : styles.statusTextLocked,
                                ]}
                              >
                                {statusText}
                              </Text>
                            </View>

                            {isUnlocked ? (
                              <View
                                style={[
                                  styles.chapterArrow,
                                  {
                                    backgroundColor:
                                      isCompleted
                                        ? "#55B94B"
                                        : subject.color ||
                                          "#7653BD",
                                  },
                                ]}
                              >
                                <Text
                                  style={styles.chapterArrowText}
                                >
                                  →
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {source === "local" ? (
              <Text style={styles.localModeText}>
                Local curriculum test mode
              </Text>
            ) : null}
          </View>
        </ScrollView>

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
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  headerButtonText: {
    marginTop: -4,
    fontSize: 32,
    fontWeight: "600",
    color: "#211D24",
  },

  headerCopy: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 10,
  },

  headerTitle: {
    maxWidth: "100%",
    fontSize: 18,
    fontWeight: "900",
    color: "#1D191F",
  },

  headerSubtitle: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: "800",
    color: "#7D7580",
  },

  parentButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#1A171C",
  },

  parentIcon: {
    fontSize: 17,
  },

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
  },

  heroCircleOne: {
    position: "absolute",
    top: -70,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.24)",
  },

  heroCircleTwo: {
    position: "absolute",
    left: -45,
    bottom: -70,
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  heroCopy: {
    zIndex: 3,
    width: "60%",
    paddingLeft: 20,
    paddingTop: 22,
  },

  heroEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "rgba(29,25,31,0.58)",
  },

  heroTitle: {
    marginTop: 5,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    color: "#171419",
  },

  heroTitleSmall: {
    fontSize: 25,
    lineHeight: 30,
  },

  heroTitleTablet: {
    fontSize: 37,
    lineHeight: 43,
  },

  progressSummary: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.76)",
  },

  progressSummaryText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#3C3540",
  },

  guideCircle: {
    position: "absolute",
    right: 5,
    bottom: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.38)",
  },

  guideImage: {
    width: "100%",
    height: "100%",
  },

  voiceButton: {
    position: "absolute",
    left: 14,
    bottom: 12,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },

  voiceButtonActive: {
    backgroundColor: "#E0F5DA",
  },

  voiceIcon: {
    fontSize: 13,
    fontWeight: "900",
  },

  voiceText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#312B34",
  },

  progressCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#998F9E",
  },

  progressTitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "900",
    color: "#29242B",
  },

  progressValue: {
    fontSize: 19,
    fontWeight: "900",
    color: "#7553BA",
  },

  progressTrack: {
    height: 10,
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "#ECE8EF",
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
  },

  statusCard: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 14,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#554B5B",
  },

  errorCard: {
    alignItems: "center",
    marginTop: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: "#E5B03A",
    borderRadius: 22,
    backgroundColor: "#FFF5D8",
  },

  errorIcon: {
    fontSize: 28,
  },

  errorTitle: {
    marginTop: 7,
    fontSize: 16,
    fontWeight: "900",
    color: "#2E292F",
    textAlign: "center",
  },

  errorText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#6C626D",
    textAlign: "center",
  },

  retryButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#1A171C",
  },

  retryText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  emptyCard: {
    alignItems: "center",
    marginTop: 14,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  emptyIcon: {
    fontSize: 32,
  },

  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "#2D282E",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#746B76",
    textAlign: "center",
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 23,
    fontWeight: "900",
    color: "#1C181E",
  },

  chapterList: {
    gap: 12,
  },

  chapterCard: {
    minHeight: 128,
    flexDirection: "row",
    paddingRight: 13,
    borderWidth: 2,
    borderColor: "#D9D3DE",
    borderBottomWidth: 6,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  chapterCardCompleted: {
    borderColor: "#73C96A",
    backgroundColor: "#F4FFF2",
  },

  chapterCardLocked: {
    opacity: 0.62,
    borderColor: "#D3CFD5",
    backgroundColor: "#F0EEF1",
  },

  chapterCardPressed: {
    transform: [{ translateY: 3 }],
    opacity: 0.92,
  },

  stepColumn: {
    width: 58,
    alignItems: "center",
    paddingTop: 15,
  },

  stepCircle: {
    zIndex: 2,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 21,
  },

  stepNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  connector: {
    flex: 1,
    width: 4,
    minHeight: 36,
    marginTop: 4,
    marginBottom: -19,
    borderRadius: 2,
    backgroundColor: "#D9D4DC",
  },

  connectorDone: {
    backgroundColor: "#83D47B",
  },

  chapterMain: {
    flex: 1,
    paddingTop: 13,
    paddingBottom: 12,
  },

  chapterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  chapterIconCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },

  chapterIcon: {
    fontSize: 24,
  },

  chapterCopy: {
    flex: 1,
    marginLeft: 11,
  },

  chapterTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    color: "#272229",
  },

  chapterSubtitle: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#756D77",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  statusBadge: {
    maxWidth: "82%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  statusBadgeCompleted: {
    backgroundColor: "#DFF5DB",
  },

  statusBadgeOpen: {
    backgroundColor: "#EEE7FF",
  },

  statusBadgeLocked: {
    backgroundColor: "#E4E1E5",
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  statusTextCompleted: {
    color: "#3E9237",
  },

  statusTextOpen: {
    color: "#6643A8",
  },

  statusTextLocked: {
    color: "#777079",
  },

  chapterArrow: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },

  chapterArrowText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  localModeText: {
    marginTop: 14,
    fontSize: 9,
    fontWeight: "700",
    color: "#99919C",
    textAlign: "center",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F6F3F8",
  },

  centerEmoji: {
    fontSize: 42,
  },

  centerTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "#29242B",
  },

  backHomeButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#1A171C",
  },

  backHomeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
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
