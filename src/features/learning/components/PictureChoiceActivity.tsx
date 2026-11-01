import React, {
  useEffect,
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

type PictureOption = {
  emoji: string;
  label: string;
};

type Props = {
  activity: {
    title?: string;
    instruction?: string;
    data: {
      question: string;
      options: PictureOption[];
      answer: number;
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

export default function PictureChoiceActivity({
  activity,
  onComplete,
}: Props) {
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 600;

  const { data } = activity;

  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  const entrance = useRef(
    new Animated.Value(0),
  ).current;

  const shake = useRef(
    new Animated.Value(0),
  ).current;

  const successScale = useRef(
    new Animated.Value(1),
  ).current;

  const [selected, setSelected] =
    useState<number | null>(null);

  const [wrongOptions, setWrongOptions] =
    useState<number[]>([]);

  const [attempts, setAttempts] =
    useState(0);

  const [completed, setCompleted] =
    useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const entranceAnimation =
      Animated.spring(entrance, {
        toValue: 1,
        friction: 6,
        tension: 55,
        useNativeDriver: true,
      });

    entranceAnimation.start();

    const timer = setTimeout(() => {
      speakBangla(data.question);
    }, 350);

    if (
      data.options.length === 0 &&
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
    data.options.length,
    data.question,
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
    outputRange: [-10, 0, 10],
  });

  const characterSize = isTablet
    ? 210
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
      Animated.timing(successScale, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),

      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const choose = (index: number) => {
    if (completed) {
      return;
    }

    setSelected(index);
    setAttempts((current) => current + 1);

    if (index === data.answer) {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      setCompleted(true);

      runSuccessAnimation();

      speakBangla(
        "দারুণ! তুমি সঠিক ছবি খুঁজে পেয়েছো।",
      );

      onCompleteRef.current();
      return;
    }

    setWrongOptions((current) =>
      current.includes(index)
        ? current
        : [...current, index],
    );

    runWrongAnimation();

    speakBangla(
      "এই ছবিটি সঠিক নয়। আবার চেষ্টা করো।",
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
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>
            🔍
          </Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            PICTURE HUNT
          </Text>

          <Text
            style={[
              styles.title,
              isTablet && styles.titleTablet,
            ]}
          >
            {activity.title ??
              "সঠিক ছবি খুঁজে নাও"}
          </Text>
        </View>

        <View style={styles.tryBadge}>
          <Text style={styles.tryLabel}>
            TRY
          </Text>

          <Text style={styles.tryValue}>
            {attempts + 1}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: completed
                ? "100%"
                : selected === null
                  ? "20%"
                  : "60%",
            },
          ]}
        />
      </View>

      <View style={styles.stage}>
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />

        <MimiCharacter
          emotion={
            completed
              ? "celebrate"
              : selected !== null
                ? "talking"
                : "happy"
          }
          size={characterSize}
        />

        <View style={styles.guideBadge}>
          <Text style={styles.guideDot}>
            ●
          </Text>

          <Text style={styles.guideText}>
            PICTURE COACH
          </Text>
        </View>

        <Animated.View
          style={[
            styles.questionCard,
            completed &&
              styles.questionCardCompleted,
            {
              transform: [
                { translateX: shakeX },
                { scale: successScale },
              ],
            },
          ]}
        >
          <View style={styles.questionTop}>
            <View style={styles.questionIcon}>
              <Text
                style={styles.questionEmoji}
              >
                🎯
              </Text>
            </View>

            <View style={styles.questionCopy}>
              <Text
                style={styles.questionLabel}
              >
                FIND THE ANSWER
              </Text>

              <Text
                style={styles.questionHelper}
              >
                সঠিক ছবিতে চাপ দাও
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="প্রশ্নটি শুনি"
              onPress={() =>
                speakBangla(data.question)
              }
              style={({ pressed }) => [
                styles.listenButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.listenIcon}>
                🔊
              </Text>

              {!isSmallPhone ? (
                <Text
                  style={styles.listenText}
                >
                  শুনি
                </Text>
              ) : null}
            </Pressable>
          </View>

          <Text
            style={[
              styles.question,
              isTablet &&
                styles.questionTablet,
            ]}
          >
            {data.question}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.optionHeader}>
        <View>
          <Text style={styles.eyebrow}>
            CHOOSE A PICTURE
          </Text>

          <Text style={styles.optionTitle}>
            ছবিগুলো দেখো
          </Text>
        </View>

        <View style={styles.optionBadge}>
          <Text style={styles.optionBadgeText}>
            {data.options.length} CARDS
          </Text>
        </View>
      </View>

      <View style={styles.optionGrid}>
        {data.options.map(
          (option, index) => {
            const isWrong =
              wrongOptions.includes(index);

            const isCorrect =
              completed &&
              index === data.answer;

            const isSelected =
              selected === index;

            return (
              <Pressable
                key={`${option.label}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${option.label} ছবি`}
                disabled={completed}
                onPress={() => choose(index)}
                style={({ pressed }) => [
                  styles.optionCard,

                  isSelected &&
                    !completed &&
                    styles.optionCardSelected,

                  isWrong &&
                    styles.optionCardWrong,

                  isCorrect &&
                    styles.optionCardCorrect,

                  pressed &&
                    !completed &&
                    styles.optionPressed,
                ]}
              >
                <View
                  style={[
                    styles.emojiCircle,

                    isWrong &&
                      styles.emojiCircleWrong,

                    isCorrect &&
                      styles.emojiCircleCorrect,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionEmoji,
                      isTablet &&
                        styles.optionEmojiTablet,
                    ]}
                  >
                    {option.emoji || "⭐"}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.optionLabel,

                    isWrong &&
                      styles.optionLabelWrong,

                    isCorrect &&
                      styles.optionLabelCorrect,
                  ]}
                  numberOfLines={2}
                >
                  {option.label}
                </Text>

                <View
                  style={[
                    styles.statusPill,

                    isWrong &&
                      styles.statusPillWrong,

                    isCorrect &&
                      styles.statusPillCorrect,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,

                      isWrong &&
                        styles.statusTextWrong,

                      isCorrect &&
                        styles.statusTextCorrect,
                    ]}
                  >
                    {isCorrect
                      ? "✓ সঠিক ছবি"
                      : isWrong
                        ? "× আবার চেষ্টা"
                        : "চাপ দাও"}
                  </Text>
                </View>
              </Pressable>
            );
          },
        )}
      </View>

      {selected !== null && !completed ? (
        <View style={styles.feedbackWrong}>
          <View
            style={styles.feedbackIconCircle}
          >
            <Text style={styles.feedbackIcon}>
              🔄
            </Text>
          </View>

          <View style={styles.feedbackCopy}>
            <Text
              style={styles.feedbackLabel}
            >
              TRY AGAIN
            </Text>

            <Text style={styles.feedbackText}>
              ছবিটি সঠিক নয়। অন্য একটি ছবি
              বেছে নাও।
            </Text>
          </View>
        </View>
      ) : null}

      {completed ? (
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>
              🏆
            </Text>
          </View>

          <View style={styles.successCopy}>
            <Text style={styles.successLabel}>
              PICTURE FOUND
            </Text>

            <Text style={styles.successTitle}>
              অসাধারণ!
            </Text>

            <Text style={styles.successText}>
              তুমি সঠিক ছবিটি খুঁজে পেয়েছো
            </Text>
          </View>

          <Text style={styles.rewardText}>
            +10 XP
          </Text>
        </View>
      ) : (
        <View style={styles.footerHint}>
          <Text style={styles.footerIcon}>
            💡
          </Text>

          <Text style={styles.footerText}>
            ছবিগুলো ভালোভাবে দেখে উত্তর দাও
          </Text>
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

  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#7653BD",
  },

  headerEmoji: {
    fontSize: 22,
  },

  headerCopy: {
    flex: 1,
    marginLeft: 11,
  },

  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: "900",
    color: "#958A9A",
  },

  title: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "900",
    color: "#2B252F",
  },

  titleTablet: {
    fontSize: 22,
  },

  tryBadge: {
    minWidth: 50,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#EEE8F8",
  },

  tryLabel: {
    fontSize: 7,
    fontWeight: "900",
    color: "#94889A",
  },

  tryValue: {
    marginTop: 1,
    fontSize: 14,
    fontWeight: "900",
    color: "#7653BD",
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
    paddingTop: 7,
    paddingBottom: 16,
    borderRadius: 29,
    backgroundColor: "#E5DBFA",
  },

  orbOne: {
    position: "absolute",
    top: -40,
    right: -35,
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor:
      "rgba(255,255,255,0.34)",
  },

  orbTwo: {
    position: "absolute",
    left: -55,
    bottom: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor:
      "rgba(255,255,255,0.23)",
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

  guideText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  questionCard: {
    width: "92%",
    marginTop: 11,
    padding: 15,
    borderWidth: 2,
    borderColor: "#E2DCE6",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  questionCardCompleted: {
    borderColor: "#63BD78",
    backgroundColor: "#F1FAF3",
  },

  questionTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  questionIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFF0C5",
  },

  questionEmoji: {
    fontSize: 19,
  },

  questionCopy: {
    flex: 1,
    marginLeft: 10,
  },

  questionLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#7653BD",
  },

  questionHelper: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "800",
    color: "#978D9C",
  },

  listenButton: {
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 19,
    backgroundColor: "#E6F4FF",
  },

  listenIcon: {
    fontSize: 16,
  },

  listenText: {
    marginLeft: 5,
    fontSize: 9,
    fontWeight: "900",
    color: "#277AA5",
  },

  question: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "center",
    color: "#29232D",
  },

  questionTablet: {
    fontSize: 25,
    lineHeight: 37,
  },

  optionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },

  optionTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#2C2630",
  },

  optionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#EEE8F8",
  },

  optionBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#7653BD",
  },

  optionGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 11,
  },

  optionCard: {
    minWidth: 135,
    flexGrow: 1,
    flexBasis: "45%",
    alignItems: "center",
    padding: 13,
    borderWidth: 2,
    borderColor: "#E4DDE7",
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
  },

  optionCardSelected: {
    borderColor: "#7653BD",
  },

  optionCardWrong: {
    borderColor: "#E58B8B",
    backgroundColor: "#FFF1F1",
  },

  optionCardCorrect: {
    borderColor: "#63BD78",
    backgroundColor: "#ECF9EF",
  },

  optionPressed: {
    transform: [{ scale: 0.97 }],
  },

  emojiCircle: {
    width: 75,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFF0C5",
  },

  emojiCircleWrong: {
    backgroundColor: "#F5D0D0",
  },

  emojiCircleCorrect: {
    backgroundColor: "#D1EFD8",
  },

  optionEmoji: {
    fontSize: 43,
  },

  optionEmojiTablet: {
    fontSize: 54,
  },

  optionLabel: {
    minHeight: 30,
    marginTop: 10,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    textAlign: "center",
    color: "#342D38",
  },

  optionLabelWrong: {
    color: "#974747",
  },

  optionLabelCorrect: {
    color: "#326641",
  },

  statusPill: {
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#EEE8F8",
  },

  statusPillWrong: {
    backgroundColor: "#F1C5C5",
  },

  statusPillCorrect: {
    backgroundColor: "#C7EBCF",
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#665C6B",
  },

  statusTextWrong: {
    color: "#934747",
  },

  statusTextCorrect: {
    color: "#326641",
  },

  feedbackWrong: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 13,
    borderRadius: 20,
    backgroundColor: "#FFE3E3",
  },

  feedbackIconCircle: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  feedbackIcon: {
    fontSize: 20,
  },

  feedbackCopy: {
    flex: 1,
    marginLeft: 10,
  },

  feedbackLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#9A4A4A",
  },

  feedbackText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "800",
    color: "#743F3F",
  },

  successCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 13,
    borderRadius: 21,
    backgroundColor: "#E4F7E8",
  },

  successIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },

  successEmoji: {
    fontSize: 24,
  },

  successCopy: {
    flex: 1,
    marginLeft: 10,
  },

  successLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#548160",
  },

  successTitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "900",
    color: "#2E623B",
  },

  successText: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "800",
    color: "#5F7A66",
  },

  rewardText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2D6A3C",
  },

  footerHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
  },

  footerIcon: {
    marginRight: 6,
    fontSize: 14,
  },

  footerText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#887E8D",
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
