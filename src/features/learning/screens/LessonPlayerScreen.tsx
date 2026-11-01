import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import { SafeAreaView } from "../../../web/safe-area";
import * as Speech from "../../../web/speech";

import type { ScreenProps } from "../../../navigation/routes";
import { isSupabaseConfigured } from "../../../config/supabase";
import { useGamificationStore } from "../../gamification/store/gamificationStore";
import { useStudentStore } from "../../student/store/studentStore";
import { type Activity } from "../data/curriculum";
import { useCurriculumChapter } from "../hooks/useCurriculumChapter";
import { progressService } from "../services/progressService";
import { useLessonSessionStore } from "../store/lessonSessionStore";

import AudioStoryActivity from "../components/AudioStoryActivity";
import LetterActivity from "../components/LetterActivity";
import WordBuildActivity from "../components/WordBuildActivity";
import PictureChoiceActivity from "../components/PictureChoiceActivity";
import DragGameActivity from "../components/DragGameActivity";
import FlashcardActivity from "../components/FlashcardActivity";
import MatchingActivity from "../components/MatchingActivity";
import TapCards from "../components/TapActivity";
import VoiceActivity from "../components/VoiceActivity";
import { ImageLessonActivity } from "../components/ImageLessonActivity";
import { VideoActivity } from "../components/VideoActivity";
import MimiIntroActivity from "../components/MimiIntroActivity";
import AnimatedStoryActivity from "../components/AnimatedStoryActivity";
import QuizBattleActivity from "../components/QuizBattleActivity";

async function speakBangla(text: string) {
  await Speech.stop();

  Speech.speak(text, {
    language: "bn-BD",
    rate: 0.78,
    pitch: 1.03,
  });
}

function needsCompletion(activity: Activity) {
  return [
    "intro",
    "snippet",
    "letter",
    "image_lesson",
    "video",
    "word_build",
    "tap",
    "flashcard",
    "voice",
    "matching",
    "picture_choice",
    "drag_game",
    "choice",
    "quiz",
  ].includes(activity.type);
}

function calculateQuizScore(
  activities: Activity[],
  attemptsByActivity: Record<string, number>,
) {
  const quizzes = activities.filter(
    (activity) =>
      activity.type === "quiz" ||
      activity.type === "choice",
  );

  if (!quizzes.length) {
    return 100;
  }

  const total = quizzes.reduce((sum, quiz) => {
    const attempts = Math.max(
      1,
      attemptsByActivity[quiz.id] ?? 1,
    );

    return (
      sum +
      Math.max(40, 100 - (attempts - 1) * 20)
    );
  }, 0);

  return Math.round(total / quizzes.length);
}

function getActivityMeta(activity: Activity) {
  switch (activity.type) {
    case "intro":
      return {
        icon: "👋",
        label: "শুরু করি",
        instruction: activity.title,
      };

    case "snippet":
      return {
        icon: "📖",
        label: "গল্প",
        instruction: activity.title,
      };

    case "audio_story":
      return {
        icon: "🎧",
        label: "শুনে শিখি",
        instruction: activity.text,
      };

    case "image_lesson":
      return {
        icon: "🖼️",
        label: "ছবি দেখে শিখি",
        instruction: activity.instruction,
      };

    case "video":
      return {
        icon: "▶️",
        label: "ভিডিও",
        instruction: activity.title,
      };

    case "letter":
      return {
        icon: "🔤",
        label: "অক্ষর",
        instruction: `${activity.letter}। ${activity.sound}`,
      };

    case "word_build":
      return {
        icon: "🧩",
        label: "শব্দ বানাই",
        instruction: activity.prompt,
      };

    case "tap":
      return {
        icon: "👆",
        label: "চাপ দিয়ে শিখি",
        instruction: activity.prompt,
      };

    case "flashcard":
      return {
        icon: "🃏",
        label: "কার্ড",
        instruction: activity.prompt,
      };

    case "voice":
      return {
        icon: "🎤",
        label: "বলে শিখি",
        instruction: activity.prompt,
      };

    case "matching":
      return {
        icon: "🔗",
        label: "মিল খুঁজি",
        instruction: activity.prompt,
      };

    case "picture_choice":
      return {
        icon: "🔍",
        label: "ছবি চিনি",
        instruction: activity.question,
      };

    case "drag_game":
      return {
        icon: "🎯",
        label: "খেলা",
        instruction: activity.prompt,
      };

    case "choice":
      return {
        icon: "❓",
        label: "প্রশ্ন",
        instruction: activity.prompt,
      };

    case "quiz":
      return {
        icon: "🏆",
        label: "কুইজ",
        instruction: activity.question,
      };

    default:
      return {
        icon: "⭐",
        label: "শেখার কাজ",
        instruction: "চলো কাজটি শেষ করি।",
      };
  }
}

