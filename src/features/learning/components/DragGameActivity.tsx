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

type DragItem = {
  emoji: string;
  target: string;
};

type Props = {
  activity: {
    payload: {
      prompt: string;
      items: DragItem[];
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

export default function DragGameActivity({
  activity,
  onComplete,
}: Props) {
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 600;

  const data = activity.payload;

  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  const entrance = useRef(
    new Animated.Value(0),
  ).current;

  const itemPulse = useRef(
    new Animated.Value(1),
  ).current;

  const [doneIndices, setDoneIndices] =
    useState<number[]>([]);

  const [activeIndex, setActiveIndex] =
    useState<number | null>(null);

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

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(itemPulse, {
          toValue: 1.035,
          duration: 800,
          useNativeDriver: true,
        }),

        Animated.timing(itemPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    entranceAnimation.start();
    pulseAnimation.start();

    const timer = setTimeout(() => {
      speakBangla(data.prompt);
    }, 350);

    if (
      data.items.length === 0 &&
      !completedRef.current
    ) {
      completedRef.current = true;
      setCompleted(true);
      onCompleteRef.current();
    }

    return () => {
      clearTimeout(timer);
      entranceAnimation.stop();
      pulseAnimation.stop();
      void Speech.stop();
    };
  }, [
    data.items.length,
    data.prompt,
    entrance,
    itemPulse,
  ]);

  const opacity = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const progress = data.items.length
    ? Math.round(
        (doneIndices.length /
          data.items.length) *
          100,
      )
    : 100;

  const characterSize = isTablet
    ? 210
    : isSmallPhone
      ? 128
      : 155;

  const completeItem = (
    item: DragItem,
    index: number,
  ) => {
    if (doneIndices.includes(index)) {
      speakBangla(
        `${item.target} ইতোমধ্যে সম্পন্ন হয়েছে।`,
      );

      return;
    }

    setActiveIndex(index);

    const nextDoneIndices = [
      ...doneIndices,
      index,
    ];

    setDoneIndices(nextDoneIndices);

    speakBangla(
      `${item.emoji} ${item.target} এ পৌঁছে গেছে।`,
    );

    if (
      nextDoneIndices.length ===
        data.items.length &&
      !completedRef.current
    ) {
      completedRef.current = true;
      setCompleted(true);

      setTimeout(() => {
        speakBangla(
          "দারুণ! সবগুলো জিনিস সঠিক জায়গায় পৌঁছে গেছে।",
        );
      }, 300);

      onCompleteRef.current();
    }
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
            🎮
          </Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            MOVE MISSION
          </Text>

          <Text
            style={[
              styles.title,
              isTablet && styles.titleTablet,
            ]}
          >
            সঠিক জায়গায় পৌঁছে দাও
          </Text>
        </View>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {doneIndices.length}/
            {data.items.length}
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
            completed
              ? "celebrate"
              : activeIndex !== null
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
            MOVE COACH
          </Text>
        </View>

        <View style={styles.promptCard}>
          <View style={styles.promptIcon}>
            <Text style={styles.promptEmoji}>
              🎯
            </Text>
          </View>

          <View style={styles.promptCopy}>
            <Text style={styles.promptLabel}>
              তোমার mission
            </Text>

            <Text style={styles.promptText}>
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

      <View style={styles.missionHeader}>
        <View>
          <Text style={styles.eyebrow}>
            TAP TO MOVE
          </Text>

          <Text style={styles.missionTitle}>
            প্রতিটি item পৌঁছে দাও
          </Text>
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>
            +{data.items.length * 5} XP
          </Text>
        </View>
      </View>

      <View style={styles.itemList}>
        {data.items.map((item, index) => {
          const isDone =
            doneIndices.includes(index);

          const isActive =
            activeIndex === index;

          return (
            <Animated.View
              key={`${item.target}-${index}`}
              style={{
                width: "100%",
                transform: [
                  {
                    scale:
                      !isDone &&
                      activeIndex === null
                        ? itemPulse
                        : 1,
                  },
                ],
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.emoji} ${item.target} এ পৌঁছে দাও`}
                onPress={() =>
                  completeItem(item, index)
                }
                style={({ pressed }) => [
                  styles.itemCard,

                  isActive &&
                    !isDone &&
                    styles.itemCardActive,

                  isDone &&
                    styles.itemCardDone,

                  pressed &&
                    !isDone &&
                    styles.itemPressed,
                ]}
              >
                <View
                  style={[
                    styles.emojiCircle,

                    isDone &&
                      styles.emojiCircleDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.itemEmoji,
                      isTablet &&
                        styles.itemEmojiTablet,
                    ]}
                  >
                    {item.emoji || "⭐"}
                  </Text>
                </View>

                <View style={styles.routeArea}>
                  <View
                    style={[
                      styles.routeLine,
                      isDone &&
                        styles.routeLineDone,
                    ]}
                  />

                  <View
                    style={[
                      styles.routeArrowCircle,
                      isDone &&
                        styles.routeArrowDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.routeArrow,
                        isDone &&
                          styles.routeArrowTextDone,
                      ]}
                    >
                      {isDone ? "✓" : "→"}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.targetCard,

                    isDone &&
                      styles.targetCardDone,
                  ]}
                >
                  <Text style={styles.targetLabel}>
                    DESTINATION
                  </Text>

                  <Text
                    style={[
                      styles.targetText,
                      isDone &&
                        styles.targetTextDone,
                    ]}
                    numberOfLines={2}
                  >
                    {item.target}
                  </Text>

                  <Text
                    style={[
                      styles.targetStatus,

                      isDone &&
                        styles.targetStatusDone,
                    ]}
                  >
                    {isDone
                      ? "✓ পৌঁছে গেছে"
                      : "চাপ দিয়ে পাঠাও"}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {completed ? (
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>
              🏆
            </Text>
          </View>

          <View style={styles.successCopy}>
            <Text style={styles.successLabel}>
              MISSION CLEARED
            </Text>

            <Text style={styles.successTitle}>
              সবগুলো পৌঁছে গেছে!
            </Text>

            <Text style={styles.successText}>
              তুমি move mission সম্পন্ন করেছো
            </Text>
          </View>

          <Text style={styles.successXp}>
            +{data.items.length * 5} XP
          </Text>
        </View>
      ) : (
        <View style={styles.hintCard}>
          <View style={styles.hintIcon}>
            <Text style={styles.hintEmoji}>
              💡
            </Text>
          </View>

          <View style={styles.hintCopy}>
            <Text style={styles.hintLabel}>
              HOW TO PLAY
            </Text>

            <Text style={styles.hintText}>
              একটি item-এ চাপ দিলে সেটি target
              জায়গায় পৌঁছে যাবে।
            </Text>
          </View>
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFF0C5",
  },

  promptEmoji: {
    fontSize: 19,
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

  listenIcon: {
    fontSize: 16,
  },

  missionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },

  missionTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#2C2630",
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

  itemList: {
    width: "100%",
    marginTop: 11,
    gap: 10,
  },

  itemCard: {
    width: "100%",
    minHeight: 105,
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    borderWidth: 2,
    borderColor: "#E3DCE6",
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
  },

  itemCardActive: {
    borderColor: "#7653BD",
  },

  itemCardDone: {
    borderColor: "#63BD78",
    backgroundColor: "#ECF9EF",
  },

  itemPressed: {
    transform: [{ translateY: 3 }],
  },

  emojiCircle: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#FFF0C5",
  },

  emojiCircleDone: {
    backgroundColor: "#D1EFD8",
  },

  itemEmoji: {
    fontSize: 40,
  },

  itemEmojiTablet: {
    fontSize: 49,
  },

  routeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },

  routeLine: {
    position: "absolute",
    width: "100%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "#D8CEDD",
  },

  routeLineDone: {
    backgroundColor: "#79C78A",
  },

  routeArrowCircle: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#EEE8F8",
  },

  routeArrowDone: {
    backgroundColor: "#C9EBCF",
  },

  routeArrow: {
    fontSize: 19,
    fontWeight: "900",
    color: "#7653BD",
  },

  routeArrowTextDone: {
    color: "#326641",
  },

  targetCard: {
    width: 120,
    minHeight: 76,
    justifyContent: "center",
    padding: 10,
    borderRadius: 18,
    backgroundColor: "#F5F1F7",
  },

  targetCardDone: {
    backgroundColor: "#DDF3E2",
  },

  targetLabel: {
    fontSize: 7,
    letterSpacing: 0.8,
    fontWeight: "900",
    color: "#978C9B",
  },

  targetText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
    color: "#342D38",
  },

  targetTextDone: {
    color: "#326641",
  },

  targetStatus: {
    marginTop: 5,
    fontSize: 7,
    fontWeight: "900",
    color: "#8A7F8E",
  },

  targetStatusDone: {
    color: "#4D8059",
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

  successXp: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2D6A3C",
  },

  hintCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
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

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
