import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import * as Speech from "../../../web/speech";

import MimiCharacter from "./MimiCharacter";

type TapItem = {
  id: string;
  emoji: string;
  label: string;
  description: string;
};

type Props = {
  activity: {
    payload: {
      prompt: string;
      items: TapItem[];
    };
  };
  onComplete: () => void;
};

function speakBangla(text: string) {
  void Speech.stop();

  Speech.speak(text, {
    language: "bn-BD",
    rate: 0.74,
    pitch: 1.04,
    volume: 1,
  });
}

export default function TapActivity({
  activity,
  onComplete,
}: Props) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 600;

  const data = activity.payload;
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const [done, setDone] = useState<string[]>([]);
  const [activeItem, setActiveItem] =
    useState<TapItem | null>(null);
  const [completed, setCompleted] =
    useState(false);

  const totalItems = data.items.length;
  const progress = useMemo(() => {
    if (totalItems === 0) {
      return 100;
    }

    return Math.round(
      (done.length / totalItems) * 100,
    );
  }, [done.length, totalItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      speakBangla(data.prompt);
    }, 350);

    if (
      totalItems === 0 &&
      !completedRef.current
    ) {
      completedRef.current = true;
      setCompleted(true);
      onCompleteRef.current();
    }

    return () => {
      clearTimeout(timer);
      void Speech.stop();
    };
  }, [data.prompt, totalItems]);

  const tapItem = (item: TapItem) => {
    setActiveItem(item);
    speakBangla(
      item.description || item.label,
    );

    if (done.includes(item.id)) {
      return;
    }

    const next = [...done, item.id];
    setDone(next);

    if (
      next.length === totalItems &&
      !completedRef.current
    ) {
      completedRef.current = true;
      setCompleted(true);

      setTimeout(() => {
        speakBangla(
          "দারুণ! তুমি সবগুলো জিনিস চিনতে পেরেছো।",
        );
      }, 450);

      onCompleteRef.current();
    }
  };

  const characterSize = isTablet
    ? 205
    : isSmallPhone
      ? 128
      : 155;

  return (
    <View style={styles.container}>
      <View style={styles.missionHeader}>
        <View style={styles.missionIcon}>
          <Text style={styles.missionIconText}>
            👆
          </Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>
            TAP QUEST
          </Text>
          <Text
            style={[
              styles.headerTitle,
              isTablet &&
                styles.headerTitleTablet,
            ]}
          >
            চাপ দিয়ে চিনি
          </Text>
        </View>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {done.length}/{totalItems}
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

      <View style={styles.guideCard}>
        <View style={styles.guideOrbOne} />
        <View style={styles.guideOrbTwo} />

        <View style={styles.mimiZone}>
          <MimiCharacter
            emotion={
              completed
                ? "celebrate"
                : "happy"
            }
            size={characterSize}
          />

          <View style={styles.guideBadge}>
            <Text style={styles.guideDot}>
              ●
            </Text>
            <Text style={styles.guideBadgeText}>
              MIMI GUIDE
            </Text>
          </View>
        </View>

        <View style={styles.promptCard}>
          <View style={styles.promptTop}>
            <View style={styles.promptIcon}>
              <Text style={styles.promptIconText}>
                🎯
              </Text>
            </View>

            <View style={styles.promptCopy}>
              <Text style={styles.promptLabel}>
                তোমার কাজ
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
              accessibilityLabel="নির্দেশনা আবার শুনি"
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
      </View>

      <View style={styles.gridHeader}>
        <View>
          <Text style={styles.gridEyebrow}>
            FIND THEM ALL
          </Text>
          <Text style={styles.gridTitle}>
            সব কার্ডে চাপ দাও
          </Text>
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>
            +{totalItems * 5} XP
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {data.items.map((item) => {
          const isDone = done.includes(item.id);
          const isActive =
            activeItem?.id === item.id;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} কার্ড`}
              onPress={() => tapItem(item)}
              style={({ pressed }) => [
                styles.card,
                isDone && styles.cardDone,
                isActive &&
                  styles.cardActive,
                pressed &&
                  styles.cardPressed,
              ]}
            >
              <View
                style={[
                  styles.emojiCircle,
                  isDone &&
                    styles.emojiCircleDone,
                ]}
              >
                <Text style={styles.emoji}>
                  {item.emoji || "⭐"}
                </Text>
              </View>

              <Text
                style={[
                  styles.label,
                  isDone && styles.labelDone,
                ]}
                numberOfLines={2}
              >
                {item.label}
              </Text>

              <View
                style={[
                  styles.statusPill,
                  isDone &&
                    styles.statusPillDone,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isDone &&
                      styles.statusTextDone,
                  ]}
                >
                  {isDone
                    ? "✓ পাওয়া গেছে"
                    : "চাপ দাও"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {activeItem ? (
        <View
          style={[
            styles.infoCard,
            completed &&
              styles.infoCardComplete,
          ]}
        >
          <View style={styles.infoIconCircle}>
            <Text style={styles.infoIcon}>
              {completed ? "🏆" : "💡"}
            </Text>
          </View>

          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>
              {completed
                ? "MISSION CLEARED"
                : activeItem.label}
            </Text>
            <Text style={styles.infoText}>
              {completed
                ? "সবগুলো কার্ড খুঁজে পেয়েছো!"
                : activeItem.description ||
                  activeItem.label}
            </Text>
          </View>

          <Text style={styles.infoStar}>
            {completed ? "⭐" : "🔊"}
          </Text>
        </View>
      ) : (
        <View style={styles.infoCard}>
          <View style={styles.infoIconCircle}>
            <Text style={styles.infoIcon}>
              💡
            </Text>
          </View>

          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>
              HINT
            </Text>
            <Text style={styles.infoText}>
              একটি কার্ডে চাপ দিলে মিমি সেটি
              বুঝিয়ে বলবে।
            </Text>
          </View>
        </View>
      )}
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
    marginTop: 11,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2DCE6",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  promptTop: {
    flexDirection: "row",
    alignItems: "center",
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
  gridHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  gridEyebrow: {
    fontSize: 8,
    letterSpacing: 1.15,
    fontWeight: "900",
    color: "#978B9D",
  },
  gridTitle: {
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
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  card: {
    minWidth: 135,
    flexGrow: 1,
    flexBasis: "45%",
    alignItems: "center",
    padding: 14,
    borderWidth: 2,
    borderColor: "#E5DEE8",
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
  },
  cardDone: {
    borderColor: "#66BE7B",
    backgroundColor: "#ECF9EF",
  },
  cardActive: {
    borderColor: "#7653BD",
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
  },
  emojiCircle: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFF0C4",
  },
  emojiCircleDone: {
    backgroundColor: "#D9F3DF",
  },
  emoji: {
    fontSize: 38,
  },
  label: {
    minHeight: 28,
    marginTop: 9,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    textAlign: "center",
    color: "#302A33",
  },
  labelDone: {
    color: "#2F6840",
  },
  statusPill: {
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#EEE8F8",
  },
  statusPillDone: {
    backgroundColor: "#CDEED5",
  },
  statusText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#665C6B",
  },
  statusTextDone: {
    color: "#326641",
  },
  infoCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 13,
    borderRadius: 20,
    backgroundColor: "#FFF6D9",
  },
  infoCardComplete: {
    backgroundColor: "#E6F7EA",
  },
  infoIconCircle: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  infoIcon: {
    fontSize: 20,
  },
  infoCopy: {
    flex: 1,
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 8,
    letterSpacing: 0.9,
    fontWeight: "900",
    color: "#8C7B4B",
  },
  infoText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "800",
    color: "#5E5439",
  },
  infoStar: {
    marginLeft: 8,
    fontSize: 21,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
