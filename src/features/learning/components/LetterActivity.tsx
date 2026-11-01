import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import * as Speech from "../../../web/speech";

import MimiCharacter from "./MimiCharacter";

type Props = {
  activity: {
    title?: string;
    instruction?: string;
    data: {
      letter: string;
      sound: string;
      examples: {
        emoji: string;
        word: string;
      }[];
    };
  };
  onComplete: () => void;
};

function speakBangla(text: string) {
  void Speech.stop();

  Speech.speak(text, {
    language: "bn-BD",
    rate: 0.74,
    pitch: 1.08,
    volume: 1,
  });
}

export default function LetterActivity({
  activity,
  onComplete,
}: Props) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 600;

  const { data } = activity;

  const entrance = useRef(
    new Animated.Value(0),
  ).current;
  const letterPulse = useRef(
    new Animated.Value(1),
  ).current;
  const completedRef = useRef(false);

  const [showExamples, setShowExamples] =
    useState(false);
  const [visitedExamples, setVisitedExamples] =
    useState<number[]>([]);
  const [completed, setCompleted] =
    useState(false);

  const totalExamples = data.examples.length;
  const allExamplesVisited =
    totalExamples === 0 ||
    visitedExamples.length === totalExamples;

  const missionProgress = useMemo(() => {
    if (completed) {
      return 100;
    }

    if (!showExamples) {
      return 34;
    }

    if (totalExamples === 0) {
      return 78;
    }

    return Math.min(
      90,
      50 +
        Math.round(
          (visitedExamples.length /
            totalExamples) *
            40,
        ),
    );
  }, [
    completed,
    showExamples,
    totalExamples,
    visitedExamples.length,
  ]);

  useEffect(() => {
    const entranceAnimation = Animated.spring(
      entrance,
      {
        toValue: 1,
        friction: 6,
        tension: 55,
        useNativeDriver: true,
      },
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(letterPulse, {
          toValue: 1.06,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(letterPulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );

    entranceAnimation.start();
    pulseAnimation.start();

    const timer = setTimeout(() => {
      speakBangla(
        `এটি হলো ${data.letter}। ${data.sound}`,
      );
    }, 420);

    return () => {
      clearTimeout(timer);
      entranceAnimation.stop();
      pulseAnimation.stop();
      void Speech.stop();
    };
  }, [
    data.letter,
    data.sound,
    entrance,
    letterPulse,
  ]);

  const opacity = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const characterSize = isTablet
    ? 210
    : isSmallPhone
      ? 132
      : 160;

  const handleRevealExamples = () => {
    setShowExamples(true);

    speakBangla(
      `${data.letter} দিয়ে কোন কোন শব্দ হয়, কার্ডে চাপ দিয়ে শোনো।`,
    );
  };

  const handleExamplePress = (
    index: number,
    word: string,
  ) => {
    if (!visitedExamples.includes(index)) {
      setVisitedExamples((current) => [
        ...current,
        index,
      ]);
    }

    speakBangla(
      `${data.letter} দিয়ে ${word}`,
    );
  };

  const handleComplete = () => {
    if (
      !allExamplesVisited ||
      completedRef.current
    ) {
      return;
    }

    completedRef.current = true;
    setCompleted(true);

    speakBangla(
      `দারুণ! তুমি ${data.letter} অক্ষরটি শিখেছো।`,
    );

    onComplete();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.missionHeader}>
        <View style={styles.missionIcon}>
          <Text style={styles.missionIconText}>
            🔤
          </Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>
            LETTER POWER
          </Text>
          <Text
            style={[
              styles.headerTitle,
              isTablet &&
                styles.headerTitleTablet,
            ]}
          >
            {activity.title ?? "অক্ষর শিখি"}
          </Text>
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>
            +10 XP
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${missionProgress}%`,
            },
          ]}
        />
      </View>

      <View style={styles.stage}>
        <View style={styles.stageOrbOne} />
        <View style={styles.stageOrbTwo} />

        <View style={styles.mimiZone}>
          <MimiCharacter
            emotion={
              completed
                ? "celebrate"
                : "happy"
            }
            size={characterSize}
          />

          <View style={styles.mimiBadge}>
            <Text style={styles.mimiDot}>
              ●
            </Text>
            <Text style={styles.mimiBadgeText}>
              LETTER COACH
            </Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.letterOrb,
            {
              transform: [
                { scale: letterPulse },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.letter,
              isTablet && styles.letterTablet,
            ]}
          >
            {data.letter}
          </Text>
        </Animated.View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="অক্ষরটি আবার শুনি"
          onPress={() =>
            speakBangla(
              `${data.letter}। ${data.sound}`,
            )
          }
          style={({ pressed }) => [
            styles.soundButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.soundIcon}>
            🔊
          </Text>
          <Text style={styles.soundText}>
            {data.sound || "অক্ষরটি শুনি"}
          </Text>
        </Pressable>
      </View>

      {!showExamples ? (
        <View style={styles.challengeCard}>
          <Text style={styles.challengeLabel}>
            MINI CHALLENGE
          </Text>
          <Text style={styles.challengeTitle}>
            এই অক্ষর দিয়ে শব্দ চিনবে?
          </Text>
          <Text style={styles.challengeBody}>
            উদাহরণগুলো খুলে শব্দ শুনে শিখো।
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={handleRevealExamples}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed &&
                styles.primaryButtonPressed,
            ]}
          >
            <View
              style={styles.primaryIconCircle}
            >
              <Text style={styles.primaryIcon}>
                ✨
              </Text>
            </View>

            <View style={styles.primaryCopy}>
              <Text
                style={styles.primaryEyebrow}
              >
                UNLOCK
              </Text>
              <Text style={styles.primaryText}>
                শব্দের কার্ড খুলি
              </Text>
            </View>

            <Text style={styles.primaryArrow}>
              →
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.examplesSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                TAP & LISTEN
              </Text>
              <Text style={styles.sectionTitle}>
                সব কার্ডে চাপ দাও
              </Text>
            </View>

            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {visitedExamples.length}/
                {totalExamples}
              </Text>
            </View>
          </View>

          {totalExamples > 0 ? (
            <View style={styles.examplesGrid}>
              {data.examples.map(
                (item, index) => {
                  const visited =
                    visitedExamples.includes(
                      index,
                    );

                  return (
                    <Pressable
                      key={`${item.word}-${index}`}
                      accessibilityRole="button"
                      onPress={() =>
                        handleExamplePress(
                          index,
                          item.word,
                        )
                      }
                      style={({ pressed }) => [
                        styles.exampleCard,
                        visited &&
                          styles.exampleCardVisited,
                        pressed &&
                          styles.exampleCardPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.exampleEmojiCircle,
                          visited &&
                            styles.exampleEmojiCircleVisited,
                        ]}
                      >
                        <Text
                          style={styles.exampleEmoji}
                        >
                          {item.emoji || "⭐"}
                        </Text>
                      </View>

                      <Text
                        style={styles.exampleWord}
                      >
                        {item.word}
                      </Text>

                      <View
                        style={[
                          styles.exampleStatus,
                          visited &&
                            styles.exampleStatusVisited,
                        ]}
                      >
                        <Text
                          style={
                            styles.exampleStatusText
                          }
                        >
                          {visited
                            ? "✓ শোনা হয়েছে"
                            : "🔊 শুনি"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                },
              )}
            </View>
          ) : (
            <View style={styles.noExamplesCard}>
              <Text style={styles.noExamplesEmoji}>
                ✅
              </Text>
              <Text style={styles.noExamplesText}>
                অক্ষরটি চিনলেই mission শেষ।
              </Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={
              !allExamplesVisited || completed
            }
            onPress={handleComplete}
            style={({ pressed }) => [
              styles.completeButton,
              (!allExamplesVisited ||
                completed) &&
                styles.completeButtonDisabled,
              pressed &&
                allExamplesVisited &&
                !completed &&
                styles.completeButtonPressed,
            ]}
          >
            <View
              style={styles.completeIconCircle}
            >
              <Text style={styles.completeIcon}>
                {completed ? "✓" : "🏆"}
              </Text>
            </View>

            <View style={styles.completeCopy}>
              <Text
                style={styles.completeEyebrow}
              >
                {completed
                  ? "MISSION CLEARED"
                  : "FINAL STEP"}
              </Text>
              <Text style={styles.completeText}>
                {completed
                  ? "অক্ষর শেখা সম্পন্ন"
                  : allExamplesVisited
                    ? "মিশন শেষ করি"
                    : "সব কার্ড আগে শুনো"}
              </Text>
            </View>

            <Text style={styles.completeArrow}>
              {completed ? "★" : "→"}
            </Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  missionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  missionIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#7653BD",
  },
  missionIconText: {
    fontSize: 22,
  },
  headerCopy: {
    flex: 1,
    marginLeft: 11,
  },
  headerEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#94899A",
  },
  headerTitle: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "900",
    color: "#2B252F",
  },
  headerTitleTablet: {
    fontSize: 22,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#FFE6A1",
  },
  xpText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#805900",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    overflow: "hidden",
    marginTop: 12,
    borderRadius: 4,
    backgroundColor: "#E7E1EA",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#7653BD",
  },
  stage: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 13,
    paddingTop: 10,
    paddingBottom: 20,
    borderRadius: 29,
    backgroundColor: "#E6DCFB",
  },
  stageOrbOne: {
    position: "absolute",
    top: -44,
    right: -38,
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor:
      "rgba(255,255,255,0.35)",
  },
  stageOrbTwo: {
    position: "absolute",
    left: -50,
    bottom: -72,
    width: 185,
    height: 185,
    borderRadius: 93,
    backgroundColor:
      "rgba(255,255,255,0.24)",
  },
  mimiZone: {
    alignItems: "center",
  },
  mimiBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -13,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor:
      "rgba(35,29,39,0.84)",
  },
  mimiDot: {
    marginRight: 5,
    fontSize: 8,
    color: "#6FE16A",
  },
  mimiBadgeText: {
    fontSize: 8,
    letterSpacing: 0.9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  letterOrb: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    borderWidth: 7,
    borderColor: "rgba(255,255,255,0.86)",
    borderRadius: 75,
    backgroundColor: "#FFFFFF",
    shadowColor: "#7653BD",
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.18,
    shadowRadius: 13,
    elevation: 7,
  },
  letter: {
    fontSize: 91,
    lineHeight: 112,
    fontWeight: "900",
    color: "#7653BD",
  },
  letterTablet: {
    fontSize: 108,
    lineHeight: 130,
  },
  soundButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#211C24",
  },
  soundIcon: {
    marginRight: 7,
    fontSize: 16,
  },
  soundText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  challengeCard: {
    width: "94%",
    alignItems: "center",
    marginTop: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4DEE7",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  challengeLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: "900",
    color: "#9B8FA1",
  },
  challengeTitle: {
    marginTop: 7,
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    color: "#2A242D",
  },
  challengeBody: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#716775",
  },
  primaryButton: {
    width: "100%",
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 7,
    borderRadius: 30,
    backgroundColor: "#211C24",
  },
  primaryButtonPressed: {
    transform: [{ translateY: 3 }],
  },
  primaryIconCircle: {
    width: 47,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#C98AFF",
  },
  primaryIcon: {
    fontSize: 19,
  },
  primaryCopy: {
    flex: 1,
    marginLeft: 11,
  },
  primaryEyebrow: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#B9AFBC",
  },
  primaryText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  primaryArrow: {
    marginRight: 15,
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  examplesSection: {
    width: "100%",
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.1,
    fontWeight: "900",
    color: "#978B9D",
  },
  sectionTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#2C2630",
  },
  counterBadge: {
    minWidth: 50,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#EEE8F8",
  },
  counterText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#7653BD",
  },
  examplesGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  exampleCard: {
    minWidth: 135,
    flexGrow: 1,
    flexBasis: "45%",
    alignItems: "center",
    padding: 13,
    borderWidth: 2,
    borderColor: "#E4DDE8",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  exampleCardVisited: {
    borderColor: "#62BE79",
    backgroundColor: "#ECF9EF",
  },
  exampleCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  exampleEmojiCircle: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#FFF1C8",
  },
  exampleEmojiCircleVisited: {
    backgroundColor: "#D9F3DF",
  },
  exampleEmoji: {
    fontSize: 36,
  },
  exampleWord: {
    marginTop: 9,
    fontSize: 21,
    fontWeight: "900",
    color: "#2E2832",
  },
  exampleStatus: {
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#EEE8F8",
  },
  exampleStatusVisited: {
    backgroundColor: "#CDEED5",
  },
  exampleStatusText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#62586A",
  },
  noExamplesCard: {
    alignItems: "center",
    marginTop: 12,
    padding: 20,
    borderRadius: 21,
    backgroundColor: "#F3F8F4",
  },
  noExamplesEmoji: {
    fontSize: 30,
  },
  noExamplesText: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: "800",
    color: "#496650",
  },
  completeButton: {
    minHeight: 63,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingHorizontal: 8,
    borderRadius: 32,
    backgroundColor: "#211C24",
  },
  completeButtonDisabled: {
    opacity: 0.42,
  },
  completeButtonPressed: {
    transform: [{ translateY: 3 }],
  },
  completeIconCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFD15C",
  },
  completeIcon: {
    fontSize: 20,
    fontWeight: "900",
    color: "#5D4200",
  },
  completeCopy: {
    flex: 1,
    marginLeft: 12,
  },
  completeEyebrow: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#B9AFBC",
  },
  completeText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  completeArrow: {
    marginRight: 15,
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
