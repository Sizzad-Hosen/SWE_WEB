import React, {
  useEffect,
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

type Flashcard = {
  emoji: string;
  word: string;
};

type Props = {
  activity: {
    payload: {
      prompt: string;
      cards: Flashcard[];
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

export default function FlashcardActivity({
  activity,
  onComplete,
}: Props) {
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 600;

  const data = activity.payload;
  const cards = data.cards ?? [];

  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] =
    useState(false);
  const [seenIndices, setSeenIndices] =
    useState<number[]>([]);
  const [completed, setCompleted] =
    useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      speakBangla(data.prompt);
    }, 350);

    if (
      cards.length === 0 &&
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
  }, [cards.length, data.prompt]);

  const currentCard = cards[index];

  const allCardsSeen =
    cards.length > 0 &&
    seenIndices.length === cards.length;

  const progress = cards.length
    ? Math.round(
        (seenIndices.length / cards.length) *
          100,
      )
    : 100;

  const characterSize = isTablet
    ? 210
    : isSmallPhone
      ? 128
      : 155;

  const revealCard = () => {
    if (!currentCard) {
      return;
    }

    setRevealed(true);

    setSeenIndices((current) =>
      current.includes(index)
        ? current
        : [...current, index],
    );

    speakBangla(currentCard.word);
  };

  const goPrevious = () => {
    if (index <= 0) {
      return;
    }

    setIndex((current) => current - 1);
    setRevealed(false);
  };

  const goNext = () => {
    if (!revealed) {
      speakBangla(
        "আগে কার্ডে চাপ দিয়ে শব্দটি দেখো।",
      );
      return;
    }

    if (index < cards.length - 1) {
      setIndex((current) => current + 1);
      setRevealed(false);
      return;
    }

    if (!allCardsSeen) {
      setIndex(0);
      setRevealed(false);

      speakBangla(
        "যে কার্ডগুলো দেখা হয়নি সেগুলো আবার দেখো।",
      );

      return;
    }

    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    setCompleted(true);

    speakBangla(
      "দারুণ! তুমি সবগুলো শব্দ শিখেছো।",
    );

    onCompleteRef.current();
  };

  if (!currentCard) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>
          📭
        </Text>

        <Text style={styles.emptyText}>
          কোনো flashcard পাওয়া যায়নি
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>
            🃏
          </Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            MEMORY QUEST
          </Text>

          <Text
            style={[
              styles.title,
              isTablet && styles.titleTablet,
            ]}
          >
            শব্দের কার্ড
          </Text>
        </View>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {index + 1}/{cards.length}
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

      <View style={styles.stage}>
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />

        <MimiCharacter
          emotion={
            completed
              ? "celebrate"
              : revealed
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
            MEMORY COACH
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
              তোমার কাজ
            </Text>

            <Text style={styles.promptText}>
              {data.prompt}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              speakBangla(data.prompt)
            }
            style={({ pressed }) => [
              styles.listenButton,
              pressed && styles.pressed,
            ]}
          >
            <Text>🔊</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={revealCard}
        style={({ pressed }) => [
          styles.flashcard,
          revealed && styles.flashcardOpen,
          completed &&
            styles.flashcardCompleted,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardLabel}>
            {revealed
              ? "WORD UNLOCKED"
              : "MYSTERY CARD"}
          </Text>

          <Text style={styles.cardNumber}>
            #{index + 1}
          </Text>
        </View>

        <View style={styles.emojiCircle}>
          <Text
            style={[
              styles.emoji,
              isTablet && styles.emojiTablet,
            ]}
          >
            {currentCard.emoji || "⭐"}
          </Text>
        </View>

        <Text
          style={[
            styles.word,
            !revealed && styles.hiddenWord,
          ]}
        >
          {revealed
            ? currentCard.word
            : "কার্ডে চাপ দাও"}
        </Text>

        <View
          style={[
            styles.cardStatus,
            revealed &&
              styles.cardStatusOpen,
          ]}
        >
          <Text
            style={[
              styles.cardStatusText,
              revealed &&
                styles.cardStatusTextOpen,
            ]}
          >
            {revealed
              ? "🔊 আবার শুনতে চাপ দাও"
              : "✨ শব্দটি খুলি"}
          </Text>
        </View>
      </Pressable>

      <View style={styles.seenRow}>
        {cards.map((_, cardIndex) => {
          const seen =
            seenIndices.includes(cardIndex);

          return (
            <View
              key={`flash-dot-${cardIndex}`}
              style={[
                styles.seenDot,
                seen && styles.seenDotDone,
                cardIndex === index &&
                  styles.seenDotCurrent,
              ]}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable
          disabled={index === 0}
          onPress={goPrevious}
          style={({ pressed }) => [
            styles.backButton,
            index === 0 &&
              styles.disabledButton,
            pressed &&
              index > 0 &&
              styles.pressed,
          ]}
        >
          <Text style={styles.backIcon}>
            ‹
          </Text>

          <Text style={styles.backText}>
            আগের কার্ড
          </Text>
        </Pressable>

        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            styles.nextButton,
            completed &&
              styles.completedButton,
            pressed && styles.nextPressed,
          ]}
        >
          <View style={styles.nextIconCircle}>
            <Text style={styles.nextIcon}>
              {completed
                ? "✓"
                : index === cards.length - 1
                  ? "🏆"
                  : "→"}
            </Text>
          </View>

          <View style={styles.nextCopy}>
            <Text style={styles.nextEyebrow}>
              {completed
                ? "MISSION CLEARED"
                : allCardsSeen &&
                    index ===
                      cards.length - 1
                  ? "FINAL STEP"
                  : "NEXT CARD"}
            </Text>

            <Text style={styles.nextText}>
              {completed
                ? "সব শব্দ শেখা হয়েছে"
                : index ===
                    cards.length - 1
                  ? "মিশন শেষ করি"
                  : "পরের কার্ড"}
            </Text>
          </View>
        </Pressable>
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

  flashcard: {
    width: "94%",
    alignItems: "center",
    marginTop: 16,
    padding: 17,
    borderWidth: 2,
    borderColor: "#D9CDE8",
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },

  flashcardOpen: {
    borderColor: "#7653BD",
    backgroundColor: "#F8F4FF",
  },

  flashcardCompleted: {
    borderColor: "#63BD78",
    backgroundColor: "#F0FAF2",
  },

  cardPressed: {
    transform: [{ scale: 0.98 }],
  },

  cardTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cardLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#8F8395",
  },

  cardNumber: {
    fontSize: 9,
    fontWeight: "900",
    color: "#7653BD",
  },

  emojiCircle: {
    width: 125,
    height: 125,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
    borderRadius: 40,
    backgroundColor: "#FFF0C5",
  },

  emoji: {
    fontSize: 70,
  },

  emojiTablet: {
    fontSize: 86,
  },

  word: {
    marginTop: 15,
    fontSize: 27,
    fontWeight: "900",
    color: "#342D38",
  },

  hiddenWord: {
    fontSize: 17,
    color: "#776C7C",
  },

  cardStatus: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "#EEE8F8",
  },

  cardStatusOpen: {
    backgroundColor: "#DCD0F4",
  },

  cardStatusText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#7653BD",
  },

  cardStatusTextOpen: {
    color: "#5D3D98",
  },

  seenRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
  },

  seenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D8D0DC",
  },

  seenDotDone: {
    backgroundColor: "#73C584",
  },

  seenDotCurrent: {
    width: 22,
    backgroundColor: "#7653BD",
  },

  actions: {
    width: "94%",
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
  },

  backButton: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderRadius: 30,
    backgroundColor: "#EEE8F3",
  },

  disabledButton: {
    opacity: 0.4,
  },

  backIcon: {
    fontSize: 24,
    fontWeight: "900",
    color: "#665C6B",
  },

  backText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: "900",
    color: "#665C6B",
  },

  nextButton: {
    flex: 1,
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    borderRadius: 30,
    backgroundColor: "#211C24",
  },

  completedButton: {
    backgroundColor: "#28653A",
  },

  nextPressed: {
    transform: [{ translateY: 3 }],
  },

  nextIconCircle: {
    width: 47,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#C98AFF",
  },

  nextIcon: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  nextCopy: {
    flex: 1,
    marginLeft: 10,
  },

  nextEyebrow: {
    fontSize: 7,
    fontWeight: "900",
    color: "#B9AFBC",
  },

  nextText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  emptyCard: {
    alignItems: "center",
    padding: 30,
  },

  emptyEmoji: {
    fontSize: 40,
  },

  emptyText: {
    marginTop: 10,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
