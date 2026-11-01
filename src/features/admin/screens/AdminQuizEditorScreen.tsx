import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import { SafeAreaView } from "../../../web/safe-area";
import { useFocusEffect } from "../../../web/navigation";

import type { ScreenProps } from "../../../navigation/routes";
import type { PublicationStatus } from "../../learning/types/supabaseCurriculum";
import {
  adminService,
  type AdminQuizOption,
  type AdminQuizQuestion,
  type AdminUser,
} from "../services/adminService";

const STATUSES: PublicationStatus[] = [
  "draft",
  "published",
  "archived",
];

type OptionForm = {
  labelBn: string;
  labelEn: string;
  imageUrl: string;
  isCorrect: boolean;
};

type QuestionForm = {
  id?: string;
  orderIndex: string;
  questionBn: string;
  questionEn: string;
  explanationBn: string;
  explanationEn: string;
  imageUrl: string;
  status: PublicationStatus;
  options: OptionForm[];
};

function createOptions(): OptionForm[] {
  return [
    {
      labelBn: "",
      labelEn: "",
      imageUrl: "",
      isCorrect: true,
    },
    {
      labelBn: "",
      labelEn: "",
      imageUrl: "",
      isCorrect: false,
    },
    {
      labelBn: "",
      labelEn: "",
      imageUrl: "",
      isCorrect: false,
    },
    {
      labelBn: "",
      labelEn: "",
      imageUrl: "",
      isCorrect: false,
    },
  ];
}

function emptyForm(orderIndex: number): QuestionForm {
  return {
    orderIndex: String(orderIndex),
    questionBn: "",
    questionEn: "",
    explanationBn: "",
    explanationEn: "",
    imageUrl: "",
    status: "draft",
    options: createOptions(),
  };
}

function statusLabel(status: PublicationStatus) {
  if (status === "published") {
    return "Published";
  }

  if (status === "archived") {
    return "Archived";
  }

  return "Draft";
}

function optionLetter(index: number) {
  return String.fromCharCode(65 + index);
}

