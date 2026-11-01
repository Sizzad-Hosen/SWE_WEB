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
  type AdminChapter,
  type AdminUser,
} from "../services/adminService";

const SUBJECTS = [
  { id: "bangla", label: "বাংলা" },
  { id: "english", label: "English" },
  { id: "math", label: "গণিত" },
] as const;

const STATUSES: PublicationStatus[] = [
  "draft",
  "published",
  "archived",
];

type ChapterForm = {
  id?: string;
  classLevel: string;
  subjectId: string;
  chapterNumber: string;
  titleBn: string;
  titleEn: string;
  summaryBn: string;
  summaryEn: string;
  coverUrl: string;
  status: PublicationStatus;
};

const EMPTY_FORM: ChapterForm = {
  classLevel: "1",
  subjectId: "bangla",
  chapterNumber: "1",
  titleBn: "",
  titleEn: "",
  summaryBn: "",
  summaryEn: "",
  coverUrl: "",
  status: "draft",
};

function statusLabel(status: PublicationStatus) {
  if (status === "published") {
    return "Published";
  }

  if (status === "archived") {
    return "Archived";
  }

  return "Draft";
}

function subjectLabel(subjectId: string) {
  return (
    SUBJECTS.find(
      (subject) => subject.id === subjectId,
    )?.label ?? subjectId
  );
}

