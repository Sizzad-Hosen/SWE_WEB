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
import type {
  PublicationStatus,
  SupabaseActivityType,
} from "../../learning/types/supabaseCurriculum";
import {
  adminService,
  type AdminActivity,
  type AdminUser,
} from "../services/adminService";

const ACTIVITY_TYPES: SupabaseActivityType[] = [
  "story_snippet",
  "snippet",
  "letter",
  "tap",
  "word_build",
  "picture_choice",
  "flashcard",
  "matching",
  "drag_game",
  "audio_lesson",
  "image_lesson",
  "video_lesson",
  "multiple_choice",
];

const STATUSES: PublicationStatus[] = [
  "draft",
  "published",
  "archived",
];

type ActivityForm = {
  id?: string;
  orderIndex: string;
  activityType: SupabaseActivityType;
  titleBn: string;
  titleEn: string;
  instructionBn: string;
  instructionEn: string;
  payloadText: string;
  status: PublicationStatus;
};

function makeTemplate(
  type: SupabaseActivityType,
): Record<string, unknown> {
  switch (type) {
    case "story_snippet":
      return {
        schema_version: 1,
        reward_xp: 10,
        kind: "guided_story",
        slides: [
          {
            id: "slide-1",
            emoji: "👧",
            text_bn: "এখানে গল্পের প্রথম লাইন লিখুন।",
            speech_bn:
              "এখানে voice text লিখুন।",
          },
        ],
      };

    case "snippet":
      return {
        schema_version: 1,
        reward_xp: 10,
        imageEmoji: "📖",
        lines: [
          "প্রথম লাইন",
          "দ্বিতীয় লাইন",
        ],
      };

    case "letter":
      return {
        schema_version: 1,
        reward_xp: 10,
        letter: "আ",
        sound: "আ",
        examples: [
          {
            emoji: "🥭",
            word_bn: "আম",
          },
        ],
      };

    case "tap":
      return {
        schema_version: 1,
        reward_xp: 10,
        prompt: "ছবিতে চাপ দাও",
        items: [
          {
            id: "item-1",
            emoji: "📚",
            label_bn: "বই",
            description_bn: "এটি একটি বই।",
          },
        ],
      };

    case "word_build":
      return {
        schema_version: 1,
        reward_xp: 10,
        letters: ["আ", "ম"],
        answer: "আম",
      };

    case "picture_choice":
      return {
        schema_version: 1,
        reward_xp: 10,
        question: "সঠিক ছবিটি বেছে নাও",
        options: [
          {
            emoji: "🥭",
            label_bn: "আম",
          },
          {
            emoji: "🍌",
            label_bn: "কলা",
          },
        ],
        answer: 0,
      };

    case "flashcard":
      return {
        schema_version: 1,
        reward_xp: 10,
        audio_source: "device_tts",
        locale: "bn-BD",
        cards: [
          {
            id: "card-1",
            word_bn: "বই",
            emoji: "📚",
            speech_bn: "বই",
          },
        ],
      };

    case "matching":
      return {
        schema_version: 1,
        reward_xp: 10,
        shuffle: true,
        pairs: [
          {
            id: "pair-1",
            word_bn: "আম",
            emoji: "🥭",
          },
        ],
      };

    case "drag_game":
      return {
        schema_version: 1,
        reward_xp: 10,
        prompt: "সঠিক ঘরে নিয়ে যাও",
        items: [
          {
            emoji: "🥭",
            label_bn: "আম",
            target: "ফল",
          },
        ],
      };

    case "audio_lesson":
      return {
        schema_version: 1,
        reward_xp: 10,
        mode: "listen_repeat",
        audio_source: "device_tts",
        locale: "bn-BD",
        items: [
          {
            id: "audio-1",
            text_bn: "আমি স্কুলে যাই।",
            emoji: "🏫",
          },
        ],
      };

    case "image_lesson":
      return {
        schema_version: 1,
        reward_xp: 10,
        image_url: "",
        allow_zoom: true,
        source_label: "NCTB",
      };

    case "video_lesson":
      return {
        schema_version: 1,
        reward_xp: 10,
        video_url: "",
        autoplay: false,
      };

    case "multiple_choice":
      return {
        schema_version: 1,
        reward_xp: 10,
        question_source: "quiz_questions",
        shuffle_questions: false,
        pass_score_percent: 60,
      };

    default:
      return {
        schema_version: 1,
        reward_xp: 10,
      };
  }
}

