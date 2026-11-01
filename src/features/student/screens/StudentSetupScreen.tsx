import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import type { NativeStackScreenProps } from "../../../web/navigation";

import type { GateStackParamList } from "../../../navigation/gateRoutes";
import { useStudentStore } from "../store/studentStore";

type Props = NativeStackScreenProps<
  GateStackParamList,
  "StudentSetup"
>;

type Language = "bn" | "en";
type ClassLevel = 1 | 2 | 3;

type ClassOption = {
  level: ClassLevel;
  numberBn: string;
  numberEn: string;
  labelBn: string;
  labelEn: string;
  icon: string;
  backgroundColor: string;
  accentColor: string;
};

const CLASS_OPTIONS: ClassOption[] = [
  {
    level: 1,
    numberBn: "১",
    numberEn: "1",
    labelBn: "প্রথম",
    labelEn: "One",
    icon: "⭐",
    backgroundColor: "#DDF5FF",
    accentColor: "#2D9CDB",
  },
  {
    level: 2,
    numberBn: "২",
    numberEn: "2",
    labelBn: "দ্বিতীয়",
    labelEn: "Two",
    icon: "🏆",
    backgroundColor: "#FFF0BE",
    accentColor: "#FFAA1F",
  },
  {
    level: 3,
    numberBn: "৩",
    numberEn: "3",
    labelBn: "তৃতীয়",
    labelEn: "Three",
    icon: "📚",
    backgroundColor: "#DFF6D9",
    accentColor: "#55BC4A",
  },
];

const TEXT = {
  bn: {
    eyebrow: "NCTB KIDS",
    headline: "চলো শেখা\nশুরু করি!",
    question: "তুমি কোন শ্রেণিতে পড়ো?",
    voice:
      "হ্যালো বন্ধু! তুমি কোন শ্রেণিতে পড়ো? নিচের একটি শ্রেণি বেছে নাও।",
    classWord: "শ্রেণি",
    listen: "আবার শুনি",
    continue: "শুরু করি",
    parentRecover: "মা-বাবার Account দিয়ে ফিরিয়ে আনুন",
    parentRecoverHint:
      "Linked child হলে সবচেয়ে সহজ উপায়",
    backupRecover:
      "Student ID + Recovery Code ব্যবহার করুন",
    selected: (label: string) =>
      `দারুণ! তুমি ${label} শ্রেণি বেছে নিয়েছো। এবার শুরু করি বাটনে চাপ দাও।`,
    success:
      "চমৎকার! তোমার profile তৈরি হচ্ছে।",
    errorTitle: "Profile তৈরি হয়নি",
    errorMessage:
      "Internet connection ও Supabase configuration পরীক্ষা করে আবার চেষ্টা করো।",
  },
  en: {
    eyebrow: "NCTB KIDS",
    headline: "Let’s learn,\nplay & grow!",
    question: "Which class are you in?",
    voice:
      "Hello, friend! Which class are you in? Choose one of the classes below.",
    classWord: "Class",
    listen: "Hear again",
    continue: "Get started",
    parentRecover: "Restore with Parent Account",
    parentRecoverHint:
      "The easiest way for a linked child",
    backupRecover:
      "Use Student ID + Recovery Code",
    selected: (label: string) =>
      `Great! You selected Class ${label}. Now tap the Get started button.`,
    success:
      "Wonderful! Your profile is being created.",
    errorTitle: "Profile was not created",
    errorMessage:
      "Check your internet connection and Supabase configuration, then try again.",
  },
} as const;