export default function LessonPlayerScreen({
  navigation,
  route,
}: ScreenProps<"Lesson">) {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortScreen = height < 760;
  const isTablet = width >= 600;

  const maxWidth = isTablet ? 820 : 620;
  const horizontalPadding = isSmallPhone
    ? 10
    : isTablet
      ? 28
      : 14;
  const activityPadding = isSmallPhone
    ? 12
    : isTablet
      ? 24
      : 16;

  const chapterId = route.params.chapterId;

  const {
    chapter,
    loading,
    error,
    retry,
  } = useCurriculumChapter(chapterId);

  const completeChapter = useGamificationStore(
    (state) => state.completeChapter,
  );
  const addBadge = useGamificationStore(
    (state) => state.addBadge,
  );
  const student = useStudentStore(
    (state) => state.student,
  );

  const session = useLessonSessionStore(
    (state) => state.sessions[chapterId],
  );
  const startOrResume = useLessonSessionStore(
    (state) => state.startOrResume,
  );
  const saveStep = useLessonSessionStore(
    (state) => state.setStep,
  );
  const markActivityComplete =
    useLessonSessionStore(
      (state) => state.markActivityComplete,
    );
  const recordAttempt = useLessonSessionStore(
    (state) => state.recordAttempt,
  );
  const clearSession = useLessonSessionStore(
    (state) => state.clearSession,
  );

  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState({
    score: 100,
    points: 30,
    stars: 3,
  });

  useEffect(() => {
    if (!chapter) {
      return;
    }

    const restored = startOrResume(chapterId);
    const safeStep = Math.min(
      restored.step,
      Math.max(0, chapter.activities.length - 1),
    );

    setStep(safeStep);
    setFinished(false);
  }, [chapter, chapterId, startOrResume]);

  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  const activity = chapter?.activities[step];
  const completedActivityIds =
    session?.completedActivityIds ?? [];
  const attemptsByActivity =
    session?.attemptsByActivity ?? {};

  const activityComplete = activity
    ? !needsCompletion(activity) ||
      completedActivityIds.includes(activity.id)
    : false;

  const progress = chapter?.activities.length
    ? ((step + (activityComplete ? 1 : 0)) /
        chapter.activities.length) *
      100
    : 0;

  const activityMeta = useMemo(
    () =>
      activity
        ? getActivityMeta(activity)
        : {
            icon: "⭐",
            label: "শেখার কাজ",
            instruction: "",
          },
    [activity],
  );

  const moveToStep = (nextStep: number) => {
    setStep(nextStep);
    saveStep(chapterId, nextStep);
    void Speech.stop();
  };

  const finishChapter = async () => {
    if (!chapter) {
      return;
    }

    const score = calculateQuizScore(
      chapter.activities,
      attemptsByActivity,
    );
    const stars =
      score >= 90 ? 3 : score >= 70 ? 2 : 1;
    const points =
      stars === 3 ? 30 : stars === 2 ? 20 : 10;

    completeChapter({
      chapterId: chapter.id,
      nextChapterId: chapter.nextChapterId,
      starsEarned: stars,
      quizScore: score,
    });

    if (chapter.title === "আমার পরিচয়") {
      addBadge("identity_expert");
    }

    if (
      student &&
      isSupabaseConfigured &&
      !student.id.startsWith("local-")
    ) {
      try {
        await progressService.completeChapter(
          student.id,
          chapter.id,
        );
      
      } catch (syncError) {
  const message =
    syncError instanceof Error
      ? syncError.message
      : String(syncError);

  console.error(
    "Cloud progress save failed:",
    message,
  );

  Alert.alert(
    "Cloud progress save হয়নি",
    message,
  );

  return;
}
      
    }

    setResult({
      score,
      points,
      stars,
    });
    setFinished(true);
    clearSession(chapterId);

    void speakBangla(
      `দারুণ করেছ! তুমি ${stars}টি তারা পেয়েছ।`,
    );
  };

  const next = async () => {
    if (!chapter || !activity) {
      return;
    }

    if (!activityComplete) {
      Alert.alert(
        "কাজটি শেষ করো",
        "এই শেখার কাজটি শেষ করলে পরের ধাপে যেতে পারবে।",
      );
      return;
    }

    if (step < chapter.activities.length - 1) {
      moveToStep(step + 1);
      return;
    }

    await finishChapter();
  };

  const goBack = () => {
    if (step > 0) {
      moveToStep(step - 1);
      return;
    }

    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator
              size="large"
              color="#7653BD"
            />
          </View>
          <Text style={styles.centerTitle}>
            পাঠ লোড হচ্ছে...
          </Text>
          <Text style={styles.centerHelper}>
            একটু অপেক্ষা করো বন্ধু
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerEmoji}>⚠️</Text>
          <Text style={styles.centerTitle}>
            পাঠটি লোড করা যায়নি
          </Text>
          <Text style={styles.centerHelper}>
            {error}
          </Text>

          <Pressable
            onPress={retry}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              আবার চেষ্টা করি
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!chapter || !activity) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerEmoji}>📭</Text>
          <Text style={styles.centerTitle}>
            কোনো activity পাওয়া যায়নি
          </Text>

          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Chapter list-এ ফিরি
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.rewardScroll,
            {
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <View
            style={[
              styles.rewardCard,
              {
                maxWidth,
                padding: isTablet ? 34 : 22,
              },
            ]}
          >
            <View style={styles.rewardOrbOne} />
            <View style={styles.rewardOrbTwo} />

            <Text style={styles.rewardConfetti}>
              ✦ 🎉 ✦
            </Text>

            <View
              style={[
                styles.rewardGuideCircle,
                {
                  width: isTablet ? 245 : 190,
                  height: isTablet ? 245 : 190,
                  borderRadius: isTablet ? 123 : 95,
                },
              ]}
            >
              <Image
                source={'/characters/mimi/waving.png'}
                style={styles.rewardGuide}
                resizeMode="contain"
              />
            </View>

            <Text
              style={[
                styles.rewardTitle,
                isTablet && styles.rewardTitleTablet,
              ]}
            >
              দারুণ করেছ!
            </Text>

            <Text style={styles.rewardSubtitle}>
              তুমি এই পাঠটি শেষ করেছ
            </Text>

            <Text
              style={[
                styles.rewardStars,
                isTablet && styles.rewardStarsTablet,
              ]}
            >
              {"⭐".repeat(result.stars)}
            </Text>

            <View style={styles.resultRow}>
              <View style={styles.resultBox}>
                <Text style={styles.resultIcon}>🏆</Text>
                <Text style={styles.resultValue}>
                  {result.score}%
                </Text>
                <Text style={styles.resultLabel}>
                  Quiz score
                </Text>
              </View>

              <View style={styles.resultBox}>
                <Text style={styles.resultIcon}>✨</Text>
                <Text style={styles.resultValue}>
                  +{result.points}
                </Text>
                <Text style={styles.resultLabel}>
                  Points
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.rewardButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.rewardButtonIcon}>
                📚
              </Text>
              <Text style={styles.rewardButtonText}>
                Chapter list-এ ফিরি
              </Text>
              <Text style={styles.rewardButtonArrow}>
                ›
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View
          style={[
            styles.topShell,
            {
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <View
            style={[
              styles.topInner,
              { maxWidth },
            ]}
          >
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="পাঠ থেকে বের হই"
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>

              <View style={styles.headerCopy}>
                <Text
                  style={styles.chapterTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {chapter.title}
                </Text>
                <Text style={styles.stepText}>
                  ধাপ {step + 1} /{" "}
                  {chapter.activities.length}
                </Text>
              </View>

              <View
                style={[
                  styles.completionBadge,
                  activityComplete
                    ? styles.completionBadgeDone
                    : styles.completionBadgeTodo,
                ]}
              >
                <Text
                  style={[
                    styles.completionBadgeText,
                    activityComplete
                      ? styles.completionTextDone
                      : styles.completionTextTodo,
                  ]}
                >
                  {activityComplete
                    ? "✓ সম্পন্ন"
                    : "কাজ চলছে"}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      progress,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.activityScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.activityScrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: isShortScreen ? 16 : 24,
            },
          ]}
        >
          <View
            style={[
              styles.activityShell,
              {
                maxWidth,
                padding: activityPadding,
                minHeight: isTablet
                  ? 560
                  : isShortScreen
                    ? 390
                    : 470,
              },
            ]}
          >
            <View style={styles.activityHeader}>
              <View style={styles.activityMeta}>
                <View style={styles.activityIconCircle}>
                  <Text style={styles.activityIcon}>
                    {activityMeta.icon}
                  </Text>
                </View>

                <View>
                  <Text style={styles.activityEyebrow}>
                    ACTIVITY
                  </Text>
                  <Text style={styles.activityLabel}>
                    {activityMeta.label}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="নির্দেশনা শুনি"
                onPress={() =>
                  void speakBangla(
                    activityMeta.instruction,
                  )
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

            <View style={styles.activityDivider} />

            <View style={styles.rendererWrap}>
              <ActivityRenderer
                key={activity.id}
                activity={activity}
                attempts={
                  attemptsByActivity[activity.id] ?? 0
                }
                completed={completedActivityIds.includes(
                  activity.id,
                )}
                onAttempt={(correct) => {
                  recordAttempt(
                    chapterId,
                    activity.id,
                  );

                  if (correct) {
                    markActivityComplete(
                      chapterId,
                      activity.id,
                    );
                  }
                }}
                onComplete={() => {
                  markActivityComplete(
                    chapterId,
                    activity.id,
                  );
                }}
              />
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.actionShell,
            {
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <View
            style={[
              styles.actions,
              { maxWidth },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={goBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backButtonIcon}>‹</Text>
              <Text style={styles.backButtonText}>
                আগে
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: !activityComplete,
              }}
              onPress={() => void next()}
              style={({ pressed }) => [
                styles.nextButton,
                !activityComplete &&
                  styles.nextButtonDisabled,
                pressed &&
                  activityComplete &&
                  styles.nextButtonPressed,
              ]}
            >
              <Text style={styles.nextButtonText}>
                {step ===
                chapter.activities.length - 1
                  ? "শেষ করি"
                  : "পরেরটি"}
              </Text>

              <View style={styles.nextArrowCircle}>
                <Text style={styles.nextArrow}>
                  {step ===
                  chapter.activities.length - 1
                    ? "✓"
                    : "→"}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ActivityRenderer({
  activity,
  attempts,
  completed,
  onAttempt,
  onComplete,
}: {
  activity: Activity;
  attempts: number;
  completed: boolean;
  onAttempt: (correct: boolean) => void;
  onComplete: () => void;
}) {
  switch (activity.type) {
    case "intro":
      return (
        <MimiIntroActivity
          activity={activity}
          onComplete={onComplete}
        />
      );

    case "snippet":
      return (
        <AnimatedStoryActivity
          activity={{
            title: activity.title,
            data: {
              lines: activity.lines,
              buttonText: "পরেরটি 🚀",
            },
          }}
          onComplete={onComplete}
        />
      );

    case "audio_story":
      return (
        <AudioStoryActivity
          activity={{
            payload: {
              title: activity.title,
              text: activity.text,
              audio: activity.audio,
            },
          }}
        />
      );

    case "image_lesson":
      return (
        <ImageLessonActivity
          activity={{
            title: activity.title,
            instruction: activity.instruction,
            data: {
              image: activity.imageUrl,
              description: activity.instruction,
              sourceLabel: activity.sourceLabel,
            },
          }}
          completed={completed}
          onComplete={onComplete}
        />
      );

    case "video":
      return (
        <VideoActivity
          title={activity.title}
          url={activity.url}
          completed={completed}
          onComplete={onComplete}
        />
      );

    case "letter":
      return (
        <LetterActivity
          activity={{
            title: "অক্ষর শিখি",
            data: {
              letter: activity.letter,
              sound: activity.sound,
              examples: activity.examples,
            },
          }}
          onComplete={onComplete}
        />
      );

    case "word_build":
      return (
        <WordBuildActivity
          activity={{
            title: "শব্দ বানাই",
            data: {
              prompt: activity.prompt,
              letters: activity.letters,
              answer: activity.answer,
            },
          }}
          onComplete={onComplete}
        />
      );

    case "tap":
      return (
        <TapCards
          activity={{
            payload: {
              prompt: activity.prompt,
              items: activity.items,
            },
          }}
          onComplete={onComplete}
        />
      );

    case "flashcard":
  return (
    <FlashcardActivity
      activity={{
        payload: {
          prompt: activity.prompt,
          cards: activity.cards,
        },
      }}
      onComplete={onComplete}
    />
  ); 

    case "voice":
      return (
        <VoiceActivity
          activity={{
            payload: {
              prompt: activity.prompt,
              word: activity.word,
              emoji: activity.emoji,
            },
          }}
          onComplete={onComplete}
        />
      );

    case "matching":
      return (
        <MatchingActivity
          activity={{
            payload: {
              prompt: activity.prompt,
              pairs: activity.pairs,
            },
          }}
          onComplete={onComplete}
        />
      );

    case "picture_choice":
      return (
        <PictureChoiceActivity
          activity={{
            title: "ছবি চিনে নেই",
            data: {
              question: activity.question,
              options: activity.options,
              answer: activity.answer,
            },
          }}
          onComplete={onComplete}
        />
      );

    case "drag_game":
      return (
        <DragGameActivity
          activity={{
            payload: {
              prompt: activity.prompt,
              items: activity.items,
            },
          }}
          onComplete={onComplete}
        />
      );
     case "choice":
  return (
    <QuizBattleActivity
      prompt={activity.prompt}
      options={activity.options}
      answer={activity.answer}
      hint={activity.hint}
      attempts={attempts}
      onAttempt={onAttempt}
    />
  );
  case "quiz":
  return (
    <QuizBattleActivity
      prompt={activity.question}
      options={activity.options}
      answer={activity.answer}
      hint={activity.hint}
      attempts={attempts}
      onAttempt={onAttempt}
    />
  );



    default:
      return (
        <View style={styles.unsupportedCard}>
          <Text style={styles.centerEmoji}>🧩</Text>
          <Text style={styles.centerHelper}>
            এই activity দেখানো যাচ্ছে না।
          </Text>
        </View>
      );
  }
}

function QuestionActivity({
  prompt,
  options,
  answer,
  hint,
  attempts,
  onAttempt,
}: {
  prompt: string;
  options: string[];
  answer: number;
  hint: string;
  attempts: number;
  onAttempt: (correct: boolean) => void;
}) {
  const [selected, setSelected] =
    useState<number | null>(null);
  const [correct, setCorrect] = useState(false);

  const choose = (index: number) => {
    if (correct) {
      return;
    }

    setSelected(index);

    const result = index === answer;
    setCorrect(result);
    onAttempt(result);

    if (result) {
      void speakBangla(
        "সঠিক উত্তর। দারুণ করেছ।",
      );
    } else {
      void speakBangla(
        "আরেকবার চেষ্টা করো।",
      );
    }
  };

  return (
    <View style={styles.questionWrap}>
      <Text style={styles.questionTitle}>
        {prompt}
      </Text>

      <Pressable
        onPress={() => void speakBangla(prompt)}
        style={({ pressed }) => [
          styles.questionListenButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.questionListenText}>
          🔊 প্রশ্নটি শুনি
        </Text>
      </Pressable>

      <View style={styles.optionList}>
        {options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrectAnswer =
            correct && index === answer;

          return (
            <Pressable
              key={`${option}-${index}`}
              disabled={correct}
              onPress={() => choose(index)}
              style={({ pressed }) => [
                styles.option,
                isSelected &&
                  !correct &&
                  styles.wrongOption,
                isCorrectAnswer &&
                  styles.correctOption,
                pressed &&
                  !correct &&
                  styles.optionPressed,
              ]}
            >
              <View
                style={[
                  styles.optionLetterCircle,
                  isCorrectAnswer &&
                    styles.optionLetterCorrect,
                  isSelected &&
                    !correct &&
                    styles.optionLetterWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionLetter,
                    (isCorrectAnswer ||
                      (isSelected && !correct)) &&
                      styles.optionLetterSelected,
                  ]}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>

              <Text style={styles.optionText}>
                {option}
              </Text>

              {isCorrectAnswer ? (
                <Text style={styles.optionResult}>
                  ✓
                </Text>
              ) : null}

              {isSelected && !correct ? (
                <Text
                  style={[
                    styles.optionResult,
                    styles.optionResultWrong,
                  ]}
                >
                  ×
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {selected !== null && !correct ? (
        <View style={styles.hintCard}>
          <Text style={styles.hintIcon}>💡</Text>
          <View style={styles.hintCopy}>
            <Text style={styles.hintTitle}>
              ইঙ্গিত
            </Text>
            <Text style={styles.hintText}>
              {hint}
            </Text>
          </View>
        </View>
      ) : null}

      {correct ? (
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>🎉</Text>
          <View>
            <Text style={styles.successTitle}>
              সঠিক উত্তর!
            </Text>
            <Text style={styles.successText}>
              {Math.max(1, attempts + 1)} বার
              চেষ্টা করে শেষ করেছ
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F3F8",
  },

  page: {
    flex: 1,
    backgroundColor: "#F6F3F8",
  },

  topShell: {
    paddingTop: 5,
    paddingBottom: 9,
    backgroundColor: "#F6F3F8",
  },

  topInner: {
    width: "100%",
    alignSelf: "center",
  },

  header: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
  },

  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  closeText: {
    marginTop: -3,
    fontSize: 30,
    fontWeight: "500",
    color: "#29242C",
  },

  headerCopy: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },

  chapterTitle: {
    maxWidth: "100%",
    fontSize: 16,
    fontWeight: "900",
    color: "#201C22",
  },

  stepText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "800",
    color: "#817984",
  },

  completionBadge: {
    minWidth: 68,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 16,
  },

  completionBadgeDone: {
    backgroundColor: "#DFF5DB",
  },

  completionBadgeTodo: {
    backgroundColor: "#FFF0C8",
  },

  completionBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  completionTextDone: {
    color: "#3C9236",
  },

  completionTextTodo: {
    color: "#A36A00",
  },

  progressTrack: {
    height: 8,
    overflow: "hidden",
    marginTop: 5,
    borderRadius: 4,
    backgroundColor: "#E5E1E8",
  },

  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#7653BD",
  },

  activityScroll: {
    flex: 1,
  },

  activityScrollContent: {
    flexGrow: 1,
    paddingTop: 3,
  },

  activityShell: {
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    shadowColor: "#77707C",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },

  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  activityMeta: {
    flexDirection: "row",
    alignItems: "center",
  },

  activityIconCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#EEE6FF",
  },

  activityIcon: {
    fontSize: 23,
  },

  activityEyebrow: {
    marginLeft: 10,
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#9A919E",
  },

  activityLabel: {
    marginTop: 2,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "900",
    color: "#2B262D",
  },

  listenButton: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: "#E9F5FF",
  },

  listenIcon: {
    fontSize: 15,
  },

  listenText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#2678A2",
  },

  activityDivider: {
    height: 1,
    marginTop: 13,
    marginBottom: 16,
    backgroundColor: "#EEEAF0",
  },

  rendererWrap: {
    flex: 1,
  },

  actionShell: {
    paddingTop: 8,
    paddingBottom: 7,
    backgroundColor: "#F6F3F8",
  },

  actions: {
    width: "100%",
    minHeight: 58,
    flexDirection: "row",
    alignSelf: "center",
    gap: 9,
  },

  backButton: {
    width: 102,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D5CFD9",
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
  },

  backButtonIcon: {
    marginTop: -3,
    marginRight: 5,
    fontSize: 28,
    color: "#322C35",
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#322C35",
  },

  nextButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 21,
    paddingRight: 7,
    borderRadius: 29,
    backgroundColor: "#1A171C",
    shadowColor: "#1A171C",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  nextButtonDisabled: {
    backgroundColor: "#C8C3CC",
    shadowOpacity: 0,
    elevation: 0,
  },

  nextButtonPressed: {
    transform: [{ translateY: 2 }],
  },

  nextButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  nextArrowCircle: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#C98BFF",
  },

  nextArrow: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F6F3F8",
  },

  loadingCircle: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 41,
    backgroundColor: "#EEE6FF",
  },

  centerEmoji: {
    fontSize: 42,
  },

  centerTitle: {
    marginTop: 13,
    fontSize: 20,
    fontWeight: "900",
    color: "#28232A",
    textAlign: "center",
  },

  centerHelper: {
    maxWidth: 360,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#776E79",
    textAlign: "center",
  },

  primaryButton: {
    marginTop: 18,
    paddingHorizontal: 21,
    paddingVertical: 13,
    borderRadius: 21,
    backgroundColor: "#1A171C",
  },

  primaryButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  rewardScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 18,
    backgroundColor: "#F6F3F8",
  },

  rewardCard: {
    position: "relative",
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 34,
    backgroundColor: "#CBBBF2",
  },

  rewardOrbOne: {
    position: "absolute",
    top: -75,
    right: -60,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(255,255,255,0.23)",
  },

  rewardOrbTwo: {
    position: "absolute",
    left: -62,
    bottom: -72,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  rewardConfetti: {
    fontSize: 27,
    color: "#FFFFFF",
  },

  rewardGuideCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    backgroundColor: "rgba(255,255,255,0.42)",
  },

  rewardGuide: {
    width: "100%",
    height: "100%",
  },

  rewardTitle: {
    marginTop: 4,
    fontSize: 31,
    fontWeight: "900",
    color: "#171419",
  },

  rewardTitleTablet: {
    fontSize: 40,
  },

  rewardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#554960",
  },

  rewardStars: {
    marginTop: 11,
    fontSize: 34,
  },

  rewardStarsTablet: {
    fontSize: 43,
  },

  resultRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  resultBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.78)",
  },

  resultIcon: {
    fontSize: 24,
  },

  resultValue: {
    marginTop: 4,
    fontSize: 21,
    fontWeight: "900",
    color: "#28232A",
  },

  resultLabel: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "800",
    color: "#746A79",
  },

  rewardButton: {
    width: "100%",
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingHorizontal: 8,
    borderRadius: 31,
    backgroundColor: "#1A171C",
  },

  rewardButtonIcon: {
    width: 46,
    textAlign: "center",
    fontSize: 22,
  },

  rewardButtonText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  rewardButtonArrow: {
    marginRight: 16,
    fontSize: 28,
    color: "#FFFFFF",
  },

  questionWrap: {
    width: "100%",
  },

  questionTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "900",
    color: "#242027",
    textAlign: "center",
  },

  questionListenButton: {
    alignSelf: "center",
    marginTop: 11,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#E7F4FF",
  },

  questionListenText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2678A2",
  },

  optionList: {
    gap: 10,
    marginTop: 18,
  },

  option: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 2,
    borderColor: "#D8D1DD",
    borderBottomWidth: 5,
    borderRadius: 21,
    backgroundColor: "#FAF9FB",
  },

  correctOption: {
    borderColor: "#58B84D",
    backgroundColor: "#E5F8E1",
  },

  wrongOption: {
    borderColor: "#E17373",
    backgroundColor: "#FFE8E8",
  },

  optionPressed: {
    transform: [{ translateY: 2 }],
  },

  optionLetterCircle: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#EEE9F1",
  },

  optionLetterCorrect: {
    backgroundColor: "#58B84D",
  },

  optionLetterWrong: {
    backgroundColor: "#E17373",
  },

  optionLetter: {
    fontSize: 13,
    fontWeight: "900",
    color: "#5F5664",
  },

  optionLetterSelected: {
    color: "#FFFFFF",
  },

  optionText: {
    flex: 1,
    marginHorizontal: 11,
    fontSize: 16,
    fontWeight: "900",
    color: "#2D282F",
  },

  optionResult: {
    fontSize: 20,
    fontWeight: "900",
    color: "#459B3E",
  },

  optionResultWrong: {
    color: "#C85050",
  },

  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 13,
    borderRadius: 19,
    backgroundColor: "#FFF3CC",
  },

  hintIcon: {
    fontSize: 24,
  },

  hintCopy: {
    flex: 1,
    marginLeft: 10,
  },

  hintTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#976700",
  },

  hintText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#5E4D27",
  },

  successCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 13,
    borderRadius: 19,
    backgroundColor: "#E1F6DD",
  },

  successIcon: {
    marginRight: 10,
    fontSize: 27,
  },

  successTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#3F9138",
  },

  successText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#5C7858",
  },

  unsupportedCard: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
});
