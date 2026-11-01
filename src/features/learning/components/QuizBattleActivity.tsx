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

type Props = {
  prompt: string;
  options: string[];
  answer: number;
  hint: string;
  attempts: number;
  onAttempt: (correct: boolean) => void;
};

function speakBangla(text: string) {
  void Speech.stop();

  Speech.speak(text, {
    language: "bn-BD",
    rate: 0.74,
    pitch: 1.05,
  });
}

export default function QuizBattleActivity({
  prompt,
  options,
  answer,
  hint,
  attempts,
  onAttempt,
}: Props) {
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 600;

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

  const [localAttempts, setLocalAttempts] =
    useState(0);

  const [correct, setCorrect] =
    useState(false);

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      friction: 6,
      tension: 55,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      speakBangla(prompt);
    }, 350);

    return () => {
      clearTimeout(timer);
      void Speech.stop();
    };
  }, [entrance, prompt]);

  const opacity = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const shakeX = shake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-10, 0, 10],
  });

  const totalAttempts =
    attempts + localAttempts;

  const characterSize = isTablet
    ? 205
    : isSmallPhone
      ? 125
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
    if (correct) {
      return;
    }

    setSelected(index);
    setLocalAttempts(
      (current) => current + 1,
    );

    const result = index === answer;

    onAttempt(result);

    if (result) {
      setCorrect(true);
      runSuccessAnimation();

      speakBangla(
        "সঠিক উত্তর! দারুণ করেছো।",
      );

      return;
    }

    setWrongOptions((current) =>
      current.includes(index)
        ? current
        : [...current, index],
    );

    runWrongAnimation();

    speakBangla(
      "উত্তরটি ঠিক হয়নি। ইঙ্গিত দেখে আবার চেষ্টা করো।",
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
          <Text style={styles.headerIconText}>
            ⚔️
          </Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            QUIZ BATTLE
          </Text>

          <Text
            style={[
              styles.title,
              isTablet && styles.titleTablet,
            ]}
          >
            সঠিক উত্তর খুঁজে নাও
          </Text>
        </View>

        <View style={styles.attemptBadge}>
          <Text style={styles.attemptLabel}>
            TRY
          </Text>

          <Text style={styles.attemptValue}>
            {totalAttempts + 1}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: correct
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
            correct
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
            QUIZ COACH
          </Text>
        </View>

        <Animated.View
          style={[
            styles.questionCard,
            correct &&
              styles.questionCardCorrect,
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
                style={
                  styles.questionIconText
                }
              >
                ❓
              </Text>
            </View>

            <View style={styles.questionCopy}>
              <Text
                style={styles.questionLabel}
              >
                BATTLE QUESTION
              </Text>

              <Text
                style={styles.questionHelper}
              >
                উত্তর বেছে নাও
              </Text>
            </View>

            <Pressable
              onPress={() =>
                speakBangla(prompt)
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
            {prompt}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.answerHeader}>
        <View>
          <Text style={styles.eyebrow}>
            CHOOSE ONE
          </Text>

          <Text style={styles.answerTitle}>
            তোমার উত্তর
          </Text>
        </View>

        <View style={styles.optionCount}>
          <Text style={styles.optionCountText}>
            {options.length} OPTIONS
          </Text>
        </View>
      </View>

      <View style={styles.optionList}>
        {options.map((option, index) => {
          const isWrong =
            wrongOptions.includes(index);

          const isCorrect =
            correct && index === answer;

          return (
            <Pressable
              key={`${option}-${index}`}
              disabled={correct}
              onPress={() => choose(index)}
              style={({ pressed }) => [
                styles.option,
                isWrong && styles.optionWrong,
                isCorrect &&
                  styles.optionCorrect,
                pressed &&
                  !correct &&
                  styles.optionPressed,
              ]}
            >
              <View
                style={[
                  styles.optionLetter,
                  isWrong &&
                    styles.optionLetterWrong,
                  isCorrect &&
                    styles.optionLetterCorrect,
                ]}
              >
                <Text
                  style={[
                    styles.optionLetterText,
                    (isWrong || isCorrect) &&
                      styles.optionLetterActive,
                  ]}
                >
                  {isCorrect
                    ? "✓"
                    : isWrong
                      ? "×"
                      : String.fromCharCode(
                          65 + index,
                        )}
                </Text>
              </View>

              <Text
                style={[
                  styles.optionText,
                  isWrong &&
                    styles.optionTextWrong,
                  isCorrect &&
                    styles.optionTextCorrect,
                ]}
              >
                {option}
              </Text>

              <Text
                style={[
                  styles.status,
                  isWrong &&
                    styles.statusWrong,
                  isCorrect &&
                    styles.statusCorrect,
                ]}
              >
                {isCorrect
                  ? "সঠিক"
                  : isWrong
                    ? "আবার"
                    : "বেছে নাও"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selected !== null && !correct ? (
        <View style={styles.hintCard}>
          <View style={styles.hintIcon}>
            <Text style={styles.hintEmoji}>
              💡
            </Text>
          </View>

          <View style={styles.hintCopy}>
            <Text style={styles.hintLabel}>
              MIMI'S HINT
            </Text>

            <Text style={styles.hintText}>
              {hint ||
                "প্রশ্নটি মন দিয়ে পড়ে আবার চেষ্টা করো।"}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              speakBangla(
                hint ||
                  "প্রশ্নটি মন দিয়ে পড়ে আবার চেষ্টা করো।",
              )
            }
            style={styles.hintListen}
          >
            <Text>🔊</Text>
          </Pressable>
        </View>
      ) : null}

      {correct ? (
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>
              🏆
            </Text>
          </View>

          <View style={styles.successCopy}>
            <Text style={styles.successLabel}>
              BATTLE WON
            </Text>

            <Text style={styles.successTitle}>
              সঠিক উত্তর!
            </Text>

            <Text style={styles.successText}>
              {Math.max(
                1,
                totalAttempts,
              )}{" "}
              বার চেষ্টা করে শেষ করেছো
            </Text>
          </View>

          <Text style={styles.successStar}>
            ⭐
          </Text>
        </View>
      ) : (
        <View style={styles.footerHint}>
          <Text style={styles.footerIcon}>
            🎯
          </Text>

          <Text style={styles.footerText}>
            সঠিক উত্তর না পাওয়া পর্যন্ত চেষ্টা
            চালিয়ে যাও
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

  headerIconText: {
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

  attemptBadge: {
    minWidth: 50,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#EEE8F8",
  },

  attemptLabel: {
    fontSize: 7,
    fontWeight: "900",
    color: "#94889A",
  },

  attemptValue: {
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
    letterSpacing: 0.9,
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

  questionCardCorrect: {
    borderColor: "#63BD78",
    backgroundColor: "#F2FBF4",
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

  questionIconText: {
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

  answerHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },

  answerTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#2C2630",
  },

  optionCount: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#EEE8F8",
  },

  optionCountText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#7653BD",
  },

  optionList: {
    width: "100%",
    marginTop: 11,
  },

  option: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 9,
    borderWidth: 2,
    borderColor: "#E4DDE7",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  optionWrong: {
    borderColor: "#E58B8B",
    backgroundColor: "#FFF1F1",
  },

  optionCorrect: {
    borderColor: "#63BD78",
    backgroundColor: "#ECF9EF",
  },

  optionPressed: {
    transform: [{ translateY: 3 }],
  },

  optionLetter: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#EEE8F8",
  },

  optionLetterWrong: {
    backgroundColor: "#E8A5A5",
  },

  optionLetterCorrect: {
    backgroundColor: "#70C984",
  },

  optionLetterText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#7653BD",
  },

  optionLetterActive: {
    color: "#FFFFFF",
  },

  optionText: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "900",
    color: "#342D38",
  },

  optionTextWrong: {
    color: "#974747",
  },

  optionTextCorrect: {
    color: "#326641",
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#F4F0F6",
    fontSize: 7,
    fontWeight: "900",
    color: "#8B808F",
  },

  statusWrong: {
    backgroundColor: "#F1C5C5",
    color: "#934747",
  },

  statusCorrect: {
    backgroundColor: "#C7EBCF",
    color: "#326641",
  },

  hintCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    padding: 13,
    borderRadius: 20,
    backgroundColor: "#FFF4D1",
  },

  hintIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  hintEmoji: {
    fontSize: 20,
  },

  hintCopy: {
    flex: 1,
    marginLeft: 10,
  },

  hintLabel: {
    fontSize: 8,
    letterSpacing: 0.9,
    fontWeight: "900",
    color: "#947B32",
  },

  hintText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "800",
    color: "#615431",
  },

  hintListen: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },

  successCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
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
    letterSpacing: 1,
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

  successStar: {
    fontSize: 25,
  },

  footerHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
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