export default function StudentSetupScreen({
  navigation,
}: Props) {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 600;
  const compact = height < 760;

  const createStudent = useStudentStore(
    (state) => state.createStudent,
  );

  const [language, setLanguage] =
    useState<Language>("bn");
  const [selectedClass, setSelectedClass] =
    useState<ClassLevel | null>(null);
  const [creating, setCreating] =
    useState(false);
  const [speaking, setSpeaking] =
    useState(false);

  const guideFloat = useRef(
    new Animated.Value(0),
  ).current;

  const copy = TEXT[language];

  const speak = useCallback(
    (
      message: string,
      voiceLanguage: Language,
    ) => {
      void Speech.stop();

      Speech.speak(message, {
        language:
          voiceLanguage === "bn"
            ? "bn-BD"
            : "en-US",
        rate:
          voiceLanguage === "bn"
            ? 0.78
            : 0.88,
        pitch: 1.05,
        onStart: () => setSpeaking(true),
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    },
    [],
  );

  useEffect(() => {
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(guideFloat, {
          toValue: -7,
          duration: 950,
          useNativeDriver: true,
        }),
        Animated.timing(guideFloat, {
          toValue: 0,
          duration: 950,
          useNativeDriver: true,
        }),
      ]),
    );

    floating.start();

    return () => {
      floating.stop();
      void Speech.stop();
    };
  }, [guideFloat]);

  useEffect(() => {
    const timer = setTimeout(() => {
      speak(
        TEXT[language].voice,
        language,
      );
    }, 650);

    return () => clearTimeout(timer);
  }, [language, speak]);

  const selectedOption = useMemo(
    () =>
      CLASS_OPTIONS.find(
        (option) =>
          option.level === selectedClass,
      ) ?? null,
    [selectedClass],
  );

  const chooseClass = (
    option: ClassOption,
  ) => {
    if (creating) {
      return;
    }

    setSelectedClass(option.level);

    const label =
      language === "bn"
        ? option.labelBn
        : option.labelEn;

    speak(
      TEXT[language].selected(label),
      language,
    );
  };

  const continueSetup = async () => {
    if (!selectedClass || creating) {
      return;
    }

    setCreating(true);
    speak(copy.success, language);

    try {
      await createStudent(
        selectedClass,
      );
    } catch (error) {
      setCreating(false);

      const technicalMessage =
        error instanceof Error
          ? error.message
          : copy.errorMessage;

      Alert.alert(
        copy.errorTitle,
        `${technicalMessage}\n\n${copy.errorMessage}`,
      );
    }
  };

  const maxWidth = isTablet ? 760 : 560;
  const guideSize = isTablet
    ? 260
    : compact
      ? 185
      : 220;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal:
              isTablet ? 28 : 12,
          },
        ]}
      >
        <View
          style={[
            styles.shell,
            { maxWidth },
          ]}
        >
          <View style={styles.hero}>
            <View style={styles.purpleOrb} />
            <View style={styles.pinkShape} />
            <View style={styles.yellowShape} />

            <View style={styles.topBar}>
              <View style={styles.stepDots}>
                <View
                  style={[
                    styles.stepDot,
                    styles.stepDotActive,
                  ]}
                />
                <View style={styles.stepDot} />
                <View style={styles.stepDot} />
              </View>

              <View
                style={styles.languageSwitch}
              >
                {(["bn", "en"] as const).map(
                  (item) => (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      disabled={creating}
                      onPress={() =>
                        setLanguage(item)
                      }
                      style={[
                        styles.languageButton,
                        language === item &&
                          styles.languageButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.languageText,
                          language === item &&
                            styles.languageTextActive,
                        ]}
                      >
                        {item === "bn"
                          ? "বাংলা"
                          : "English"}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>
                {copy.eyebrow}
              </Text>
              <Text
                style={[
                  styles.headline,
                  isSmallPhone &&
                    styles.headlineSmall,
                  isTablet &&
                    styles.headlineTablet,
                ]}
              >
                {copy.headline}
              </Text>
              <View
                style={styles.highlightBar}
              />
            </View>

            <Animated.View
              style={[
                styles.guideWrap,
                {
                  width: guideSize,
                  height: guideSize,
                  transform: [
                    {
                      translateY: guideFloat,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.guideGlow} />
              <Image
                source={'/characters/mimi/waving.png'}
                style={styles.guideImage}
                resizeMode="contain"
              />
            </Animated.View>

            <View style={styles.questionPill}>
              <View style={styles.voiceAvatar}>
                <Text
                  style={styles.voiceAvatarText}
                >
                  {speaking ? "🔊" : "👋"}
                </Text>
              </View>

              <Text
                style={styles.questionText}
                numberOfLines={2}
              >
                {copy.question}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  copy.listen
                }
                onPress={() =>
                  speak(
                    TEXT[language].voice,
                    language,
                  )
                }
                style={({ pressed }) => [
                  styles.replayButton,
                  speaking &&
                    styles.replayButtonActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.replayIcon}>
                  ▶
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.selectionCard}>
            <View style={styles.sheetHandle} />

            <View style={styles.classRow}>
              {CLASS_OPTIONS.map((option) => {
                const selected =
                  selectedClass ===
                  option.level;

                return (
                  <Pressable
                    key={option.level}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected,
                    }}
                    disabled={creating}
                    onPress={() =>
                      chooseClass(option)
                    }
                    style={({ pressed }) => [
                      styles.classCard,
                      {
                        backgroundColor:
                          option.backgroundColor,
                        borderColor:
                          option.accentColor,
                      },
                      selected &&
                        styles.classCardSelected,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={styles.classIcon}
                    >
                      {option.icon}
                    </Text>

                    <Text
                      style={[
                        styles.classNumber,
                        {
                          color:
                            option.accentColor,
                        },
                      ]}
                    >
                      {language === "bn"
                        ? option.numberBn
                        : option.numberEn}
                    </Text>

                    <Text
                      style={styles.classWord}
                    >
                      {copy.classWord}
                    </Text>

                    {selected ? (
                      <View
                        style={styles.checkBadge}
                      >
                        <Text
                          style={styles.checkText}
                        >
                          ✓
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {selectedOption ? (
              <View
                style={styles.selectionNote}
              >
                <Text
                  style={styles.selectionNoteIcon}
                >
                  ✨
                </Text>
                <Text
                  style={styles.selectionNoteText}
                >
                  {language === "bn"
                    ? `${selectedOption.labelBn} শ্রেণি নির্বাচন করা হয়েছে`
                    : `Class ${selectedOption.labelEn} selected`}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={
                !selectedClass || creating
              }
              onPress={() =>
                void continueSetup()
              }
              style={({ pressed }) => [
                styles.cta,
                (!selectedClass ||
                  creating) &&
                  styles.ctaDisabled,
                pressed &&
                  selectedClass &&
                  !creating &&
                  styles.ctaPressed,
              ]}
            >
              <View
                style={styles.ctaIconCircle}
              >
                <Text style={styles.ctaIcon}>
                  📖
                </Text>
              </View>

              <Text style={styles.ctaText}>
                {copy.continue}
              </Text>

              {creating ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={styles.ctaArrows}
                >
                  ››
                </Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View
                style={styles.dividerLine}
              />
              <Text
                style={styles.dividerText}
              >
                OR
              </Text>
              <View
                style={styles.dividerLine}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={creating}
              onPress={() =>
                navigation.navigate(
                  "ParentLinkedRecovery",
                )
              }
              style={({ pressed }) => [
                styles.recoveryButton,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={styles.recoveryIconCircle}
              >
                <Text
                  style={styles.recoveryIcon}
                >
                  👪
                </Text>
              </View>

              <View
                style={styles.recoveryCopy}
              >
                <Text
                  style={styles.recoveryTitle}
                >
                  {copy.parentRecover}
                </Text>
                <Text
                  style={styles.recoveryHint}
                >
                  {copy.parentRecoverHint}
                </Text>
              </View>

              <Text
                style={styles.recoveryArrow}
              >
                ›
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={creating}
              onPress={() =>
                navigation.navigate(
                  "StudentRecovery",
                )
              }
              style={({ pressed }) => [
                styles.backupRecoveryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={styles.backupRecoveryIcon}
              >
                🔑
              </Text>
              <Text
                style={styles.backupRecoveryText}
              >
                {copy.backupRecover}
              </Text>
              <Text
                style={styles.backupRecoveryArrow}
              >
                ›
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F1F8",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 6,
    paddingBottom: 20,
  },
  shell: {
    width: "100%",
    alignSelf: "center",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: 395,
    borderRadius: 34,
    backgroundColor: "#C8B7F4",
  },
  purpleOrb: {
    position: "absolute",
    top: -80,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#B19AEB",
  },
  pinkShape: {
    position: "absolute",
    left: -60,
    bottom: 72,
    width: 180,
    height: 180,
    borderRadius: 44,
    backgroundColor: "#E7B9F2",
    transform: [{ rotate: "38deg" }],
  },
  yellowShape: {
    position: "absolute",
    right: -20,
    bottom: 20,
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#FFE47F",
    transform: [{ rotate: "-20deg" }],
  },
  topBar: {
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  stepDots: {
    flexDirection: "row",
    gap: 6,
  },
  stepDot: {
    width: 20,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      "rgba(255,255,255,0.55)",
  },
  stepDotActive: {
    width: 30,
    backgroundColor: "#242026",
  },
  languageSwitch: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 22,
    backgroundColor:
      "rgba(255,255,255,0.72)",
  },
  languageButton: {
    minWidth: 64,
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
  },
  languageButtonActive: {
    backgroundColor: "#17151A",
  },
  languageText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#69616E",
  },
  languageTextActive: {
    color: "#FFFFFF",
  },
  heroCopy: {
    zIndex: 3,
    width: "62%",
    paddingLeft: 22,
    paddingTop: 25,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "900",
    color: "#493A69",
  },
  headline: {
    marginTop: 8,
    fontSize: 36,
    lineHeight: 43,
    fontWeight: "900",
    color: "#171419",
  },
  headlineSmall: {
    fontSize: 31,
    lineHeight: 37,
  },
  headlineTablet: {
    fontSize: 45,
    lineHeight: 52,
  },
  highlightBar: {
    width: 120,
    height: 13,
    marginTop: -7,
    marginLeft: 18,
    borderRadius: 7,
    backgroundColor: "#FFE66E",
    transform: [{ rotate: "-3deg" }],
  },
  guideWrap: {
    position: "absolute",
    right: 5,
    bottom: 42,
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  guideGlow: {
    position: "absolute",
    width: "78%",
    height: "78%",
    borderRadius: 999,
    backgroundColor:
      "rgba(255,255,255,0.56)",
  },
  guideImage: {
    width: "100%",
    height: "100%",
  },
  questionPill: {
    position: "absolute",
    zIndex: 7,
    left: 18,
    right: 18,
    bottom: 15,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
    shadowColor: "#6E5C98",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  voiceAvatar: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#F1D7FF",
  },
  voiceAvatarText: {
    fontSize: 22,
  },
  questionText: {
    flex: 1,
    marginHorizontal: 11,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    color: "#29232E",
  },
  replayButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#E9E1FF",
  },
  replayButtonActive: {
    backgroundColor: "#DCF6D7",
  },
  replayIcon: {
    marginLeft: 2,
    fontSize: 15,
    fontWeight: "900",
    color: "#211D27",
  },
  selectionCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    marginBottom: 15,
    borderRadius: 3,
    backgroundColor: "#DDD7E3",
  },
  classRow: {
    flexDirection: "row",
    gap: 9,
  },
  classCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 142,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderBottomWidth: 7,
    borderRadius: 25,
  },
  classCardSelected: {
    borderWidth: 4,
    borderBottomWidth: 8,
    transform: [{ translateY: -5 }],
  },
  classIcon: {
    fontSize: 27,
  },
  classNumber: {
    marginTop: 5,
    fontSize: 43,
    lineHeight: 49,
    fontWeight: "900",
  },
  classWord: {
    marginTop: -2,
    fontSize: 12,
    fontWeight: "900",
    color: "#3F3945",
  },
  checkBadge: {
    position: "absolute",
    top: -9,
    right: -6,
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 16,
    backgroundColor: "#17151A",
  },
  checkText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  selectionNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
    paddingVertical: 8,
    borderRadius: 17,
    backgroundColor: "#F5F1FA",
  },
  selectionNoteIcon: {
    fontSize: 15,
  },
  selectionNoteText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "900",
    color: "#675D6C",
  },
  cta: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 7,
    borderRadius: 31,
    backgroundColor: "#17151A",
  },
  ctaDisabled: {
    backgroundColor: "#C8C3CC",
  },
  ctaPressed: {
    transform: [{ translateY: 3 }],
  },
  ctaIconCircle: {
    width: 49,
    height: 49,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 25,
    backgroundColor: "#C98BFF",
  },
  ctaIcon: {
    fontSize: 23,
  },
  ctaText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  ctaArrows: {
    marginRight: 16,
    fontSize: 27,
    letterSpacing: -2,
    color: "#FFFFFF",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E6E0E8",
  },
  dividerText: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#A299A5",
  },
  recoveryButton: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    borderWidth: 2,
    borderColor: "#DED7E4",
    borderRadius: 26,
    backgroundColor: "#FAF8FB",
  },
  recoveryIconCircle: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#EEE6FF",
  },
  recoveryIcon: {
    fontSize: 21,
  },
  recoveryCopy: {
    flex: 1,
    marginLeft: 11,
  },
  recoveryTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#403842",
  },
  recoveryHint: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: "700",
    color: "#8A808D",
  },
  recoveryArrow: {
    marginRight: 8,
    fontSize: 27,
    color: "#7553BA",
  },
  backupRecoveryButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
    paddingHorizontal: 12,
    borderRadius: 23,
    backgroundColor: "#FFF1C8",
  },
  backupRecoveryIcon: {
    fontSize: 17,
  },
  backupRecoveryText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    fontWeight: "900",
    color: "#655633",
    textAlign: "center",
  },
  backupRecoveryArrow: {
    fontSize: 23,
    color: "#7553BA",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
});
