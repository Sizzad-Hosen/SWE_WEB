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
      prompt: string;
      letters: string[];
      answer: string;
    };
  };
  onComplete: () => void;
};

function speakBangla(text: string) {
  void Speech.stop();

  Speech.speak(text, {
    language: "bn-BD",
    rate: 0.74,
    pitch: 1.05,
    volume: 1,
  });
}

export default function WordBuildActivity({
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
  const answerScale = useRef(
    new Animated.Value(1),
  ).current;
  const shake = useRef(
    new Animated.Value(0),
  ).current;
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const [selectedIndices, setSelectedIndices] =
    useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [completed, setCompleted] =
    useState(false);

  const selectedLetters = useMemo(
    () =>
      selectedIndices.map(
        (index) => data.letters[index],
      ),
    [data.letters, selectedIndices],
  );

  const word = selectedLetters.join("");
  const progress = data.letters.length
    ? Math.round(
        (selectedIndices.length /
          data.letters.length) *
          100,
      )
    : 100;

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

    entranceAnimation.start();

    const timer = setTimeout(() => {
      speakBangla(
        data.prompt ||
          "অক্ষরগুলো সাজিয়ে শব্দ তৈরি করো।",
      );
    }, 350);

    if (
      data.letters.length === 0 &&
      !completedRef.current
    ) {
      completedRef.current = true;
      setCompleted(true);
      onCompleteRef.current();
    }

    return () => {
      clearTimeout(timer);
      entranceAnimation.stop();
      void Speech.stop();
    };
  }, [
    data.letters.length,
    data.prompt,
    entrance,
  ]);

  const opacity = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const shakeX = shake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-9, 0, 9],
  });

  const characterSize = isTablet
    ? 205
    : isSmallPhone
      ? 128
      : 155;

  const runWrongAnimation = () => {
    shake.setValue(0);

    Animated.sequence([
      Animated.timing(shake, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -1,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 70,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const runSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(answerScale, {
        toValue: 1.12,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(answerScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const selectLetter = (
    letter: string,
    index: number,
  ) => {
    if (
      completed ||
      selectedIndices.includes(index)
    ) {
      return;
    }

    setWrong(false);
    speakBangla(letter);

    const nextIndices = [
      ...selectedIndices,
      index,
    ];
    const nextWord = nextIndices
      .map(
        (selectedIndex) =>
          data.letters[selectedIndex],
      )
      .join("");

    setSelectedIndices(nextIndices);

    if (nextWord === data.answer) {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      setCompleted(true);
      runSuccessAnimation();

      setTimeout(() => {
        speakBangla(
          `দারুণ! তুমি ${data.answer} শব্দটি তৈরি করেছো।`,
        );
      }, 180);

      onCompleteRef.current();
      return;
    }

    if (
      nextIndices.length ===
      data.letters.length
    ) {
      setWrong(true);
      runWrongAnimation();

      setTimeout(() => {
        speakBangla(
          "শব্দটি ঠিক হয়নি। আবার চেষ্টা করো।",
        );
      }, 150);
    }
  };

  const removeLast = () => {
    if (
      selectedIndices.length === 0 ||
      completed
    ) {
      return;
    }

    setWrong(false);
    setSelectedIndices((current) =>
      current.slice(0, -1),
    );
  };

  const reset = () => {
    if (completed) {
      return;
    }

    setWrong(false);
    setSelectedIndices([]);
    speakBangla(
      "আবার শুরু করি। অক্ষরগুলো ঠিকভাবে সাজাও।",
    );
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
            🧩
          </Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>
            WORD BUILDER
          </Text>
          <Text
            style={[
              styles.headerTitle,
              isTablet &&
                styles.headerTitleTablet,
            ]}
          >
            {activity.title ?? "শব্দ বানাই"}
          </Text>
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>
            +15 XP
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${
                completed ? 100 : progress
              }%`,
            },
          ]}
        />
      </View>

      <View style={styles.guideCard}>
        <View style={styles.guideOrbOne} />
        <View style={styles.guideOrbTwo} />

        <View style={styles.mimiZone}>
          <MimiCharacter
            emotion={
              completed
                ? "celebrate"
                : wrong
                  ? "talking"
                  : "happy"
            }
            size={characterSize}
          />

          <View style={styles.guideBadge}>
            <Text style={styles.guideDot}>
              ●
            </Text>
            <Text style={styles.guideBadgeText}>
              WORD COACH
            </Text>
          </View>
        </View>

        <View style={styles.promptCard}>
          <View style={styles.promptIcon}>
            <Text style={styles.promptIconText}>
              🎯
            </Text>
          </View>

          <View style={styles.promptCopy}>
            <Text style={styles.promptLabel}>
              তোমার mission
            </Text>
            <Text
              style={[
                styles.promptText,
                isTablet &&
                  styles.promptTextTablet,
              ]}
            >
              {data.prompt}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="নির্দেশনা শুনি"
            onPress={() =>
              speakBangla(data.prompt)
            }
            style={({ pressed }) => [
              styles.listenButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.listenIcon}>
              🔊
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.answerHeader}>
        <View>
          <Text style={styles.answerEyebrow}>
            YOUR WORD
          </Text>
          <Text style={styles.answerTitle}>
            তৈরি করা শব্দ
          </Text>
        </View>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {selectedIndices.length}/
            {data.letters.length}
          </Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.answerCard,
          wrong && styles.answerCardWrong,
          completed &&
            styles.answerCardCompleted,
          {
            transform: [
              { translateX: shakeX },
              { scale: answerScale },
            ],
          },
        ]}
      >
        <View style={styles.answerSlots}>
          {data.letters.map((_, index) => {
            const letter =
              selectedLetters[index];

            return (
              <View
                key={`answer-slot-${index}`}
                style={[
                  styles.answerSlot,
                  letter &&
                    styles.answerSlotFilled,
                  completed &&
                    styles.answerSlotCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.answerLetter,
                    completed &&
                      styles.answerLetterCompleted,
                  ]}
                >
                  {letter ?? ""}
                </Text>
              </View>
            );
          })}
        </View>

        <Text
          style={[
            styles.wordPreview,
            wrong &&
              styles.wordPreviewWrong,
            completed &&
              styles.wordPreviewCompleted,
          ]}
        >
          {word ||
            "অক্ষর বেছে নাও"}
        </Text>

        {wrong ? (
          <View style={styles.feedbackWrong}>
            <Text
              style={styles.feedbackWrongIcon}
            >
              🔄
            </Text>
            <Text
              style={styles.feedbackWrongText}
            >
              শব্দটি ঠিক হয়নি—আবার চেষ্টা করো
            </Text>
          </View>
        ) : completed ? (
          <View
            style={styles.feedbackSuccess}
          >
            <Text
              style={
                styles.feedbackSuccessIcon
              }
            >
              🏆
            </Text>
            <Text
              style={
                styles.feedbackSuccessText
              }
            >
              অসাধারণ! শব্দটি সঠিক হয়েছে
            </Text>
          </View>
        ) : (
          <View style={styles.feedbackHint}>
            <Text
              style={styles.feedbackHintIcon}
            >
              💡
            </Text>
            <Text
              style={styles.feedbackHintText}
            >
              নিচের অক্ষরগুলো সঠিক ক্রমে চাপ দাও
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.letterHeader}>
        <Text style={styles.letterHeaderText}>
          LETTER TILES
        </Text>

        <View style={styles.utilityButtons}>
          <Pressable
            accessibilityRole="button"
            disabled={
              selectedIndices.length === 0 ||
              completed
            }
            onPress={removeLast}
            style={({ pressed }) => [
              styles.utilityButton,
              (selectedIndices.length === 0 ||
                completed) &&
                styles.utilityButtonDisabled,
              pressed &&
                selectedIndices.length > 0 &&
                !completed &&
                styles.utilityButtonPressed,
            ]}
          >
            <Text style={styles.utilityIcon}>
              ⌫
            </Text>
            {!isSmallPhone ? (
              <Text
                style={styles.utilityText}
              >
                এক ধাপ পেছনে
              </Text>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={
              selectedIndices.length === 0 ||
              completed
            }
            onPress={reset}
            style={({ pressed }) => [
              styles.utilityButton,
              (selectedIndices.length === 0 ||
                completed) &&
                styles.utilityButtonDisabled,
              pressed &&
                selectedIndices.length > 0 &&
                !completed &&
                styles.utilityButtonPressed,
            ]}
          >
            <Text style={styles.utilityIcon}>
              ↻
            </Text>
            {!isSmallPhone ? (
              <Text
                style={styles.utilityText}
              >
                আবার
              </Text>
            ) : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.lettersGrid}>
        {data.letters.map(
          (letter, index) => {
            const selected =
              selectedIndices.includes(index);

            return (
              <Pressable
                key={`${letter}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${letter} অক্ষর`}
                disabled={
                  selected || completed
                }
                onPress={() =>
                  selectLetter(letter, index)
                }
                style={({ pressed }) => [
                  styles.letterTile,
                  selected &&
                    styles.letterTileSelected,
                  completed &&
                    styles.letterTileCompleted,
                  pressed &&
                    !selected &&
                    !completed &&
                    styles.letterTilePressed,
                ]}
              >
                <Text
                  style={[
                    styles.letterText,
                    selected &&
                      styles.letterTextSelected,
                  ]}
                >
                  {selected ? "✓" : letter}
                </Text>

                <Text style={styles.tileNumber}>
                  {index + 1}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      {completed ? (
        <View style={styles.rewardCard}>
          <View style={styles.rewardIconCircle}>
            <Text style={styles.rewardIcon}>
              ⭐
            </Text>
          </View>

          <View style={styles.rewardCopy}>
            <Text style={styles.rewardLabel}>
              MISSION CLEARED
            </Text>
            <Text style={styles.rewardText}>
              {data.answer} শব্দটি তৈরি হয়েছে
            </Text>
          </View>

          <Text style={styles.rewardXp}>
            +15 XP
          </Text>
        </View>
      ) : null}
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
    letterSpacing: 1.25,
    fontWeight: "900",
    color: "#958A9A",
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
  guideCard: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 13,
    paddingTop: 7,
    paddingBottom: 16,
    borderRadius: 29,
    backgroundColor: "#E5DBFA",
  },
  guideOrbOne: {
    position: "absolute",
    top: -40,
    right: -35,
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor:
      "rgba(255,255,255,0.34)",
  },
  guideOrbTwo: {
    position: "absolute",
    left: -55,
    bottom: -72,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor:
      "rgba(255,255,255,0.23)",
  },
  mimiZone: {
    alignItems: "center",
  },
  guideBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -13,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor:
      "rgba(35,29,39,0.84)",
  },
  guideDot: {
    marginRight: 5,
    fontSize: 8,
    color: "#6FE16A",
  },
  guideBadgeText: {
    fontSize: 8,
    letterSpacing: 0.9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  promptCard: {
    width: "92%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2DCE6",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  promptIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFF0C5",
  },
  promptIconText: {
    fontSize: 19,
  },
  promptCopy: {
    flex: 1,
    marginLeft: 10,
  },
  promptLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#968C9B",
  },
  promptText: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
    color: "#2C2630",
  },
  promptTextTablet: {
    fontSize: 18,
    lineHeight: 25,
  },
  listenButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#E6F4FF",
  },
  listenIcon: {
    fontSize: 16,
  },
  answerHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  answerEyebrow: {
    fontSize: 8,
    letterSpacing: 1.15,
    fontWeight: "900",
    color: "#978B9D",
  },
  answerTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#2C2630",
  },
  counterBadge: {
    minWidth: 50,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#EEE8F8",
  },
  counterText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#7653BD",
  },
  answerCard: {
    width: "100%",
    alignItems: "center",
    marginTop: 11,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E4DDE7",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },
  answerCardWrong: {
    borderColor: "#E78C8C",
    backgroundColor: "#FFF2F2",
  },
  answerCardCompleted: {
    borderColor: "#65BD7A",
    backgroundColor: "#ECF9EF",
  },
  answerSlots: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  answerSlot: {
    minWidth: 48,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D6CDD9",
    borderRadius: 16,
    backgroundColor: "#F8F5F9",
  },
  answerSlotFilled: {
    borderStyle: "solid",
    borderColor: "#7653BD",
    backgroundColor: "#EEE8FA",
  },
  answerSlotCompleted: {
    borderColor: "#65BD7A",
    backgroundColor: "#D9F3DF",
  },
  answerLetter: {
    fontSize: 26,
    fontWeight: "900",
    color: "#7653BD",
  },
  answerLetterCompleted: {
    color: "#2E6A3D",
  },
  wordPreview: {
    marginTop: 13,
    fontSize: 25,
    fontWeight: "900",
    color: "#403847",
  },
  wordPreviewWrong: {
    color: "#A64D4D",
  },
  wordPreviewCompleted: {
    color: "#2E6A3D",
  },
  feedbackHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#FFF6D9",
  },
  feedbackHintIcon: {
    marginRight: 6,
    fontSize: 15,
  },
  feedbackHintText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#675A35",
  },
  feedbackWrong: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#F9DCDC",
  },
  feedbackWrongIcon: {
    marginRight: 6,
    fontSize: 15,
  },
  feedbackWrongText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#8A3E3E",
  },
  feedbackSuccess: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#CFEFD7",
  },
  feedbackSuccessIcon: {
    marginRight: 6,
    fontSize: 15,
  },
  feedbackSuccessText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#326641",
  },
  letterHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  letterHeaderText: {
    fontSize: 8,
    letterSpacing: 1.15,
    fontWeight: "900",
    color: "#978B9D",
  },
  utilityButtons: {
    flexDirection: "row",
    gap: 7,
  },
  utilityButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: "#EEE8F8",
  },
  utilityButtonDisabled: {
    opacity: 0.42,
  },
  utilityButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  utilityIcon: {
    fontSize: 14,
    fontWeight: "900",
    color: "#7653BD",
  },
  utilityText: {
    marginLeft: 5,
    fontSize: 8,
    fontWeight: "900",
    color: "#7653BD",
  },
  lettersGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 11,
  },
  letterTile: {
    position: "relative",
    minWidth: 70,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D9CEE8",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    shadowColor: "#766D7B",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.11,
    shadowRadius: 7,
    elevation: 4,
  },
  letterTileSelected: {
    borderColor: "#BDB4C2",
    backgroundColor: "#EFEAEF",
    shadowOpacity: 0,
    elevation: 0,
  },
  letterTileCompleted: {
    borderColor: "#C9E8D0",
  },
  letterTilePressed: {
    transform: [{ translateY: 3 }],
  },
  letterText: {
    fontSize: 31,
    fontWeight: "900",
    color: "#7653BD",
  },
  letterTextSelected: {
    fontSize: 22,
    color: "#8E8493",
  },
  tileNumber: {
    position: "absolute",
    top: 6,
    right: 8,
    fontSize: 8,
    fontWeight: "900",
    color: "#B0A6B4",
  },
  rewardCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    padding: 13,
    borderRadius: 21,
    backgroundColor: "#E6F7EA",
  },
  rewardIconCircle: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  rewardIcon: {
    fontSize: 21,
  },
  rewardCopy: {
    flex: 1,
    marginLeft: 10,
  },
  rewardLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#50815D",
  },
  rewardText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "900",
    color: "#315E3C",
  },
  rewardXp: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2D6A3C",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