function emptyForm(
  orderIndex: number,
): ActivityForm {
  const activityType: SupabaseActivityType =
    "story_snippet";

  return {
    orderIndex: String(orderIndex),
    activityType,
    titleBn: "",
    titleEn: "",
    instructionBn: "",
    instructionEn: "",
    payloadText: JSON.stringify(
      makeTemplate(activityType),
      null,
      2,
    ),
    status: "draft",
  };
}

function typeLabel(type: SupabaseActivityType) {
  return type
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
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

export default function AdminContentEditorScreen({
  navigation,
  route,
}: ScreenProps<"AdminContentEditor">) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 700;
  const maxWidth = isTablet ? 980 : 720;

  const { chapterId, chapterTitle } =
    route.params;

  const [admin, setAdmin] =
    useState<AdminUser | null>(null);
  const [activities, setActivities] =
    useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] =
    useState(false);
  const [formVisible, setFormVisible] =
    useState(false);
  const [form, setForm] = useState<ActivityForm>(
    emptyForm(1),
  );

  const loadActivities = useCallback(async () => {
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
        await adminService.listActivities(
          chapterId,
        );

      setActivities(rows);
    } catch (error) {
      Alert.alert(
        "Activities লোড হয়নি",
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
      void loadActivities();
    }, [loadActivities]),
  );

  const publishedCount = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.status === "published",
      ).length,
    [activities],
  );

  const nextOrderIndex =
    activities.length > 0
      ? Math.max(
          ...activities.map(
            (activity) =>
              activity.order_index,
          ),
        ) + 1
      : 1;

  const openCreate = () => {
    setForm(emptyForm(nextOrderIndex));
    setFormVisible(true);
  };

  const openEdit = (activity: AdminActivity) => {
    setForm({
      id: activity.id,
      orderIndex: String(
        activity.order_index,
      ),
      activityType:
        activity.activity_type,
      titleBn: activity.title_bn ?? "",
      titleEn: activity.title_en ?? "",
      instructionBn:
        activity.instruction_bn ?? "",
      instructionEn:
        activity.instruction_en ?? "",
      payloadText: JSON.stringify(
        activity.payload,
        null,
        2,
      ),
      status: activity.status,
    });
    setFormVisible(true);
  };

  const changeType = (
    type: SupabaseActivityType,
  ) => {
    setForm((current) => ({
      ...current,
      activityType: type,
      payloadText: JSON.stringify(
        makeTemplate(type),
        null,
        2,
      ),
    }));
  };

  const saveActivity = async () => {
    const orderIndex = Number(
      form.orderIndex,
    );

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

    let payload: Record<string, unknown>;

    try {
      const parsed = JSON.parse(
        form.payloadText,
      ) as unknown;

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error();
      }

      payload = parsed as Record<
        string,
        unknown
      >;
    } catch {
      Alert.alert(
        "Payload JSON সঠিক নয়",
        "Valid JSON object লিখুন।",
      );
      return;
    }

    if (
      typeof payload.schema_version !==
      "number"
    ) {
      Alert.alert(
        "schema_version প্রয়োজন",
        "Payload-এর মধ্যে numeric schema_version রাখুন।",
      );
      return;
    }

    if (
      form.activityType ===
        "multiple_choice" &&
      form.status === "published"
    ) {
      if (!form.id) {
        Alert.alert(
          "আগে Draft save করুন",
          "প্রথমে multiple_choice activity Draft হিসেবে save করুন। তারপর Quiz Questions যোগ করে Publish করুন।",
        );
        return;
      }

      try {
        const hasQuestions =
          await adminService.hasPublishedQuizQuestions(
            chapterId,
            form.id,
          );

        if (!hasQuestions) {
          Alert.alert(
            "Published quiz প্রয়োজন",
            "এই activity-এর জন্য অন্তত একটি published question এবং correct option যোগ করুন।",
          );
          return;
        }
      } catch (error) {
        Alert.alert(
          "Quiz যাচাই হয়নি",
          error instanceof Error
            ? error.message
            : "আবার চেষ্টা করুন।",
        );
        return;
      }
    }

    setSaving(true);

    try {
      await adminService.saveActivity({
        id: form.id,
        chapterId,
        orderIndex,
        activityType:
          form.activityType,
        titleBn: form.titleBn,
        titleEn: form.titleEn,
        instructionBn:
          form.instructionBn,
        instructionEn:
          form.instructionEn,
        payload,
        status: form.status,
      });

      setFormVisible(false);
      await loadActivities();
    } catch (error) {
      Alert.alert(
        "Activity save হয়নি",
        error instanceof Error
          ? error.message
          : "আবার চেষ্টা করুন।",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (
    activity: AdminActivity,
  ) => {
    const nextStatus: PublicationStatus =
      activity.status === "published"
        ? "draft"
        : "published";

    Alert.alert(
      "Status পরিবর্তন",
      `${typeLabel(
        activity.activity_type,
      )} ${
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
                if (
                  activity.activity_type ===
                    "multiple_choice" &&
                  nextStatus === "published"
                ) {
                  const hasQuestions =
                    await adminService.hasPublishedQuizQuestions(
                      chapterId,
                      activity.id,
                    );

                  if (!hasQuestions) {
                    Alert.alert(
                      "Published quiz প্রয়োজন",
                      "এই activity-এর জন্য অন্তত একটি published question এবং correct option যোগ করুন।",
                    );
                    return;
                  }
                }

                await adminService.setActivityStatus(
                  activity.id,
                  nextStatus,
                );
                await loadActivities();
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

  const deleteActivity = (
    activity: AdminActivity,
  ) => {
    Alert.alert(
      "Activity delete করবেন?",
      "এই কাজটি undo করা যাবে না।",
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
                await adminService.deleteActivity(
                  activity.id,
                );
                await loadActivities();
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
            color="#2D6B9C"
          />
          <Text style={styles.centerTitle}>
            Activities লোড হচ্ছে...
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
                <Text style={styles.backIcon}>
                  ‹
                </Text>
              </Pressable>

              <View style={styles.headerCopy}>
                <Text style={styles.headerEyebrow}>
                  CONTENT EDITOR
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
                <Text
                  style={styles.addHeaderText}
                >
                  ＋
                </Text>
              </Pressable>
            </View>

            <View style={styles.hero}>
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>
                  LESSON ACTIVITIES
                </Text>
                <Text
                  style={[
                    styles.heroTitle,
                    isTablet &&
                      styles.heroTitleTablet,
                  ]}
                >
                  Activity তৈরি
                  {"\n"}ও publish করুন
                </Text>
                <Text style={styles.heroText}>
                  Payload JSON database-driven
                  component-এ সরাসরি যাবে।
                </Text>
              </View>

              <View style={styles.heroIconCircle}>
                <Text style={styles.heroIcon}>
                  🧩
                </Text>
              </View>

              <Pressable
                onPress={openCreate}
                style={({ pressed }) => [
                  styles.createButton,
                  pressed &&
                    styles.createButtonPressed,
                ]}
              >
                <Text style={styles.createIcon}>
                  ＋
                </Text>
                <Text style={styles.createText}>
                  New Activity
                </Text>
              </Pressable>
            </View>

            <View style={styles.summaryRow}>
              <SummaryCard
                icon="🧩"
                value={activities.length}
                label="All activities"
                backgroundColor="#E5F2FC"
              />
              <SummaryCard
                icon="✅"
                value={publishedCount}
                label="Published"
                backgroundColor="#E3F5DF"
              />
              <SummaryCard
                icon="📝"
                value={
                  activities.length -
                  publishedCount
                }
                label="Not published"
                backgroundColor="#FFF1C9"
              />
            </View>

            <View style={styles.noticeCard}>
              <Text style={styles.noticeIcon}>
                ℹ️
              </Text>
              <Text style={styles.noticeText}>
                প্রতিটি activity-এর order_index
                unique রাখুন। Chapter student app-এ
                দেখাতে অন্তত একটি published activity
                প্রয়োজন।
              </Text>
            </View>

            <Pressable
              onPress={() =>
                navigation.navigate(
                  "AdminQuizEditor",
                  {
                    chapterId,
                    chapterTitle,
                  },
                )
              }
              style={({ pressed }) => [
                styles.quizBankButton,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.quizBankIconCircle}>
                <Text style={styles.quizBankIcon}>❓</Text>
              </View>
              <View style={styles.quizBankCopy}>
                <Text style={styles.quizBankTitle}>
                  Quiz Questions & Options
                </Text>
                <Text style={styles.quizBankText}>
                  Chapter-এর question bank manage করুন
                </Text>
              </View>
              <Text style={styles.quizBankArrow}>›</Text>
            </Pressable>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  CHAPTER CONTENT
                </Text>
                <Text style={styles.sectionTitle}>
                  Activity List
                </Text>
              </View>

              <Pressable
                onPress={openCreate}
                style={styles.smallAddButton}
              >
                <Text
                  style={styles.smallAddText}
                >
                  ＋ Add
                </Text>
              </Pressable>
            </View>

            <View style={styles.activityList}>
              {activities.map((activity) => (
                <View
                  key={activity.id}
                  style={styles.activityCard}
                >
                  <View style={styles.activityTop}>
                    <View style={styles.orderCircle}>
                      <Text
                        style={styles.orderText}
                      >
                        {activity.order_index}
                      </Text>
                    </View>

                    <View style={styles.activityCopy}>
                      <Text
                        style={styles.activityTitle}
                        numberOfLines={2}
                      >
                        {activity.title_bn ||
                          typeLabel(
                            activity.activity_type,
                          )}
                      </Text>

                      <Text
                        style={styles.activityType}
                      >
                        {typeLabel(
                          activity.activity_type,
                        )}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        activity.status ===
                          "published"
                          ? styles.statusPublished
                          : activity.status ===
                              "archived"
                            ? styles.statusArchived
                            : styles.statusDraft,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          activity.status ===
                            "published"
                            ? styles.statusTextPublished
                            : activity.status ===
                                "archived"
                              ? styles.statusTextArchived
                              : styles.statusTextDraft,
                        ]}
                      >
                        {statusLabel(
                          activity.status,
                        )}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={styles.instruction}
                    numberOfLines={2}
                  >
                    {activity.instruction_bn ||
                      "কোনো instruction যোগ করা হয়নি।"}
                  </Text>

                  <View style={styles.payloadPreview}>
                    <Text
                      style={styles.payloadLabel}
                    >
                      PAYLOAD
                    </Text>
                    <Text
                      style={styles.payloadText}
                      numberOfLines={3}
                    >
                      {JSON.stringify(
                        activity.payload,
                      )}
                    </Text>
                  </View>

                  {activity.activity_type ===
                  "multiple_choice" ? (
                    <Pressable
                      onPress={() =>
                        navigation.navigate(
                          "AdminQuizEditor",
                          {
                            chapterId,
                            chapterTitle,
                            activityId: activity.id,
                          },
                        )
                      }
                      style={({ pressed }) => [
                        styles.activityQuizButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={styles.activityQuizIcon}
                      >
                        ❓
                      </Text>
                      <Text
                        style={styles.activityQuizText}
                      >
                        Quiz Questions manage করুন
                      </Text>
                      <Text
                        style={styles.activityQuizArrow}
                      >
                        ›
                      </Text>
                    </Pressable>
                  ) : null}

                  <View style={styles.activityActions}>
                    <Pressable
                      onPress={() =>
                        openEdit(activity)
                      }
                      style={({ pressed }) => [
                        styles.editButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={styles.editButtonText}
                      >
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        toggleStatus(activity)
                      }
                      style={({ pressed }) => [
                        styles.publishButton,
                        activity.status ===
                          "published" &&
                          styles.unpublishButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.publishText,
                          activity.status ===
                            "published" &&
                            styles.unpublishText,
                        ]}
                      >
                        {activity.status ===
                        "published"
                          ? "Unpublish"
                          : "Publish"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        deleteActivity(activity)
                      }
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={styles.deleteText}
                      >
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {activities.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>
                  🧩
                </Text>
                <Text style={styles.emptyTitle}>
                  কোনো activity নেই
                </Text>
                <Text style={styles.emptyText}>
                  প্রথম activity তৈরি করে draft
                  হিসেবে save করুন।
                </Text>

                <Pressable
                  onPress={openCreate}
                  style={styles.emptyButton}
                >
                  <Text
                    style={styles.emptyButtonText}
                  >
                    New Activity
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <ActivityFormModal
          visible={formVisible}
          form={form}
          saving={saving}
          onChange={setForm}
          onChangeType={changeType}
          onClose={() => {
            if (!saving) {
              setFormVisible(false);
            }
          }}
          onSave={() =>
            void saveActivity()
          }
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
      <Text style={styles.summaryIcon}>
        {icon}
      </Text>
      <Text style={styles.summaryValue}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function ActivityFormModal({
  visible,
  form,
  saving,
  onChange,
  onChangeType,
  onClose,
  onSave,
}: {
  visible: boolean;
  form: ActivityForm;
  saving: boolean;
  onChange: (form: ActivityForm) => void;
  onChangeType: (
    type: SupabaseActivityType,
  ) => void;
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
                  ACTIVITY FORM
                </Text>
                <Text style={styles.modalTitle}>
                  {form.id
                    ? "Activity Edit"
                    : "New Activity"}
                </Text>
              </View>

              <Pressable
                disabled={saving}
                onPress={onClose}
                style={styles.modalClose}
              >
                <Text
                  style={styles.modalCloseText}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.modalContent
              }
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
                Activity type
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.typeRow
                }
              >
                {ACTIVITY_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() =>
                      onChangeType(type)
                    }
                    style={[
                      styles.typeChip,
                      form.activityType === type &&
                        styles.typeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        form.activityType ===
                          type &&
                          styles.typeChipTextActive,
                      ]}
                    >
                      {typeLabel(type)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>
                বাংলা title
              </Text>
              <TextInput
                value={form.titleBn}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    titleBn: value,
                  })
                }
                placeholder="যেমন: অক্ষর শিখি"
                placeholderTextColor="#A7A0AA"
                style={styles.fieldInput}
              />

              <Text style={styles.fieldLabel}>
                বাংলা instruction
              </Text>
              <TextInput
                value={form.instructionBn}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    instructionBn: value,
                  })
                }
                multiline
                placeholder="শিশুকে কী করতে হবে"
                placeholderTextColor="#A7A0AA"
                style={[
                  styles.fieldInput,
                  styles.smallTextArea,
                ]}
              />

              <Text style={styles.fieldLabel}>
                Payload JSON *
              </Text>

              <TextInput
                value={form.payloadText}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    payloadText: value,
                  })
                }
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                textAlignVertical="top"
                style={[
                  styles.fieldInput,
                  styles.jsonInput,
                ]}
              />

              <View style={styles.jsonNote}>
                <Text style={styles.jsonNoteIcon}>
                  ℹ️
                </Text>
                <Text
                  style={styles.jsonNoteText}
                >
                  Type পরিবর্তন করলে matching
                  template বসবে। Existing payload
                  overwrite হওয়ার আগে edit data
                  প্রয়োজন হলে copy রাখুন।
                </Text>
              </View>

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
                <Text
                  style={styles.modalCancelText}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={saving}
                onPress={onSave}
                style={[
                  styles.modalSaveButton,
                  saving &&
                    styles.modalSaveDisabled,
                ]}
              >
                <Text
                  style={styles.modalSaveText}
                >
                  {saving
                    ? "Saving..."
                    : "Save Activity"}
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
    backgroundColor: "#F2F5F8",
  },
  page: {
    flex: 1,
    backgroundColor: "#F2F5F8",
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
    color: "#1B2E40",
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
    color: "#87949F",
  },
  headerTitle: {
    maxWidth: "100%",
    marginTop: 2,
    fontSize: 17,
    fontWeight: "900",
    color: "#172B3F",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: "#71808C",
  },
  addHeaderButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#14283D",
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
    backgroundColor: "#E5ECFA",
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
    backgroundColor: "rgba(185,200,238,0.48)",
  },
  heroCopy: {
    zIndex: 2,
    width: "66%",
  },
  heroEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#5F6F94",
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "900",
    color: "#1A2C45",
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
    color: "#667590",
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
    backgroundColor: "#14283D",
  },
  createButtonPressed: {
    transform: [{ translateY: 2 }],
  },
  createIcon: {
    width: 37,
    height: 37,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 19,
    backgroundColor: "#7997E8",
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
    color: "#1B3044",
  },
  summaryLabel: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: "800",
    color: "#6A7885",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    padding: 12,
    borderRadius: 19,
    backgroundColor: "#FFF3D0",
  },
  noticeIcon: {
    width: 25,
    height: 25,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 13,
    backgroundColor: "#E5A62B",
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  noticeText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#725E2D",
  },
  quizBankButton: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D8E1EE",
    borderRadius: 21,
    backgroundColor: "#EAF0FF",
  },
  quizBankIconCircle: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
  },
  quizBankIcon: {
    fontSize: 21,
  },
  quizBankCopy: {
    flex: 1,
    marginLeft: 10,
  },
  quizBankTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#263B5C",
  },
  quizBankText: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: "700",
    color: "#6C7B93",
  },
  quizBankArrow: {
    marginTop: -3,
    fontSize: 27,
    color: "#536FB7",
  },
  activityQuizButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: "#EAF0FF",
  },
  activityQuizIcon: {
    fontSize: 16,
  },
  activityQuizText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 9,
    fontWeight: "900",
    color: "#536FB7",
  },
  activityQuizArrow: {
    marginTop: -2,
    fontSize: 23,
    color: "#536FB7",
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
    color: "#8A96A1",
  },
  sectionTitle: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: "900",
    color: "#172B3F",
  },
  smallAddButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 17,
    backgroundColor: "#14283D",
  },
  smallAddText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  activityList: {
    gap: 11,
  },
  activityCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#DCE3EA",
    borderBottomWidth: 5,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  activityTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderCircle: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#E7EEFF",
  },
  orderText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#536FB7",
  },
  activityCopy: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },
  activityTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#1D3042",
  },
  activityType: {
    marginTop: 3,
    fontSize: 8,
    fontWeight: "800",
    color: "#71808C",
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
  instruction: {
    marginTop: 9,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#687682",
  },
  payloadPreview: {
    marginTop: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#F3F6F9",
  },
  payloadLabel: {
    fontSize: 7,
    letterSpacing: 1.2,
    fontWeight: "900",
    color: "#84919C",
  },
  payloadText: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 12,
    fontFamily: "monospace",
    color: "#526270",
  },
  activityActions: {
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
    backgroundColor: "#E7EEFF",
  },
  editButtonText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#536FB7",
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
    color: "#1C3043",
  },
  emptyText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#75828E",
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 13,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#14283D",
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
    color: "#1C3043",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(12,24,36,0.45)",
  },
  modalSafe: {
    maxHeight: "95%",
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
    borderBottomColor: "#E7EDF1",
  },
  modalEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#8995A0",
  },
  modalTitle: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: "#172B3F",
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#F1F4F6",
  },
  modalCloseText: {
    marginTop: -3,
    fontSize: 27,
    color: "#475867",
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
    color: "#566674",
  },
  fieldInput: {
    minHeight: 52,
    paddingHorizontal: 13,
    borderWidth: 2,
    borderColor: "#DCE3E9",
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
    color: "#1D2F40",
  },
  smallTextArea: {
    minHeight: 82,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  jsonInput: {
    minHeight: 260,
    paddingTop: 12,
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 17,
  },
  typeRow: {
    gap: 7,
    paddingBottom: 2,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#D8E1E8",
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
  },
  typeChipActive: {
    borderColor: "#536FB7",
    backgroundColor: "#536FB7",
  },
  typeChipText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#657482",
  },
  typeChipTextActive: {
    color: "#FFFFFF",
  },
  jsonNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#FFF3D0",
  },
  jsonNoteIcon: {
    width: 23,
    height: 23,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 12,
    backgroundColor: "#E5A62B",
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  jsonNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 8,
    lineHeight: 13,
    fontWeight: "700",
    color: "#715D2E",
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
    borderColor: "#D8E1E8",
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
  },
  choiceChipActive: {
    borderColor: "#2D6B9C",
    backgroundColor: "#2D6B9C",
  },
  choiceChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#657482",
  },
  choiceChipTextActive: {
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 9,
    padding: 13,
    borderTopWidth: 1,
    borderTopColor: "#E8EDF1",
    backgroundColor: "#FFFFFF",
  },
  modalCancelButton: {
    width: 105,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D8E0E6",
    borderRadius: 26,
  },
  modalCancelText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#61717E",
  },
  modalSaveButton: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#14283D",
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
