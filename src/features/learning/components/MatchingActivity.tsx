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

type Pair = {
  emoji: string;
  word: string;
};

type Props = {
  activity: {
    payload: {
      prompt: string;
      pairs: Pair[];
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
  });
}

export default function MatchingActivity({
  activity,
  onComplete,
}: Props) {
  const { width } = useWindowDimensions();

  const isTablet = width >= 600;
  const data = activity.payload;

  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const shake = useRef(
    new Animated.Value(0),
  ).current;

  const wordChoices = useMemo(
    () =>
      data.pairs
        .map((pair, pairIndex) => ({
          pairIndex,
          word: pair.word,
        }))
        .reverse(),
    [data.pairs],
  );

  const [
    selectedPicture,
    setSelectedPicture,
  ] = useState<number | null>(null);

  const [selectedWord, setSelectedWord] =
    useState<number | null>(null);

  const [matched, setMatched] = useState<
    number[]
  >([]);

  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      speakBangla(data.prompt);
    }, 350);

    if (
      data.pairs.length === 0 &&
      !completedRef.current
    ) {
      completedRef.current = true;
      onCompleteRef.current();
    }

    return () => {
      clearTimeout(timer);
      void Speech.stop();
    };
  }, [data.pairs.length, data.prompt]);

  const progress = data.pairs.length
    ? Math.round(
        (matched.length /
          data.pairs.length) *
          100,
      )
    : 100;

  const shakeX = shake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-8, 0, 8],
  });

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

  const checkMatch = (
    pictureIndex: number,
    wordIndex: number,
  ) => {
    const wordChoice =
      wordChoices[wordIndex];

    if (
      wordChoice.pairIndex === pictureIndex
    ) {
      const nextMatched = matched.includes(
        pictureIndex,
      )
        ? matched
        : [...matched, pictureIndex];

      setMatched(nextMatched);
      setWrong(false);

      speakBangla(
        `সঠিক মিল। ${data.pairs[pictureIndex].word}`,
      );

      if (
        nextMatched.length ===
          data.pairs.length &&
        !completedRef.current
      ) {
        completedRef.current = true;

        setTimeout(() => {
          speakBangla(
            "দারুণ! সবগুলো মিল সঠিক হয়েছে।",
          );
        }, 300);

        onCompleteRef.current();
      }
    } else {
      setWrong(true);
      runWrongAnimation();

      speakBangla(
        "মিল হয়নি। আবার চেষ্টা করো।",
      );
    }

    setSelectedPicture(null);
    setSelectedWord(null);
  };

  const choosePicture = (index: number) => {
    if (matched.includes(index)) {
      return;
    }

    setWrong(false);
    setSelectedPicture(index);

    speakBangla(
      data.pairs[index].word,
    );

    if (selectedWord !== null) {
      checkMatch(index, selectedWord);
    }
  };

  const chooseWord = (index: number) => {
    const pairIndex =
      wordChoices[index].pairIndex;

    if (matched.includes(pairIndex)) {
      return;
    }

    setWrong(false);
    setSelectedWord(index);

    speakBangla(
      wordChoices[index].word,
    );

    if (selectedPicture !== null) {
      checkMatch(selectedPicture, index);
    }
  };

  const characterSize = isTablet
    ? 205
    : 150;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>
            🔗
          </Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            MATCH BATTLE
          </Text>

          <Text
            style={[
              styles.title,
              isTablet && styles.titleTablet,
            ]}
          >
            সঠিক মিল খুঁজে নাও
          </Text>
        </View>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {matched.length}/
            {data.pairs.length}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%` },
          ]}
        />
      </View>

      <View style={styles.stage}>
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />

        <MimiCharacter
          emotion={
            matched.length ===
            data.pairs.length
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

          <Text style={styles.guideText}>
            MATCH COACH
          </Text>
        </View>

        <View style={styles.promptCard}>
          <Text style={styles.promptIcon}>
            🎯
          </Text>

          <View style={styles.promptCopy}>
            <Text style={styles.promptLabel}>
              তোমার mission
            </Text>

            <Text style={styles.promptText}>
              {data.prompt}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              speakBangla(data.prompt)
            }
            style={styles.listenButton}
          >
            <Text>🔊</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.columnLabels}>
        <Text style={styles.columnLabel}>
          ছবি
        </Text>

        <Text style={styles.columnLabel}>
          শব্দ
        </Text>
      </View>

      <Animated.View
        style={[
          styles.columns,
          {
            transform: [
              { translateX: shakeX },
            ],
          },
        ]}
      >
        <View style={styles.column}>
          {data.pairs.map((pair, index) => {
            const isMatched =
              matched.includes(index);

            const isSelected =
              selectedPicture === index;

            return (
              <Pressable
                key={`picture-${index}`}
                disabled={isMatched}
                onPress={() =>
                  choosePicture(index)
                }
                style={({ pressed }) => [
                  styles.card,
                  isSelected &&
                    styles.selectedCard,
                  isMatched &&
                    styles.matchedCard,
                  pressed &&
                    !isMatched &&
                    styles.pressedCard,
                ]}
              >
                <View
                  style={[
                    styles.pictureCircle,
                    isMatched &&
                      styles.pictureCircleMatched,
                  ]}
                >
                  <Text style={styles.emoji}>
                    {pair.emoji || "⭐"}
                  </Text>
                </View>

                <Text style={styles.cardStatus}>
                  {isMatched
                    ? "✓ মিলেছে"
                    : isSelected
                      ? "নির্বাচিত"
                      : "ছবি"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.linkColumn}>
          {data.pairs.map((_, index) => (
            <View
              key={`link-${index}`}
              style={[
                styles.linkDot,
                matched.includes(index) &&
                  styles.linkDotMatched,
              ]}
            >
              <Text style={styles.linkText}>
                ↔
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.column}>
          {wordChoices.map(
            (choice, index) => {
              const isMatched =
                matched.includes(
                  choice.pairIndex,
                );

              const isSelected =
                selectedWord === index;

              return (
                <Pressable
                  key={`word-${choice.pairIndex}`}
                  disabled={isMatched}
                  onPress={() =>
                    chooseWord(index)
                  }
                  style={({ pressed }) => [
                    styles.card,
                    isSelected &&
                      styles.selectedCard,
                    isMatched &&
                      styles.matchedCard,
                    pressed &&
                      !isMatched &&
                      styles.pressedCard,
                  ]}
                >
                  <Text
                    style={[
                      styles.word,
                      isMatched &&
                        styles.wordMatched,
                    ]}
                  >
                    {choice.word}
                  </Text>

                  <Text
                    style={styles.cardStatus}
                  >
                    {isMatched
                      ? "✓ মিলেছে"
                      : isSelected
                        ? "নির্বাচিত"
                        : "শব্দ"}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      </Animated.View>

      <View
        style={[
          styles.feedbackCard,
          wrong && styles.feedbackWrong,
          matched.length ===
            data.pairs.length &&
            styles.feedbackSuccess,
        ]}
      >
        <Text style={styles.feedbackIcon}>
          {matched.length ===
          data.pairs.length
            ? "🏆"
            : wrong
              ? "🔄"
              : "💡"}
        </Text>

        <View style={styles.feedbackCopy}>
          <Text style={styles.feedbackLabel}>
            {matched.length ===
            data.pairs.length
              ? "MISSION CLEARED"
              : wrong
                ? "TRY AGAIN"
                : "HOW TO PLAY"}
          </Text>

          <Text style={styles.feedbackText}>
            {matched.length ===
            data.pairs.length
              ? "সবগুলো ছবি ও শব্দ সঠিকভাবে মিলেছে!"
              : wrong
                ? "মিল হয়নি। অন্য একটি শব্দ বেছে নাও।"
                : "প্রথমে একটি ছবি, তারপর সঠিক শব্দ বেছে নাও।"}
          </Text>
        </View>
      </View>
    </View>
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

  counterBadge: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#EEE8F8",
  },

  counterText: {
    fontSize: 11,
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
    paddingBottom: 15,
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

  promptCard: {
    width: "92%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
    padding: 13,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
  },

  promptIcon: {
    fontSize: 21,
  },

  promptCopy: {
    flex: 1,
    marginLeft: 10,
  },

  promptLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#968C9B",
  },

  promptText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
    color: "#2C2630",
  },

  listenButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#E6F4FF",
  },

  columnLabels: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },

  columnLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#817785",
  },

  columns: {
    width: "100%",
    flexDirection: "row",
    gap: 7,
    marginTop: 8,
  },

  column: {
    flex: 1,
    gap: 10,
  },

  linkColumn: {
    width: 30,
    justifyContent: "space-around",
  },

  linkDot: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  linkDotMatched: {
    borderRadius: 17,
    backgroundColor: "#D8F1DE",
  },

  linkText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#9C91A1",
  },

  card: {
    minHeight: 92,
    alignItems: "center",
    justifyContent: "center",
    padding: 9,
    borderWidth: 2,
    borderColor: "#E1D9E5",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  selectedCard: {
    borderColor: "#7653BD",
    backgroundColor: "#F2ECFF",
  },

  matchedCard: {
    borderColor: "#64BD79",
    backgroundColor: "#ECF9EF",
  },

  pressedCard: {
    transform: [{ scale: 0.97 }],
  },

  pictureCircle: {
    width: 55,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#FFF0C5",
  },

  pictureCircleMatched: {
    backgroundColor: "#D5F0DC",
  },

  emoji: {
    fontSize: 34,
  },

  word: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    textAlign: "center",
    color: "#342D38",
  },

  wordMatched: {
    color: "#326641",
  },

  cardStatus: {
    marginTop: 7,
    fontSize: 8,
    fontWeight: "900",
    color: "#8D828F",
  },

  feedbackCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 13,
    borderRadius: 20,
    backgroundColor: "#FFF4D1",
  },

  feedbackWrong: {
    backgroundColor: "#FFE3E3",
  },

  feedbackSuccess: {
    backgroundColor: "#E3F6E7",
  },

  feedbackIcon: {
    fontSize: 23,
  },

  feedbackCopy: {
    flex: 1,
    marginLeft: 10,
  },

  feedbackLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: "900",
    color: "#897A4B",
  },

  feedbackText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "800",
    color: "#5E5439",
  },
});
