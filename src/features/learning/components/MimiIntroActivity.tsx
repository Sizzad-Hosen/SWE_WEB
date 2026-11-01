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

import type { Activity } from "../data/curriculum";
import MimiCharacter from "./MimiCharacter";

type Props = {
  activity: Extract<Activity, { type: "intro" | "snippet" }>;
  onComplete: () => void;
};

function speakBangla(
  text: string,
  onTalkingChange: (value: boolean) => void,
) {
  void Speech.stop();

  Speech.speak(text, {
    language: "bn-BD",
    rate: 0.72,
    pitch: 1.08,
    volume: 1,
    onStart: () => onTalkingChange(true),
    onDone: () => onTalkingChange(false),
    onStopped: () => onTalkingChange(false),
    onError: () => onTalkingChange(false),
  });
}

export default function MimiIntroActivity({
  activity,
  onComplete,
}: Props) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 600;

  const cardEntrance = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  const [isTalking, setIsTalking] = useState(false);
  const [started, setStarted] = useState(false);

  const missionText = useMemo(() => {
    if (activity.type === "intro") {
      const body = activity.body.trim();

      return body
        ? body
        : `আজ আমরা ${activity.title} শিখবো। চলো শুরু করি।`;
    }

    return activity.lines
      .filter((line) => line.trim().length > 0)
      .join(" ");
  }, [activity]);

  const fullSpeech = useMemo(
    () => `হ্যালো বন্ধু! আমি মিমি। ${missionText}`,
    [missionText],
  );

  useEffect(() => {
    const entranceAnimation = Animated.spring(cardEntrance, {
      toValue: 1,
      friction: 7,
      tension: 55,
      useNativeDriver: true,
    });

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.045,
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

    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    entranceAnimation.start();
    pulseAnimation.start();
    sparkleAnimation.start();

    const speechTimer = setTimeout(() => {
      speakBangla(fullSpeech, setIsTalking);
    }, 650);

    return () => {
      clearTimeout(speechTimer);
      entranceAnimation.stop();
      pulseAnimation.stop();
      sparkleAnimation.stop();
      void Speech.stop();
    };
  }, [buttonPulse, cardEntrance, fullSpeech, sparkle]);

  const translateY = cardEntrance.interpolate({
    inputRange: [0, 1],
    outputRange: [36, 0],
  });

  const cardScale = cardEntrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const sparkleScale = sparkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.14],
  });

  const characterSize = isTablet
    ? 270
    : isSmallPhone
      ? 178
      : 215;

  const handleStart = () => {
    if (started) {
      return;
    }

    setStarted(true);
    void Speech.stop();

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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale: cardScale }],
        },
      ]}
    >
      <View style={styles.missionBar}>
        <View style={styles.missionIcon}>
          <Text style={styles.missionIconText}>🎮</Text>
        </View>

        <View style={styles.missionCopy}>
          <Text style={styles.missionEyebrow}>
            LEVEL 1 · NEW MISSION
          </Text>
          <Text
            style={[
              styles.missionTitle,
              isTablet && styles.missionTitleTablet,
            ]}
          >
            {activity.title}
          </Text>
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+10 XP</Text>
        </View>
      </View>

      <View style={styles.stage}>
        <View style={styles.stageOrbOne} />
        <View style={styles.stageOrbTwo} />

        <Animated.Text
          style={[
            styles.sparkleLeft,
            { transform: [{ scale: sparkleScale }] },
          ]}
        >
          ✦
        </Animated.Text>

        <Animated.Text
          style={[
            styles.sparkleRight,
            { transform: [{ scale: sparkleScale }] },
          ]}
        >
          ✦
        </Animated.Text>

        <View style={styles.characterWrap}>
          <View style={styles.characterGlow} />
          <MimiCharacter
            emotion={isTalking ? "talking" : "wave"}
            size={characterSize}
          />

          <View style={styles.guideBadge}>
            <Text style={styles.guideDot}>●</Text>
            <Text style={styles.guideText}>MIMI GUIDE</Text>
          </View>
        </View>
      </View>

      <View style={styles.dialogueCard}>
        <View style={styles.dialoguePointer} />

        <View style={styles.dialogueHeader}>
          <View>
            <Text style={styles.dialogueName}>মিমি বলছে</Text>
            <Text style={styles.dialogueStatus}>
              {isTalking ? "এখন কথা বলছে…" : "তোমার শেখার বন্ধু"}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="মিমির কথা আবার শুনি"
            onPress={() => speakBangla(fullSpeech, setIsTalking)}
            style={({ pressed }) => [
              styles.listenButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.listenIcon}>🔊</Text>
            {!isSmallPhone ? (
              <Text style={styles.listenText}>আবার শুনি</Text>
            ) : null}
          </Pressable>
        </View>

        <Text
          style={[
            styles.greeting,
            isTablet && styles.greetingTablet,
          ]}
        >
          হ্যালো বন্ধু! আমি মিমি 👋
        </Text>

        <Text
          style={[
            styles.body,
            isTablet && styles.bodyTablet,
          ]}
        >
          {missionText}
        </Text>

        <View style={styles.rewardPreview}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardEmoji}>⭐</Text>
            <Text style={styles.rewardLabel}>তারা জিতবে</Text>
          </View>

          <View style={styles.rewardDivider} />

          <View style={styles.rewardItem}>
            <Text style={styles.rewardEmoji}>🏆</Text>
            <Text style={styles.rewardLabel}>মিশন শেষ করবে</Text>
          </View>
        </View>
      </View>

      <Animated.View
        style={[
          styles.buttonShadow,
          { transform: [{ scale: buttonPulse }] },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="মিশন শুরু করি"
          disabled={started}
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,
            started && styles.startButtonDisabled,
            pressed && !started && styles.startButtonPressed,
          ]}
        >
          <View style={styles.playCircle}>
            <Text style={styles.playIcon}>▶</Text>
          </View>

          <View style={styles.startCopy}>
            <Text style={styles.startEyebrow}>READY?</Text>
            <Text style={styles.startText}>মিশন শুরু করি</Text>
          </View>

          <Text style={styles.startArrow}>→</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.stepDots}>
        <View style={[styles.stepDot, styles.stepDotActive]} />
        <View style={styles.stepDot} />
        <View style={styles.stepDot} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  missionBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#DED5F2",
    borderRadius: 22,
    backgroundColor: "#F7F3FF",
  },
  missionIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#7653BD",
  },
  missionIconText: {
    fontSize: 21,
  },
  missionCopy: {
    flex: 1,
    marginLeft: 11,
  },
  missionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: "900",
    color: "#8A7B9B",
  },
  missionTitle: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "900",
    color: "#251F2B",
  },
  missionTitleTablet: {
    fontSize: 22,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#FFE7A3",
  },
  xpText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#825B00",
  },
  stage: {
    position: "relative",
    width: "100%",
    minHeight: 245,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    marginTop: 12,
    borderRadius: 30,
    backgroundColor: "#D9CDF7",
  },
  stageOrbOne: {
    position: "absolute",
    top: -45,
    right: -35,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  stageOrbTwo: {
    position: "absolute",
    left: -38,
    bottom: -62,
    width: 175,
    height: 175,
    borderRadius: 88,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  sparkleLeft: {
    position: "absolute",
    top: 48,
    left: 31,
    fontSize: 28,
    color: "#FFFFFF",
  },
  sparkleRight: {
    position: "absolute",
    top: 29,
    right: 35,
    fontSize: 22,
    color: "#FFFFFF",
  },
  characterWrap: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  characterGlow: {
    position: "absolute",
    bottom: 27,
    width: 184,
    height: 72,
    borderRadius: 92,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  guideBadge: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
    backgroundColor: "rgba(31,25,36,0.82)",
  },
  guideDot: {
    marginRight: 5,
    fontSize: 8,
    color: "#6FE06A",
  },
  guideText: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  dialogueCard: {
    position: "relative",
    width: "94%",
    marginTop: -6,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E2DDE6",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    shadowColor: "#776E7C",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  dialoguePointer: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    width: 20,
    height: 20,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "#E2DDE6",
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  dialogueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dialogueName: {
    fontSize: 11,
    fontWeight: "900",
    color: "#7653BD",
  },
  dialogueStatus: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: "#92899A",
  },
  listenButton: {
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    borderRadius: 19,
    backgroundColor: "#E8F5FF",
  },
  listenIcon: {
    fontSize: 15,
  },
  listenText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#237AA8",
  },
  greeting: {
    marginTop: 15,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "900",
    textAlign: "center",
    color: "#28222C",
  },
  greetingTablet: {
    fontSize: 26,
    lineHeight: 34,
  },
  body: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700",
    textAlign: "center",
    color: "#5C5361",
  },
  bodyTablet: {
    fontSize: 18,
    lineHeight: 28,
  },
  rewardPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "#F8F5FA",
  },
  rewardItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardEmoji: {
    marginRight: 6,
    fontSize: 17,
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#665C6B",
  },
  rewardDivider: {
    width: 1,
    height: 23,
    backgroundColor: "#DDD6E1",
  },
  buttonShadow: {
    width: "94%",
    marginTop: 17,
  },
  startButton: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 32,
    backgroundColor: "#201B23",
    shadowColor: "#201B23",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.23,
    shadowRadius: 9,
    elevation: 7,
  },
  startButtonDisabled: {
    opacity: 0.65,
  },
  startButtonPressed: {
    transform: [{ translateY: 3 }],
  },
  playCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#C98BFF",
  },
  playIcon: {
    marginLeft: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  startCopy: {
    flex: 1,
    marginLeft: 12,
  },
  startEyebrow: {
    fontSize: 8,
    letterSpacing: 1.1,
    fontWeight: "900",
    color: "#B8AEBB",
  },
  startText: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  startArrow: {
    marginRight: 15,
    fontSize: 23,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  stepDots: {
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D7D0DB",
  },
  stepDotActive: {
    width: 22,
    backgroundColor: "#7653BD",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