export default function AdminQuizEditorScreen({
  navigation,
  route,
}: ScreenProps<"AdminQuizEditor">) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 700;
  const maxWidth = isTablet ? 980 : 720;

  const {
    chapterId,
    chapterTitle,
    activityId,
  } = route.params;

  const [admin, setAdmin] =
    useState<AdminUser | null>(null);
  const [questions, setQuestions] = useState<
    AdminQuizQuestion[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formVisible, setFormVisible] =
    useState(false);
  const [form, setForm] = useState<QuestionForm>(
    emptyForm(1),
  );

  const loadQuestions = useCallback(async () => {
    setLoading(true);

    try {
      const currentAdmin =
        await adminService.getCurrentAdmin();

      if (!currentAdmin) {
        navigation.replace("AdminLogin");
        return;
      }

      setAdmin(currentAdmin);

      const rows =
        await adminService.listQuizQuestions(
          chapterId,
        );

      setQuestions(rows);
    } catch (error) {
      Alert.alert(
        "Quiz questions লোড হয়নি",
        error instanceof Error
          ? error.message
          : "আবার চেষ্টা করুন।",
      );
    } finally {
      setLoading(false);
    }
  }, [chapterId, navigation]);

  useFocusEffect(
    useCallback(() => {
      void loadQuestions();
    }, [loadQuestions]),
  );

  const visibleQuestions = useMemo(() => {
    if (!activityId) {
      return questions;
    }

    return questions.filter(
      (question) =>
        question.activity_id === activityId ||
        question.activity_id === null,
    );
  }, [activityId, questions]);

  const publishedCount = useMemo(
    () =>
      visibleQuestions.filter(
        (question) =>
          question.status === "published",
      ).length,
    [visibleQuestions],
  );

  const validPublishedCount = useMemo(
    () =>
      visibleQuestions.filter(
        (question) =>
          question.status === "published" &&
          question.options.length >= 2 &&
          question.options.filter(
            (option) => option.isCorrect,
          ).length === 1,
      ).length,
    [visibleQuestions],
  );

  const nextOrderIndex =
    visibleQuestions.length > 0
      ? Math.max(
          ...visibleQuestions.map(
            (question) => question.order_index,
          ),
        ) + 1
      : 1;

  const openCreate = () => {
    setForm(emptyForm(nextOrderIndex));
    setFormVisible(true);
  };

  const openEdit = (
    question: AdminQuizQuestion,
  ) => {
    const mappedOptions = question.options.map(
      (option): OptionForm => ({
        labelBn: option.labelBn,
        labelEn: option.labelEn ?? "",
        imageUrl: option.imageUrl ?? "",
        isCorrect: option.isCorrect,
      }),
    );

    setForm({
      id: question.id,
      orderIndex: String(question.order_index),
      questionBn: question.question_bn,
      questionEn: question.question_en ?? "",
      explanationBn:
        question.explanation_bn ?? "",
      explanationEn:
        question.explanation_en ?? "",
      imageUrl: question.image_url ?? "",
      status: question.status,
      options:
        mappedOptions.length >= 2
          ? mappedOptions
          : createOptions(),
    });
    setFormVisible(true);
  };

  const updateOption = (
    index: number,
    patch: Partial<OptionForm>,
  ) => {
    setForm((current) => ({
      ...current,
      options: current.options.map(
        (option, optionIndex) =>
          optionIndex === index
            ? { ...option, ...patch }
            : option,
      ),
    }));
  };

  const setCorrectOption = (index: number) => {
    setForm((current) => ({
      ...current,
      options: current.options.map(
        (option, optionIndex) => ({
          ...option,
          isCorrect: optionIndex === index,
        }),
      ),
    }));
  };

  const addOption = () => {
    if (form.options.length >= 6) {
      Alert.alert(
        "সর্বোচ্চ ৬টি option",
        "একটি question-এ সর্বোচ্চ ৬টি option রাখা যাবে।",
      );
      return;
    }

    setForm((current) => ({
      ...current,
      options: [
        ...current.options,
        {
          labelBn: "",
          labelEn: "",
          imageUrl: "",
          isCorrect: false,
        },
      ],
    }));
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 2) {
      Alert.alert(
        "কমপক্ষে ২টি option",
        "Quiz question-এ কমপক্ষে ২টি option প্রয়োজন।",
      );
      return;
    }

    setForm((current) => {
      const next = current.options.filter(
        (_, optionIndex) => optionIndex !== index,
      );

      if (
        !next.some((option) => option.isCorrect)
      ) {
        next[0] = {
          ...next[0],
          isCorrect: true,
        };
      }

      return {
        ...current,
        options: next,
      };
    });
  };

  const saveQuestion = async () => {
    const orderIndex = Number(form.orderIndex);

    if (
      !Number.isInteger(orderIndex) ||
      orderIndex < 1
    ) {
      Alert.alert(
        "Order প্রয়োজন",
        "সঠিক order index লিখুন।",
      );
      return;
    }

    if (!form.questionBn.trim()) {
      Alert.alert(
        "প্রশ্ন প্রয়োজন",
        "বাংলা question লিখুন।",
      );
      return;
    }

    const cleanedOptions = form.options.map(
      (option) => ({
        ...option,
        labelBn: option.labelBn.trim(),
      }),
    );

    if (
      cleanedOptions.length < 2 ||
      cleanedOptions.some(
        (option) => !option.labelBn,
      )
    ) {
      Alert.alert(
        "Option অসম্পূর্ণ",
        "কমপক্ষে ২টি option-এর বাংলা label লিখুন।",
      );
      return;
    }

    if (
      cleanedOptions.filter(
        (option) => option.isCorrect,
      ).length !== 1
    ) {
      Alert.alert(
        "Correct answer প্রয়োজন",
        "ঠিক একটি correct option নির্বাচন করুন।",
      );
      return;
    }

    setSaving(true);

    try {
      const optionPayload: AdminQuizOption[] =
        cleanedOptions.map((option, index) => ({
          optionOrder: index + 1,
          labelBn: option.labelBn,
          labelEn:
            option.labelEn.trim() || undefined,
          imageUrl:
            option.imageUrl.trim() || undefined,
          isCorrect: option.isCorrect,
        }));

      await adminService.saveQuizQuestion({
        id: form.id,
        chapterId,
        activityId: activityId ?? null,
        orderIndex,
        questionBn: form.questionBn,
        questionEn: form.questionEn,
        explanationBn: form.explanationBn,
        explanationEn: form.explanationEn,
        imageUrl: form.imageUrl,
        status: form.status,
        options: optionPayload,
      });

      setFormVisible(false);
      await loadQuestions();
    } catch (error) {
      Alert.alert(
        "Question save হয়নি",
        error instanceof Error
          ? error.message
          : "আবার চেষ্টা করুন।",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (
    question: AdminQuizQuestion,
  ) => {
    const nextStatus: PublicationStatus =
      question.status === "published"
        ? "draft"
        : "published";

    if (
      nextStatus === "published" &&
      (question.options.length < 2 ||
        question.options.filter(
          (option) => option.isCorrect,
        ).length !== 1)
    ) {
      Alert.alert(
        "Question publish করা যাবে না",
        "কমপক্ষে ২টি option এবং একটি correct answer প্রয়োজন।",
      );
      return;
    }

    Alert.alert(
      "Status পরিবর্তন",
      `Questionটি ${
        nextStatus === "published"
          ? "publish"
          : "unpublish"
      } হবে।`,
      [
        {
          text: "বাতিল",
          style: "cancel",
        },
        {
          text:
            nextStatus === "published"
              ? "Publish"
              : "Unpublish",
          onPress: () => {
            void (async () => {
              try {
                await adminService.setQuizQuestionStatus(
                  question.id,
                  nextStatus,
                );
                await loadQuestions();
              } catch (error) {
                Alert.alert(
                  "Status বদলায়নি",
                  error instanceof Error
                    ? error.message
                    : "আবার চেষ্টা করুন।",
                );
              }
            })();
          },
        },
      ],
    );
  };

  const deleteQuestion = (
    question: AdminQuizQuestion,
  ) => {
    Alert.alert(
      "Question delete করবেন?",
      "Question এবং এর সব option মুছে যাবে। এই কাজটি undo করা যাবে না।",
      [
        {
          text: "বাতিল",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await adminService.deleteQuizQuestion(
                  question.id,
                );
                await loadQuestions();
              } catch (error) {
                Alert.alert(
                  "Delete হয়নি",
                  error instanceof Error
                    ? error.message
                    : "আবার চেষ্টা করুন।",
                );
              }
            })();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator
            size="large"
            color="#8057C5"
          />
          <Text style={styles.centerTitle}>
            Quiz questions লোড হচ্ছে...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: isSmallPhone
                ? 12
                : isTablet
                  ? 28
                  : 16,
            },
          ]}
        >
          <View
            style={[
              styles.shell,
              { maxWidth },
            ]}
          >
            <View style={styles.header}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.backIcon}>‹</Text>
              </Pressable>

              <View style={styles.headerCopy}>
                <Text style={styles.headerEyebrow}>
                  QUIZ EDITOR
                </Text>
                <Text
                  style={styles.headerTitle}
                  numberOfLines={1}
                >
                  {chapterTitle}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {admin?.role === "admin"
                    ? "Admin"
                    : "Content Creator"}
                </Text>
              </View>

              <Pressable
                onPress={openCreate}
                style={({ pressed }) => [
                  styles.addHeaderButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.addHeaderText}>
                  ＋
                </Text>
              </Pressable>
            </View>

            <View style={styles.hero}>
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>
                  QUESTIONS & OPTIONS
                </Text>
                <Text
                  style={[
                    styles.heroTitle,
                    isTablet &&
                      styles.heroTitleTablet,
                  ]}
                >
                  Quiz তৈরি ও
                  {"\n"}publish করুন
                </Text>
                <Text style={styles.heroText}>
                  প্রশ্ন, options, correct answer ও
                  hint এক জায়গা থেকে manage করুন।
                </Text>
              </View>

              <View style={styles.heroIconCircle}>
                <Text style={styles.heroIcon}>❓</Text>
              </View>

              <Pressable
                onPress={openCreate}
                style={({ pressed }) => [
                  styles.createButton,
                  pressed && styles.createPressed,
                ]}
              >
                <Text style={styles.createIcon}>＋</Text>
                <Text style={styles.createText}>
                  New Question
                </Text>
              </Pressable>
            </View>

            {activityId ? (
              <View style={styles.linkCard}>
                <Text style={styles.linkIcon}>🔗</Text>
                <View style={styles.linkCopy}>
                  <Text style={styles.linkTitle}>
                    Linked Quiz Activity
                  </Text>
                  <Text style={styles.linkText}>
                    নতুন questionগুলো এই multiple-choice
                    activity-এর সঙ্গে link হবে।
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.warningCard}>
                <Text style={styles.warningIcon}>ℹ️</Text>
                <Text style={styles.warningText}>
                  এই screen chapter-level questions দেখাচ্ছে।
                  নির্দিষ্ট activity-এর Quiz button থেকে খুললে
                  question activity_id-এর সঙ্গে link হবে।
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <SummaryCard
                icon="❓"
                value={visibleQuestions.length}
                label="All questions"
                backgroundColor="#EEE6FF"
              />
              <SummaryCard
                icon="✅"
                value={publishedCount}
                label="Published"
                backgroundColor="#E3F5DF"
              />
              <SummaryCard
                icon="🎯"
                value={validPublishedCount}
                label="Student-ready"
                backgroundColor="#FFF1C9"
              />
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  QUESTION BANK
                </Text>
                <Text style={styles.sectionTitle}>
                  Quiz Questions
                </Text>
              </View>

              <Pressable
                onPress={openCreate}
                style={styles.smallAddButton}
              >
                <Text style={styles.smallAddText}>
                  ＋ Add
                </Text>
              </Pressable>
            </View>

            <View style={styles.questionList}>
              {visibleQuestions.map(
                (question, questionIndex) => {
                  const correctIndex =
                    question.options.findIndex(
                      (option) =>
                        option.isCorrect,
                    );

                  return (
                    <View
                      key={question.id}
                      style={styles.questionCard}
                    >
                      <View style={styles.questionTop}>
                        <View style={styles.orderCircle}>
                          <Text style={styles.orderText}>
                            {question.order_index}
                          </Text>
                        </View>

                        <View style={styles.questionCopy}>
                          <Text
                            style={styles.questionTitle}
                            numberOfLines={3}
                          >
                            {question.question_bn}
                          </Text>
                          <Text style={styles.questionMeta}>
                            Question {questionIndex + 1} · {question.options.length} options
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            question.status ===
                              "published"
                              ? styles.statusPublished
                              : question.status ===
                                  "archived"
                                ? styles.statusArchived
                                : styles.statusDraft,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              question.status ===
                                "published"
                                ? styles.statusTextPublished
                                : question.status ===
                                    "archived"
                                  ? styles.statusTextArchived
                                  : styles.statusTextDraft,
                            ]}
                          >
                            {statusLabel(
                              question.status,
                            )}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.optionsPreview}>
                        {question.options.map(
                          (option, index) => (
                            <View
                              key={`${question.id}-${index}`}
                              style={[
                                styles.previewOption,
                                option.isCorrect &&
                                  styles.previewOptionCorrect,
                              ]}
                            >
                              <View
                                style={[
                                  styles.previewLetter,
                                  option.isCorrect &&
                                    styles.previewLetterCorrect,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.previewLetterText,
                                    option.isCorrect &&
                                      styles.previewLetterTextCorrect,
                                  ]}
                                >
                                  {optionLetter(index)}
                                </Text>
                              </View>

                              <Text
                                style={styles.previewOptionText}
                                numberOfLines={1}
                              >
                                {option.labelBn}
                              </Text>

                              {option.isCorrect ? (
                                <Text style={styles.correctMark}>
                                  ✓
                                </Text>
                              ) : null}
                            </View>
                          ),
                        )}
                      </View>

                      <View style={styles.answerLine}>
                        <Text style={styles.answerLabel}>
                          Correct answer:
                        </Text>
                        <Text style={styles.answerValue}>
                          {correctIndex >= 0
                            ? `${optionLetter(correctIndex)} · ${question.options[correctIndex]?.labelBn}`
                            : "Not selected"}
                        </Text>
                      </View>

                      {question.explanation_bn ? (
                        <View style={styles.hintPreview}>
                          <Text style={styles.hintIcon}>💡</Text>
                          <Text
                            style={styles.hintText}
                            numberOfLines={2}
                          >
                            {question.explanation_bn}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.questionActions}>
                        <Pressable
                          onPress={() => openEdit(question)}
                          style={({ pressed }) => [
                            styles.editButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.editText}>
                            Edit
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => toggleStatus(question)}
                          style={({ pressed }) => [
                            styles.publishButton,
                            question.status ===
                              "published" &&
                              styles.unpublishButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.publishText,
                              question.status ===
                                "published" &&
                                styles.unpublishText,
                            ]}
                          >
                            {question.status ===
                            "published"
                              ? "Unpublish"
                              : "Publish"}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            deleteQuestion(question)
                          }
                          style={({ pressed }) => [
                            styles.deleteButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.deleteText}>
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                },
              )}
            </View>

            {visibleQuestions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>❓</Text>
                <Text style={styles.emptyTitle}>
                  কোনো quiz question নেই
                </Text>
                <Text style={styles.emptyText}>
                  প্রথম question তৈরি করে draft হিসেবে
                  save করুন।
                </Text>
                <Pressable
                  onPress={openCreate}
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>
                    New Question
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <QuestionFormModal
          visible={formVisible}
          form={form}
          saving={saving}
          onChange={setForm}
          onUpdateOption={updateOption}
          onSetCorrect={setCorrectOption}
          onAddOption={addOption}
          onRemoveOption={removeOption}
          onClose={() => {
            if (!saving) {
              setFormVisible(false);
            }
          }}
          onSave={() => void saveQuestion()}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  backgroundColor,
}: {
  icon: string;
  value: number;
  label: string;
  backgroundColor: string;
}) {
  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor },
      ]}
    >
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function QuestionFormModal({
  visible,
  form,
  saving,
  onChange,
  onUpdateOption,
  onSetCorrect,
  onAddOption,
  onRemoveOption,
  onClose,
  onSave,
}: {
  visible: boolean;
  form: QuestionForm;
  saving: boolean;
  onChange: (form: QuestionForm) => void;
  onUpdateOption: (
    index: number,
    patch: Partial<OptionForm>,
  ) => void;
  onSetCorrect: (index: number) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  QUESTION FORM
                </Text>
                <Text style={styles.modalTitle}>
                  {form.id
                    ? "Question Edit"
                    : "New Question"}
                </Text>
              </View>

              <Pressable
                disabled={saving}
                onPress={onClose}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>
                  ×
                </Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            >
              <Text style={styles.fieldLabel}>
                Order index
              </Text>
              <TextInput
                value={form.orderIndex}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    orderIndex: value.replace(
                      /[^0-9]/g,
                      "",
                    ),
                  })
                }
                keyboardType="number-pad"
                style={styles.fieldInput}
              />

              <Text style={styles.fieldLabel}>
                বাংলা question *
              </Text>
              <TextInput
                value={form.questionBn}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    questionBn: value,
                  })
                }
                multiline
                placeholder="যেমন: কোনটি আম?"
                placeholderTextColor="#A7A0AA"
                style={[
                  styles.fieldInput,
                  styles.questionInput,
                ]}
              />

              <Text style={styles.fieldLabel}>
                English question
              </Text>
              <TextInput
                value={form.questionEn}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    questionEn: value,
                  })
                }
                multiline
                placeholder="Optional"
                placeholderTextColor="#A7A0AA"
                style={[
                  styles.fieldInput,
                  styles.questionInput,
                ]}
              />

              <Text style={styles.fieldLabel}>
                Question image URL
              </Text>
              <TextInput
                value={form.imageUrl}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    imageUrl: value,
                  })
                }
                autoCapitalize="none"
                placeholder="https://..."
                placeholderTextColor="#A7A0AA"
                style={styles.fieldInput}
              />

              <View style={styles.optionSectionHeader}>
                <View>
                  <Text style={styles.fieldLabelNoMargin}>
                    Answer options *
                  </Text>
                  <Text style={styles.optionHelp}>
                    Correct button দিয়ে সঠিক উত্তর নির্বাচন করুন
                  </Text>
                </View>

                <Pressable
                  onPress={onAddOption}
                  style={styles.addOptionButton}
                >
                  <Text style={styles.addOptionText}>
                    ＋ Option
                  </Text>
                </Pressable>
              </View>

              <View style={styles.formOptionList}>
                {form.options.map((option, index) => (
                  <View
                    key={`form-option-${index}`}
                    style={[
                      styles.formOptionCard,
                      option.isCorrect &&
                        styles.formOptionCorrect,
                    ]}
                  >
                    <View style={styles.formOptionTop}>
                      <View
                        style={[
                          styles.formOptionLetter,
                          option.isCorrect &&
                            styles.formOptionLetterCorrect,
                        ]}
                      >
                        <Text
                          style={[
                            styles.formOptionLetterText,
                            option.isCorrect &&
                              styles.formOptionLetterTextCorrect,
                          ]}
                        >
                          {optionLetter(index)}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() =>
                          onSetCorrect(index)
                        }
                        style={[
                          styles.correctButton,
                          option.isCorrect &&
                            styles.correctButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.correctButtonText,
                            option.isCorrect &&
                              styles.correctButtonTextActive,
                          ]}
                        >
                          {option.isCorrect
                            ? "✓ Correct"
                            : "Set correct"}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          onRemoveOption(index)
                        }
                        style={styles.removeOptionButton}
                      >
                        <Text style={styles.removeOptionText}>
                          ×
                        </Text>
                      </Pressable>
                    </View>

                    <TextInput
                      value={option.labelBn}
                      onChangeText={(value) =>
                        onUpdateOption(index, {
                          labelBn: value,
                        })
                      }
                      placeholder="বাংলা option"
                      placeholderTextColor="#A7A0AA"
                      style={styles.optionInput}
                    />

                    <TextInput
                      value={option.labelEn}
                      onChangeText={(value) =>
                        onUpdateOption(index, {
                          labelEn: value,
                        })
                      }
                      placeholder="English option (optional)"
                      placeholderTextColor="#A7A0AA"
                      style={styles.optionInput}
                    />

                    <TextInput
                      value={option.imageUrl}
                      onChangeText={(value) =>
                        onUpdateOption(index, {
                          imageUrl: value,
                        })
                      }
                      autoCapitalize="none"
                      placeholder="Option image URL (optional)"
                      placeholderTextColor="#A7A0AA"
                      style={styles.optionInput}
                    />
                  </View>
                ))}
              </View>

              <Text style={styles.fieldLabel}>
                বাংলা hint / explanation
              </Text>
              <TextInput
                value={form.explanationBn}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    explanationBn: value,
                  })
                }
                multiline
                placeholder="ভুল হলে যে hint দেখাবে"
                placeholderTextColor="#A7A0AA"
                style={[
                  styles.fieldInput,
                  styles.explanationInput,
                ]}
              />

              <Text style={styles.fieldLabel}>
                Status
              </Text>
              <View style={styles.statusChoiceRow}>
                {STATUSES.map((status) => (
                  <Pressable
                    key={status}
                    onPress={() =>
                      onChange({
                        ...form,
                        status,
                      })
                    }
                    style={[
                      styles.choiceChip,
                      form.status === status &&
                        styles.choiceChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        form.status === status &&
                          styles.choiceChipTextActive,
                      ]}
                    >
                      {statusLabel(status)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                disabled={saving}
                onPress={onClose}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={saving}
                onPress={onSave}
                style={[
                  styles.modalSaveButton,
                  saving && styles.modalSaveDisabled,
                ]}
              >
                <Text style={styles.modalSaveText}>
                  {saving
                    ? "Saving..."
                    : "Save Question"}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F2F8",
  },
  page: {
    flex: 1,
    backgroundColor: "#F5F2F8",
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 30,
  },
  shell: {
    width: "100%",
    alignSelf: "center",
  },
  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
  },
  backIcon: {
    marginTop: -4,
    fontSize: 32,
    color: "#332645",
  },
  headerCopy: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 9,
  },
  headerEyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: "900",
    color: "#91869A",
  },
  headerTitle: {
    maxWidth: "100%",
    marginTop: 2,
    fontSize: 17,
    fontWeight: "900",
    color: "#2B2038",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: "#7E7385",
  },
  addHeaderButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#2A2035",
  },
  addHeaderText: {
    fontSize: 23,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: 238,
    padding: 23,
    borderRadius: 30,
    backgroundColor: "#E8DDF8",
  },
  heroOrbOne: {
    position: "absolute",
    top: -80,
    right: -65,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  heroOrbTwo: {
    position: "absolute",
    left: -70,
    bottom: -92,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(205,180,241,0.52)",
  },
  heroCopy: {
    zIndex: 2,
    width: "66%",
  },
  heroEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#6E5687",
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "900",
    color: "#2B2038",
  },
  heroTitleTablet: {
    fontSize: 39,
    lineHeight: 46,
  },
  heroText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#735F80",
  },
  heroIconCircle: {
    position: "absolute",
    right: 25,
    top: 29,
    width: 103,
    height: 103,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 52,
    backgroundColor: "#FFFFFF",
  },
  heroIcon: {
    fontSize: 48,
  },
  createButton: {
    position: "absolute",
    left: 23,
    bottom: 21,
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingRight: 17,
    borderRadius: 26,
    backgroundColor: "#2A2035",
  },
  createPressed: {
    transform: [{ translateY: 2 }],
  },
  createIcon: {
    width: 37,
    height: 37,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 19,
    backgroundColor: "#A879D6",
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  createText: {
    marginLeft: 9,
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    borderRadius: 19,
    backgroundColor: "#E2F3FF",
  },
  linkIcon: {
    fontSize: 23,
  },
  linkCopy: {
    flex: 1,
    marginLeft: 10,
  },
  linkTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#276D96",
  },
  linkText: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#55798D",
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    padding: 12,
    borderRadius: 19,
    backgroundColor: "#FFF2CC",
  },
  warningIcon: {
    fontSize: 21,
  },
  warningText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#715D2E",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 13,
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 21,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "900",
    color: "#2D2339",
  },
  summaryLabel: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: "800",
    color: "#766C7B",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 23,
    marginBottom: 12,
  },
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#938A99",
  },
  sectionTitle: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: "900",
    color: "#2B2038",
  },
  smallAddButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 17,
    backgroundColor: "#2A2035",
  },
  smallAddText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  questionList: {
    gap: 11,
  },
  questionCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#E1DAE6",
    borderBottomWidth: 5,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  questionTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderCircle: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#EEE6FF",
  },
  orderText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#7653B4",
  },
  questionCopy: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },
  questionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#30263B",
  },
  questionMeta: {
    marginTop: 3,
    fontSize: 8,
    fontWeight: "800",
    color: "#807686",
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusPublished: {
    backgroundColor: "#E1F5DD",
  },
  statusDraft: {
    backgroundColor: "#FFF1C9",
  },
  statusArchived: {
    backgroundColor: "#E7E9EB",
  },
  statusText: {
    fontSize: 8,
    fontWeight: "900",
  },
  statusTextPublished: {
    color: "#3F8F39",
  },
  statusTextDraft: {
    color: "#A36D00",
  },
  statusTextArchived: {
    color: "#68717A",
  },
  optionsPreview: {
    gap: 7,
    marginTop: 12,
  },
  previewOption: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E4DFE7",
    borderRadius: 17,
    backgroundColor: "#FAF9FB",
  },
  previewOptionCorrect: {
    borderColor: "#68BC5F",
    backgroundColor: "#EBF8E8",
  },
  previewLetter: {
    width: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#EEEAF0",
  },
  previewLetterCorrect: {
    backgroundColor: "#58AA50",
  },
  previewLetterText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#6E6374",
  },
  previewLetterTextCorrect: {
    color: "#FFFFFF",
  },
  previewOptionText: {
    flex: 1,
    marginHorizontal: 9,
    fontSize: 11,
    fontWeight: "800",
    color: "#3C3342",
  },
  correctMark: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4F9C48",
  },
  answerLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#F1ECFA",
  },
  answerLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#71637E",
  },
  answerValue: {
    flex: 1,
    marginLeft: 7,
    fontSize: 10,
    fontWeight: "900",
    color: "#5D4282",
  },
  hintPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 9,
    borderRadius: 16,
    backgroundColor: "#FFF3D0",
  },
  hintIcon: {
    fontSize: 18,
  },
  hintText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#705D30",
  },
  questionActions: {
    flexDirection: "row",
    gap: 7,
    marginTop: 11,
  },
  editButton: {
    flex: 1,
    minHeight: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#EEE6FF",
  },
  editText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#6C4BA7",
  },
  publishButton: {
    flex: 1.2,
    minHeight: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#3F8F39",
  },
  unpublishButton: {
    backgroundColor: "#FFF0C7",
  },
  publishText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  unpublishText: {
    color: "#9B6800",
  },
  deleteButton: {
    minWidth: 66,
    minHeight: 39,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "#FFE7E7",
  },
  deleteText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#B84C4C",
  },
  emptyCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "#30263B",
  },
  emptyText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#7B7180",
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 13,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#2A2035",
  },
  emptyButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "900",
    color: "#30263B",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(30,18,42,0.48)",
  },
  modalSafe: {
    maxHeight: "96%",
  },
  modalCard: {
    maxHeight: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECE7EF",
  },
  modalEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#958B9C",
  },
  modalTitle: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: "#2B2038",
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#F2EFF4",
  },
  modalCloseText: {
    marginTop: -3,
    fontSize: 27,
    color: "#5A4F61",
  },
  modalContent: {
    padding: 18,
    paddingBottom: 24,
  },
  fieldLabel: {
    marginTop: 12,
    marginBottom: 7,
    marginLeft: 3,
    fontSize: 10,
    fontWeight: "900",
    color: "#62586A",
  },
  fieldLabelNoMargin: {
    fontSize: 10,
    fontWeight: "900",
    color: "#62586A",
  },
  fieldInput: {
    minHeight: 52,
    paddingHorizontal: 13,
    borderWidth: 2,
    borderColor: "#E1DBE5",
    borderRadius: 17,
    backgroundColor: "#FAF9FB",
    fontSize: 14,
    fontWeight: "700",
    color: "#30263B",
  },
  questionInput: {
    minHeight: 84,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  explanationInput: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  optionSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 17,
    marginBottom: 8,
  },
  optionHelp: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "700",
    color: "#8A808E",
  },
  addOptionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#2A2035",
  },
  addOptionText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  formOptionList: {
    gap: 10,
  },
  formOptionCard: {
    padding: 11,
    borderWidth: 2,
    borderColor: "#E4DFE7",
    borderRadius: 20,
    backgroundColor: "#FAF9FB",
  },
  formOptionCorrect: {
    borderColor: "#62B659",
    backgroundColor: "#F1FBEF",
  },
  formOptionTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  formOptionLetter: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#ECE7EF",
  },
  formOptionLetterCorrect: {
    backgroundColor: "#58AA50",
  },
  formOptionLetterText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#736879",
  },
  formOptionLetterTextCorrect: {
    color: "#FFFFFF",
  },
  correctButton: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#D9D2DD",
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
  },
  correctButtonActive: {
    borderColor: "#58AA50",
    backgroundColor: "#DFF4DB",
  },
  correctButtonText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#7C7181",
  },
  correctButtonTextActive: {
    color: "#408B39",
  },
  removeOptionButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#FFE6E6",
  },
  removeOptionText: {
    marginTop: -2,
    fontSize: 21,
    color: "#B64D4D",
  },
  optionInput: {
    minHeight: 45,
    marginTop: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#E2DCE5",
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    color: "#342A3C",
  },
  statusChoiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#DED7E2",
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
  },
  choiceChipActive: {
    borderColor: "#7653B4",
    backgroundColor: "#7653B4",
  },
  choiceChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#746A79",
  },
  choiceChipTextActive: {
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 9,
    padding: 13,
    borderTopWidth: 1,
    borderTopColor: "#ECE7EF",
    backgroundColor: "#FFFFFF",
  },
  modalCancelButton: {
    width: 105,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#DED7E2",
    borderRadius: 26,
  },
  modalCancelText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6D6372",
  },
  modalSaveButton: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#2A2035",
  },
  modalSaveDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
