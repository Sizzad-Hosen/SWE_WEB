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
      lines: string[];
      buttonText?: string;
      character?: string;
      animation?: string;
    };
  };
  onComplete: () => void;
};

function speakBangla(
  text: string,
  onTalkingChange: (value: boolean) => void,
) {
  void Speech.stop();

  Speech.speak(text, {
    language: "bn-BD",
    rate: 0.74,
    pitch: 1.05,
    volume: 1,
    onStart: () => onTalkingChange(true),
    onDone: () => onTalkingChange(false),
    onStopped: () => onTalkingChange(false),
    onError: () => onTalkingChange(false),
  });
}

export default function AnimatedStoryActivity({
  activity,
  onComplete,
}: Props) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 600;

  const lines = useMemo(
    () =>
      activity.data.lines.filter(
        (line) => line.trim().length > 0,
      ),
    [activity.data.lines],
  );

  const [lineIndex, setLineIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cardEntrance = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  const currentLine = lines[lineIndex] ?? "";
  const isLastLine = lineIndex >= lines.length - 1;

  useEffect(() => {
    cardEntrance.setValue(0);

    const entranceAnimation = Animated.spring(cardEntrance, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    });

    entranceAnimation.start();

    let textIndex = 0;
    setVisibleText("");

    const typeTimer = setInterval(() => {
      textIndex += 1;
      setVisibleText(currentLine.slice(0, textIndex));

      if (textIndex >= currentLine.length) {
        clearInterval(typeTimer);
      }
    }, 34);

    const speechTimer = setTimeout(() => {
      if (currentLine) {
        speakBangla(currentLine, setIsTalking);
      }
    }, 260);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(speechTimer);
      entranceAnimation.stop();
      void Speech.stop();
    };
  }, [cardEntrance, currentLine, lineIndex]);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.035,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 720,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [buttonPulse]);

  const translateX = cardEntrance.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const opacity = cardEntrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const characterSize = isTablet
    ? 245
    : isSmallPhone
      ? 158
      : 195;

  const handleNext = () => {
    if (submitting) {
      return;
    }

    void Speech.stop();

    if (!isLastLine) {
      setLineIndex((current) => current + 1);
      return;
    }

    setSubmitting(true);

    Animated.sequence([
      Animated.timing(buttonPulse, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(buttonPulse, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  };

  if (lines.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyTitle}>
          গল্পের লেখা পাওয়া যায়নি
        </Text>
        <Pressable
          onPress={onComplete}
          style={styles.emptyButton}
        >
          <Text style={styles.emptyButtonText}>
            পরেরটি
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.missionHeader}>
        <View style={styles.storyBadge}>
          <Text style={styles.storyBadgeIcon}>📖</Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>
            STORY QUEST
          </Text>
          <Text
            style={[
              styles.headerTitle,
              isTablet && styles.headerTitleTablet,
            ]}
            numberOfLines={2}
          >
            {activity.title ?? "গল্প শুনি"}
          </Text>
        </View>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {lineIndex + 1}/{lines.length}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        {lines.map((_, index) => (
          <View
            key={`story-progress-${index}`}
            style={[
              styles.progressSegment,
              index <= lineIndex &&
                styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.stage}>
        <View style={styles.stageOrbOne} />
        <View style={styles.stageOrbTwo} />

        <View style={styles.characterZone}>
          <MimiCharacter
            emotion={isTalking ? "talking" : "happy"}
            size={characterSize}
          />

          <View style={styles.talkingBadge}>
            <Text style={styles.talkingDot}>●</Text>
            <Text style={styles.talkingText}>
              {isTalking
                ? "MIMI IS TALKING"
                : "MIMI GUIDE"}
            </Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.storyCard,
            {
              opacity,
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={styles.storyCardTop}>
            <View style={styles.questNumber}>
              <Text style={styles.questNumberText}>
                {lineIndex + 1}
              </Text>
            </View>

            <View style={styles.storyCardCopy}>
              <Text style={styles.storyCardLabel}>
                গল্পের অংশ
              </Text>
              <Text style={styles.storyCardHint}>
                মন দিয়ে শুনো
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="গল্পটি আবার শুনি"
              onPress={() =>
                speakBangla(currentLine, setIsTalking)
              }
              style={({ pressed }) => [
                styles.listenButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.listenIcon}>🔊</Text>
              {!isSmallPhone ? (
                <Text style={styles.listenText}>
                  শুনি
                </Text>
              ) : null}
            </Pressable>
          </View>

          <Text
            style={[
              styles.storyText,
              isTablet && styles.storyTextTablet,
            ]}
          >
            {visibleText}
            {visibleText.length < currentLine.length ? (
              <Text style={styles.cursor}>|</Text>
            ) : null}
          </Text>

          <View style={styles.tipBar}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              শুনে শুনে বাক্যটি বলার চেষ্টা করো
            </Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.actionWrap,
          { transform: [{ scale: buttonPulse }] },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            submitting && styles.nextButtonDisabled,
            pressed && !submitting && styles.nextButtonPressed,
          ]}
        >
          <View style={styles.nextIconCircle}>
            <Text style={styles.nextIcon}>
              {isLastLine ? "🏆" : "🚀"}
            </Text>
          </View>

          <View style={styles.nextCopy}>
            <Text style={styles.nextEyebrow}>
              {isLastLine
                ? "QUEST COMPLETE"
                : "NEXT STORY"}
            </Text>
            <Text style={styles.nextText}>
              {isLastLine
                ? activity.data.buttonText ??
                  "গল্প শেষ করি"
                : "পরের অংশ দেখি"}
            </Text>
          </View>

          <Text style={styles.nextArrow}>→</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.rewardHint}>
        <Text style={styles.rewardHintIcon}>⭐</Text>
        <Text style={styles.rewardHintText}>
          সব অংশ শেষ করলে mission progress বাড়বে
        </Text>
      </View>
    </View>
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
  storyBadge: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#7653BD",
  },
  storyBadgeIcon: {
    fontSize: 22,
  },
  headerCopy: {
    flex: 1,
    marginLeft: 11,
  },
  headerEyebrow: {
    fontSize: 8,
    letterSpacing: 1.35,
    fontWeight: "900",
    color: "#94899A",
  },
  headerTitle: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "900",
    color: "#29232D",
  },
  headerTitleTablet: {
    fontSize: 22,
  },
  counterBadge: {
    minWidth: 48,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#EEE7FA",
  },
  counterText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#7653BD",
  },
  progressRow: {
    width: "100%",
    flexDirection: "row",
    gap: 5,
    marginTop: 12,
  },
  progressSegment: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E5E0E8",
  },
  progressSegmentActive: {
    backgroundColor: "#7653BD",
  },
  stage: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    marginTop: 13,
    paddingTop: 10,
    paddingBottom: 16,
    borderRadius: 29,
    backgroundColor: "#E4DAFA",
  },
  stageOrbOne: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: "rgba(255,255,255,0.36)",
  },
  stageOrbTwo: {
    position: "absolute",
    left: -55,
    bottom: -75,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  characterZone: {
    alignItems: "center",
  },
  talkingBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(35,29,39,0.84)",
  },
  talkingDot: {
    marginRight: 5,
    fontSize: 8,
    color: "#70E36B",
  },
  talkingText: {
    fontSize: 8,
    letterSpacing: 0.9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  storyCard: {
    width: "92%",
    alignSelf: "center",
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2DCE6",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#776D7C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11,
    shadowRadius: 10,
    elevation: 4,
  },
  storyCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  questNumber: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#FFE4A1",
  },
  questNumberText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#7E5700",
  },
  storyCardCopy: {
    flex: 1,
    marginLeft: 10,
  },
  storyCardLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#4C4351",
  },
  storyCardHint: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: "#968D9B",
  },
  listenButton: {
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "#E7F4FF",
  },
  listenIcon: {
    fontSize: 15,
  },
  listenText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#277AA5",
  },
  storyText: {
    minHeight: 74,
    marginTop: 17,
    fontSize: 20,
    lineHeight: 31,
    fontWeight: "900",
    textAlign: "center",
    color: "#28232B",
  },
  storyTextTablet: {
    minHeight: 92,
    fontSize: 25,
    lineHeight: 38,
  },
  cursor: {
    color: "#7653BD",
  },
  tipBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    padding: 11,
    borderRadius: 16,
    backgroundColor: "#FFF6D9",
  },
  tipIcon: {
    marginRight: 7,
    fontSize: 17,
  },
  tipText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "800",
    color: "#66572E",
  },
  actionWrap: {
    width: "94%",
    marginTop: 16,
  },
  nextButton: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 32,
    backgroundColor: "#211C24",
    shadowColor: "#211C24",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 7,
  },
  nextButtonDisabled: {
    opacity: 0.65,
  },
  nextButtonPressed: {
    transform: [{ translateY: 3 }],
  },
  nextIconCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#C88AFF",
  },
  nextIcon: {
    fontSize: 20,
  },
  nextCopy: {
    flex: 1,
    marginLeft: 12,
  },
  nextEyebrow: {
    fontSize: 8,
    letterSpacing: 1.05,
    fontWeight: "900",
    color: "#B7AEBB",
  },
  nextText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  nextArrow: {
    marginRight: 15,
    fontSize: 23,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  rewardHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  rewardHintIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  rewardHintText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#887E8D",
  },
  emptyCard: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 36,
  },
  emptyEmoji: {
    fontSize: 42,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "900",
    color: "#302A33",
  },
  emptyButton: {
    marginTop: 17,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#211C24",
  },
  emptyButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