export default function AdminDashboardScreen({
  navigation,
}: ScreenProps<"AdminDashboard">) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 700;
  const maxWidth = isTablet ? 1100 : 720;

  const [admin, setAdmin] =
    useState<AdminUser | null>(null);
  const [chapters, setChapters] = useState<
    AdminChapter[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] =
    useState(false);
  const [formVisible, setFormVisible] =
    useState(false);
  const [form, setForm] =
    useState<ChapterForm>(EMPTY_FORM);

  const [classFilter, setClassFilter] =
    useState<number | "all">("all");
  const [subjectFilter, setSubjectFilter] =
    useState<string>("all");
  const [statusFilter, setStatusFilter] =
    useState<PublicationStatus | "all">("all");

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const currentAdmin =
          await adminService.getCurrentAdmin();

        if (!currentAdmin) {
          navigation.replace("AdminLogin");
          return;
        }

        setAdmin(currentAdmin);

        const chapterRows =
          await adminService.listChapters();

        setChapters(chapterRows);
      } catch (error) {
        Alert.alert(
          "Admin data লোড হয়নি",
          error instanceof Error
            ? error.message
            : "আবার চেষ্টা করুন।",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigation],
  );

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const filteredChapters = useMemo(
    () =>
      chapters.filter((chapter) => {
        if (
          classFilter !== "all" &&
          chapter.class_level !== classFilter
        ) {
          return false;
        }

        if (
          subjectFilter !== "all" &&
          chapter.subject_id !== subjectFilter
        ) {
          return false;
        }

        if (
          statusFilter !== "all" &&
          chapter.status !== statusFilter
        ) {
          return false;
        }

        return true;
      }),
    [
      chapters,
      classFilter,
      subjectFilter,
      statusFilter,
    ],
  );

  const publishedCount = chapters.filter(
    (chapter) => chapter.status === "published",
  ).length;
  const draftCount = chapters.filter(
    (chapter) => chapter.status === "draft",
  ).length;
  const activityCount = chapters.reduce(
    (total, chapter) =>
      total + chapter.activity_count,
    0,
  );

  const openCreate = () => {
    const nextChapterNumber =
      chapters.length > 0
        ? Math.max(
            ...chapters.map(
              (chapter) => chapter.chapter_number,
            ),
          ) + 1
        : 1;

    setForm({
      ...EMPTY_FORM,
      chapterNumber: String(nextChapterNumber),
    });
    setFormVisible(true);
  };

  const openEdit = (chapter: AdminChapter) => {
    setForm({
      id: chapter.id,
      classLevel: String(chapter.class_level),
      subjectId: chapter.subject_id,
      chapterNumber: String(
        chapter.chapter_number,
      ),
      titleBn: chapter.title_bn,
      titleEn: chapter.title_en ?? "",
      summaryBn: chapter.summary_bn ?? "",
      summaryEn: chapter.summary_en ?? "",
      coverUrl: chapter.cover_url ?? "",
      status: chapter.status,
    });
    setFormVisible(true);
  };

  const saveChapter = async () => {
    const classLevel = Number(form.classLevel);
    const chapterNumber = Number(
      form.chapterNumber,
    );

    if (
      !Number.isInteger(classLevel) ||
      classLevel < 1 ||
      classLevel > 3
    ) {
      Alert.alert(
        "Class প্রয়োজন",
        "Class 1, 2 অথবা 3 নির্বাচন করুন।",
      );
      return;
    }

    if (
      !Number.isInteger(chapterNumber) ||
      chapterNumber < 1
    ) {
      Alert.alert(
        "Chapter number প্রয়োজন",
        "সঠিক chapter number লিখুন।",
      );
      return;
    }

    if (!form.titleBn.trim()) {
      Alert.alert(
        "বাংলা title প্রয়োজন",
        "Chapter-এর বাংলা title লিখুন।",
      );
      return;
    }

    setSaving(true);

    try {
      await adminService.saveChapter({
        id: form.id,
        classLevel,
        subjectId: form.subjectId,
        chapterNumber,
        titleBn: form.titleBn,
        titleEn: form.titleEn,
        summaryBn: form.summaryBn,
        summaryEn: form.summaryEn,
        coverUrl: form.coverUrl,
        status: form.status,
      });

      setFormVisible(false);
      setForm(EMPTY_FORM);
      await loadDashboard(true);
    } catch (error) {
      Alert.alert(
        "Chapter save হয়নি",
        error instanceof Error
          ? error.message
          : "আবার চেষ্টা করুন।",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (
    chapter: AdminChapter,
  ) => {
    const nextStatus: PublicationStatus =
      chapter.status === "published"
        ? "draft"
        : "published";

    const action =
      nextStatus === "published"
        ? "publish"
        : "draft-এ নেওয়া";

    Alert.alert(
      "Status পরিবর্তন",
      `“${chapter.title_bn}” ${action} হবে।`,
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
                await adminService.setChapterStatus(
                  chapter.id,
                  nextStatus,
                );
                await loadDashboard(true);
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

  const logout = () => {
    Alert.alert(
      "Admin logout",
      "Admin Panel থেকে logout করবেন?",
      [
        {
          text: "না",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await adminService.logout();
              navigation.replace("Subjects");
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
            Admin Panel লোড হচ্ছে...
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
              <View>
                <Text style={styles.headerEyebrow}>
                  NCTB KIDS
                </Text>
                <Text
                  style={[
                    styles.headerTitle,
                    isTablet &&
                      styles.headerTitleTablet,
                  ]}
                >
                  Admin Dashboard
                </Text>
                <Text style={styles.headerSubtitle}>
                  {admin?.name} ·{" "}
                  {admin?.role === "admin"
                    ? "Admin"
                    : "Content Creator"}
                </Text>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  onPress={() =>
                    void loadDashboard(true)
                  }
                  style={({ pressed }) => [
                    styles.headerIconButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.headerIcon}>
                    {refreshing ? "…" : "↻"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={logout}
                  style={({ pressed }) => [
                    styles.logoutButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.logoutText}>
                    Exit
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.hero}>
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>
                  CONTENT CONTROL
                </Text>
                <Text
                  style={[
                    styles.heroTitle,
                    isTablet &&
                      styles.heroTitleTablet,
                  ]}
                >
                  শেখার content
                  {"\n"}manage করুন
                </Text>
                <Text style={styles.heroText}>
                  Chapter তৈরি, edit, publish এবং
                  activity manage করুন।
                </Text>
              </View>

              <View style={styles.heroIconCircle}>
                <Text style={styles.heroIcon}>
                  🧑‍💻
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
                <Text style={styles.createButtonIcon}>
                  ＋
                </Text>
                <Text style={styles.createButtonText}>
                  New Chapter
                </Text>
              </Pressable>
            </View>

            <View style={styles.metricGrid}>
              <Metric
                icon="📚"
                value={chapters.length}
                label="All Chapters"
                backgroundColor="#E5F2FC"
              />
              <Metric
                icon="✅"
                value={publishedCount}
                label="Published"
                backgroundColor="#E3F5DF"
              />
              <Metric
                icon="📝"
                value={draftCount}
                label="Draft"
                backgroundColor="#FFF1C9"
              />
              <Metric
                icon="🧩"
                value={activityCount}
                label="Activities"
                backgroundColor="#EEE6FF"
              />
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  CURRICULUM
                </Text>
                <Text style={styles.sectionTitle}>
                  Chapter Management
                </Text>
              </View>

              <Pressable
                onPress={openCreate}
                style={({ pressed }) => [
                  styles.smallCreateButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={styles.smallCreateButtonText}
                >
                  ＋ Add
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(["all", 1, 2, 3] as const).map(
                (item) => (
                  <FilterChip
                    key={String(item)}
                    label={
                      item === "all"
                        ? "All Classes"
                        : `Class ${item}`
                    }
                    active={classFilter === item}
                    onPress={() =>
                      setClassFilter(item)
                    }
                  />
                ),
              )}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <FilterChip
                label="All Subjects"
                active={subjectFilter === "all"}
                onPress={() =>
                  setSubjectFilter("all")
                }
              />

              {SUBJECTS.map((subject) => (
                <FilterChip
                  key={subject.id}
                  label={subject.label}
                  active={
                    subjectFilter === subject.id
                  }
                  onPress={() =>
                    setSubjectFilter(subject.id)
                  }
                />
              ))}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <FilterChip
                label="All Status"
                active={statusFilter === "all"}
                onPress={() =>
                  setStatusFilter("all")
                }
              />

              {STATUSES.map((status) => (
                <FilterChip
                  key={status}
                  label={statusLabel(status)}
                  active={statusFilter === status}
                  onPress={() =>
                    setStatusFilter(status)
                  }
                />
              ))}
            </ScrollView>

            <View style={styles.chapterList}>
              {filteredChapters.map((chapter) => (
                <View
                  key={chapter.id}
                  style={styles.chapterCard}
                >
                  <View style={styles.chapterTopRow}>
                    <View style={styles.chapterNumber}>
                      <Text
                        style={styles.chapterNumberText}
                      >
                        {chapter.chapter_number}
                      </Text>
                    </View>

                    <View style={styles.chapterCopy}>
                      <Text
                        style={styles.chapterTitle}
                        numberOfLines={2}
                      >
                        {chapter.title_bn}
                      </Text>

                      <Text style={styles.chapterMeta}>
                        Class {chapter.class_level} ·{" "}
                        {subjectLabel(
                          chapter.subject_id,
                        )}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        chapter.status === "published"
                          ? styles.statusPublished
                          : chapter.status === "archived"
                            ? styles.statusArchived
                            : styles.statusDraft,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          chapter.status === "published"
                            ? styles.statusTextPublished
                            : chapter.status === "archived"
                              ? styles.statusTextArchived
                              : styles.statusTextDraft,
                        ]}
                      >
                        {statusLabel(chapter.status)}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={styles.chapterSummary}
                    numberOfLines={2}
                  >
                    {chapter.summary_bn ||
                      "কোনো summary যোগ করা হয়নি।"}
                  </Text>

                  <View style={styles.activitySummary}>
                    <View style={styles.activityStat}>
                      <Text
                        style={styles.activityStatIcon}
                      >
                        🧩
                      </Text>
                      <Text
                        style={styles.activityStatText}
                      >
                        {chapter.activity_count} activities
                      </Text>
                    </View>

                    <View style={styles.activityStat}>
                      <Text
                        style={styles.activityStatIcon}
                      >
                        ✅
                      </Text>
                      <Text
                        style={styles.activityStatText}
                      >
                        {
                          chapter.published_activity_count
                        }{" "}
                        published
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chapterActions}>
                    <Pressable
                      onPress={() =>
                        navigation.navigate(
                          "AdminContentEditor",
                          {
                            chapterId: chapter.id,
                            chapterTitle:
                              chapter.title_bn,
                          },
                        )
                      }
                      style={({ pressed }) => [
                        styles.manageButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={styles.manageButtonIcon}
                      >
                        🧩
                      </Text>
                      <Text
                        style={styles.manageButtonText}
                      >
                        Activities
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => openEdit(chapter)}
                      style={({ pressed }) => [
                        styles.editButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.editButtonText}>
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        toggleStatus(chapter)
                      }
                      style={({ pressed }) => [
                        styles.publishButton,
                        chapter.status ===
                          "published" &&
                          styles.unpublishButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.publishButtonText,
                          chapter.status ===
                            "published" &&
                            styles.unpublishButtonText,
                        ]}
                      >
                        {chapter.status === "published"
                          ? "Unpublish"
                          : "Publish"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {filteredChapters.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>
                  📭
                </Text>
                <Text style={styles.emptyTitle}>
                  কোনো chapter পাওয়া যায়নি
                </Text>
                <Text style={styles.emptyText}>
                  Filter পরিবর্তন করুন অথবা নতুন
                  chapter তৈরি করুন।
                </Text>

                <Pressable
                  onPress={openCreate}
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>
                    New Chapter
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <ChapterFormModal
          visible={formVisible}
          form={form}
          saving={saving}
          onChange={setForm}
          onClose={() => {
            if (!saving) {
              setFormVisible(false);
            }
          }}
          onSave={() => void saveChapter()}
        />
      </View>
    </SafeAreaView>
  );
}

function Metric({
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
        styles.metricCard,
        { backgroundColor },
      ]}
    >
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        active && styles.filterChipActive,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          active && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ChapterFormModal({
  visible,
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  visible: boolean;
  form: ChapterForm;
  saving: boolean;
  onChange: (form: ChapterForm) => void;
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
                  CHAPTER FORM
                </Text>
                <Text style={styles.modalTitle}>
                  {form.id
                    ? "Chapter Edit"
                    : "New Chapter"}
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                disabled={saving}
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
              contentContainerStyle={
                styles.modalContent
              }
            >
              <Text style={styles.fieldLabel}>
                Class
              </Text>

              <View style={styles.choiceRow}>
                {[1, 2, 3].map((item) => (
                  <ChoiceChip
                    key={item}
                    label={`Class ${item}`}
                    active={
                      form.classLevel ===
                      String(item)
                    }
                    onPress={() =>
                      onChange({
                        ...form,
                        classLevel: String(item),
                      })
                    }
                  />
                ))}
              </View>

              <Text style={styles.fieldLabel}>
                Subject
              </Text>

              <View style={styles.choiceRow}>
                {SUBJECTS.map((subject) => (
                  <ChoiceChip
                    key={subject.id}
                    label={subject.label}
                    active={
                      form.subjectId === subject.id
                    }
                    onPress={() =>
                      onChange({
                        ...form,
                        subjectId: subject.id,
                      })
                    }
                  />
                ))}
              </View>

              <Text style={styles.fieldLabel}>
                Chapter number
              </Text>
              <TextInput
                value={form.chapterNumber}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    chapterNumber: value.replace(
                      /[^0-9]/g,
                      "",
                    ),
                  })
                }
                keyboardType="number-pad"
                style={styles.fieldInput}
              />

              <Text style={styles.fieldLabel}>
                বাংলা title *
              </Text>
              <TextInput
                value={form.titleBn}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    titleBn: value,
                  })
                }
                placeholder="যেমন: আমার পরিচয়"
                placeholderTextColor="#A7A0AA"
                style={styles.fieldInput}
              />

              <Text style={styles.fieldLabel}>
                English title
              </Text>
              <TextInput
                value={form.titleEn}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    titleEn: value,
                  })
                }
                placeholder="Optional"
                placeholderTextColor="#A7A0AA"
                style={styles.fieldInput}
              />

              <Text style={styles.fieldLabel}>
                বাংলা summary
              </Text>
              <TextInput
                value={form.summaryBn}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    summaryBn: value,
                  })
                }
                multiline
                placeholder="Chapter সম্পর্কে ছোট summary"
                placeholderTextColor="#A7A0AA"
                style={[
                  styles.fieldInput,
                  styles.textArea,
                ]}
              />

              <Text style={styles.fieldLabel}>
                Cover image URL
              </Text>
              <TextInput
                value={form.coverUrl}
                onChangeText={(value) =>
                  onChange({
                    ...form,
                    coverUrl: value,
                  })
                }
                autoCapitalize="none"
                placeholder="https://..."
                placeholderTextColor="#A7A0AA"
                style={styles.fieldInput}
              />

              <Text style={styles.fieldLabel}>
                Status
              </Text>

              <View style={styles.choiceRow}>
                {STATUSES.map((status) => (
                  <ChoiceChip
                    key={status}
                    label={statusLabel(status)}
                    active={form.status === status}
                    onPress={() =>
                      onChange({
                        ...form,
                        status,
                      })
                    }
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={onClose}
                disabled={saving}
                style={styles.modalCancelButton}
              >
                <Text
                  style={styles.modalCancelText}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={onSave}
                disabled={saving}
                style={[
                  styles.modalSaveButton,
                  saving &&
                    styles.modalSaveDisabled,
                ]}
              >
                <Text style={styles.modalSaveText}>
                  {saving
                    ? "Saving..."
                    : "Save Chapter"}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choiceChip,
        active && styles.choiceChipActive,
      ]}
    >
      <Text
        style={[
          styles.choiceChipText,
          active && styles.choiceChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 1.6,
    fontWeight: "900",
    color: "#81909D",
  },
  headerTitle: {
    marginTop: 3,
    fontSize: 25,
    fontWeight: "900",
    color: "#14283D",
  },
  headerTitleTablet: {
    fontSize: 32,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: "#667684",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  headerIcon: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2B6D9C",
  },
  logoutButton: {
    minWidth: 56,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#14283D",
  },
  logoutText: {
    fontSize: 11,
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
    minHeight: 250,
    padding: 24,
    borderRadius: 30,
    backgroundColor: "#DCEAF5",
  },
  heroOrbOne: {
    position: "absolute",
    top: -85,
    right: -65,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  heroOrbTwo: {
    position: "absolute",
    left: -70,
    bottom: -95,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(164,198,226,0.45)",
  },
  heroCopy: {
    zIndex: 2,
    width: "64%",
  },
  heroEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#55728A",
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "900",
    color: "#14283D",
  },
  heroTitleTablet: {
    fontSize: 40,
    lineHeight: 47,
  },
  heroText: {
    maxWidth: 470,
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#5D7182",
  },
  heroIconCircle: {
    position: "absolute",
    right: 26,
    top: 29,
    width: 105,
    height: 105,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 53,
    backgroundColor: "#FFFFFF",
  },
  heroIcon: {
    fontSize: 48,
  },
  createButton: {
    position: "absolute",
    left: 24,
    bottom: 23,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingRight: 18,
    borderRadius: 26,
    backgroundColor: "#14283D",
  },
  createButtonPressed: {
    transform: [{ translateY: 2 }],
  },
  createButtonIcon: {
    width: 38,
    height: 38,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 19,
    backgroundColor: "#67B6E8",
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  createButtonText: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    width: "48.3%",
    minHeight: 112,
    padding: 14,
    borderRadius: 23,
  },
  metricIcon: {
    fontSize: 24,
  },
  metricValue: {
    marginTop: 7,
    fontSize: 24,
    fontWeight: "900",
    color: "#172B3F",
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "800",
    color: "#657482",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 25,
    marginBottom: 12,
  },
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: "900",
    color: "#8995A0",
  },
  sectionTitle: {
    marginTop: 3,
    fontSize: 22,
    fontWeight: "900",
    color: "#172B3F",
  },
  smallCreateButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 17,
    backgroundColor: "#14283D",
  },
  smallCreateButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  filterRow: {
    gap: 7,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D7E0E7",
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    borderColor: "#2D6B9C",
    backgroundColor: "#2D6B9C",
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#657482",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  chapterList: {
    gap: 11,
    marginTop: 4,
  },
  chapterCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#DDE4EA",
    borderBottomWidth: 5,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  chapterTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  chapterNumber: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#E5F2FC",
  },
  chapterNumberText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#2B6D9C",
  },
  chapterCopy: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },
  chapterTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    color: "#1D2F40",
  },
  chapterMeta: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: "700",
    color: "#73818D",
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
  chapterSummary: {
    marginTop: 10,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#687683",
  },
  activitySummary: {
    flexDirection: "row",
    gap: 9,
    marginTop: 11,
  },
  activityStat: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#F2F5F8",
  },
  activityStatIcon: {
    fontSize: 13,
  },
  activityStatText: {
    marginLeft: 5,
    fontSize: 8,
    fontWeight: "800",
    color: "#65727E",
  },
  chapterActions: {
    flexDirection: "row",
    gap: 7,
    marginTop: 12,
  },
  manageButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#E5F2FC",
  },
  manageButtonIcon: {
    fontSize: 15,
  },
  manageButtonText: {
    marginLeft: 5,
    fontSize: 9,
    fontWeight: "900",
    color: "#2B6D9C",
  },
  editButton: {
    minWidth: 64,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: "#F0ECFF",
  },
  editButtonText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#6648A6",
  },
  publishButton: {
    minWidth: 74,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: "#3E8F3A",
  },
  unpublishButton: {
    backgroundColor: "#FFF0C7",
  },
  publishButtonText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  unpublishButtonText: {
    color: "#9B6800",
  },
  emptyCard: {
    alignItems: "center",
    marginTop: 8,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  emptyIcon: {
    fontSize: 35,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "#203243",
  },
  emptyText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#74818D",
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
    padding: 24,
  },
  centerTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "900",
    color: "#1C3042",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(12,24,36,0.45)",
  },
  modalSafe: {
    maxHeight: "94%",
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
    borderBottomColor: "#E8EDF1",
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
  textArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  choiceRow: {
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
