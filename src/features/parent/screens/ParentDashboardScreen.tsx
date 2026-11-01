import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import { SafeAreaView } from "../../../web/safe-area";

import { env } from "../../../config/env";
import { useAuth } from "../../../contexts/AuthContext";
import type { ScreenProps } from "../../../navigation/routes";
import {
  parentService,
  type ParentChild,
  type ParentLinkRequest,
} from "../services/parentService";

const statusText: Record<
  ParentLinkRequest["status"],
  string
> = {
  pending: "Child approval-এর অপেক্ষায়",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

function getStatusText(
  status: ParentLinkRequest["status"],
) {
  return statusText[status] ?? status;
}

function subjectColor(subjectId: string) {
  const normalized = subjectId.toLowerCase();

  if (normalized.includes("bangla")) {
    return "#63B95B";
  }

  if (normalized.includes("english")) {
    return "#61A9E6";
  }

  if (normalized.includes("math")) {
    return "#F5A94A";
  }

  return "#9B7BE3";
}

function avatarEmoji(avatarKey: string) {
  const normalized = avatarKey.toLowerCase();

  if (normalized.includes("mimi")) {
    return "👧";
  }

  if (normalized.includes("cat")) {
    return "🐱";
  }

  if (normalized.includes("bear")) {
    return "🐻";
  }

  return "🐯";
}

export default function ParentDashboardScreen({
  navigation,
}: ScreenProps<"ParentDashboard">) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 700;

  const maxWidth = isTablet ? 980 : 720;
  const horizontalPadding = isSmallPhone
    ? 12
    : isTablet
      ? 28
      : 16;

  const {
    user,
    isAuthenticated,
    loading: authLoading,
    logout,
  } = useAuth();

  const [children, setChildren] = useState<
    ParentChild[]
  >([]);
  const [requests, setRequests] = useState<
    ParentLinkRequest[]
  >([]);
  const [selectedId, setSelectedId] =
    useState("");
  const [childName, setChildName] =
    useState("");
  const [studentCode, setStudentCode] =
    useState("");
  const [loadingData, setLoadingData] =
    useState(true);
  const [sending, setSending] =
    useState(false);
  const [loggingOut, setLoggingOut] =
    useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");

    try {
      const [nextChildren, nextRequests] =
        await Promise.all([
          parentService.getChildren(),
          parentService.getLinkRequests(),
        ]);

      setChildren(nextChildren);
      setRequests(nextRequests);

      setSelectedId((current) =>
        nextChildren.some(
          (child) => child.id === current,
        )
          ? current
          : (nextChildren[0]?.id ?? ""),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Dashboard data load হয়নি।",
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigation.replace("Login");
      return;
    }

    let active = true;
    let removeRealtime:
      | (() => void)
      | undefined;

    void loadDashboard();

    void parentService
      .subscribeToLinkChanges(() => {
        void loadDashboard();
      })
      .then((remove) => {
        if (active) {
          removeRealtime = remove;
        } else {
          remove();
        }
      })
      .catch((subscriptionError) => {
        console.warn(
          "Parent link realtime subscription failed.",
          subscriptionError,
        );
      });

    return () => {
      active = false;
      removeRealtime?.();
    };
  }, [
    authLoading,
    isAuthenticated,
    loadDashboard,
    navigation,
  ]);

  const selectedChild = useMemo(
    () =>
      children.find(
        (child) => child.id === selectedId,
      ) ?? children[0],
    [children, selectedId],
  );

  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status === "pending",
      ),
    [requests],
  );

  const totalStars = useMemo(
    () =>
      children.reduce(
        (total, child) =>
          total + child.totalStars,
        0,
      ),
    [children],
  );

  const averageProgress = useMemo(() => {
    if (children.length === 0) {
      return 0;
    }

    return Math.round(
      children.reduce(
        (total, child) =>
          total + child.totalProgress,
        0,
      ) / children.length,
    );
  }, [children]);

  const sendLinkRequest = async () => {
    const normalizedName = childName
      .trim()
      .replace(/\s+/g, " ");
    const normalizedCode = studentCode
      .trim()
      .toUpperCase();

    if (!normalizedName) {
      Alert.alert(
        "শিশুর নাম দিন",
        "Parent হিসেবে আপনার সন্তানের নাম লিখুন।",
      );
      return;
    }

    if (normalizedName.length > 40) {
      Alert.alert(
        "নামটি অনেক বড়",
        "শিশুর নাম সর্বোচ্চ ৪০ অক্ষরের হতে পারবে।",
      );
      return;
    }

    if (!normalizedCode) {
      Alert.alert(
        "Student ID দিন",
        "Child-এর Subjects screen থেকে Student ID দেখুন।",
      );
      return;
    }

    setSending(true);

    try {
      await parentService.requestLink(
        normalizedCode,
        normalizedName,
      );

      setChildName("");
      setStudentCode("");
      await loadDashboard();

      Alert.alert(
        "Request পাঠানো হয়েছে",
        "এখন child-এর Subjects screen খুলুন। সেখানে Allow Parent চাপলে account link হবে।",
      );
    } catch (requestError) {
      Alert.alert(
        "Request পাঠানো যায়নি",
        requestError instanceof Error
          ? requestError.message
          : "আবার চেষ্টা করুন।",
      );
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();

      navigation.reset({
        index: 0,
        routes: [{ name: "Subjects" }],
      });
    } catch (logoutError) {
      Alert.alert(
        "Logout হয়নি",
        logoutError instanceof Error
          ? logoutError.message
          : "আবার চেষ্টা করুন।",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Parent account থেকে Logout?",
      "Logout করলে আবার Parent Dashboard দেখতে login করতে হবে।",
      [
        {
          text: "না",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () =>
            void handleLogout(),
        },
      ],
    );
  };

  const openAccountDeletion = () => {
    if (!env.ACCOUNT_DELETION_URL) {
      Alert.alert(
        "Account deletion",
        "Account-deletion request URL এখনো configure করা হয়নি।",
      );
      return;
    }

    void Linking.openURL(
      env.ACCOUNT_DELETION_URL,
    ).catch(() =>
      Alert.alert(
        "লিংক খোলা যায়নি",
        "আবার চেষ্টা করুন।",
      ),
    );
  };

  if (
    authLoading ||
    (!isAuthenticated && loadingData)
  ) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator
            size="large"
            color="#7553BA"
          />
          <Text style={styles.centerTitle}>
            Parent Dashboard খুলছে…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loadingData}
              onRefresh={() =>
                void loadDashboard()
              }
              colors={["#7553BA"]}
              tintColor="#7553BA"
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal:
                horizontalPadding,
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
              <View style={styles.headerCopy}>
                <Text style={styles.headerEyebrow}>
                  PARENT AREA
                </Text>
                <Text
                  style={[
                    styles.headerTitle,
                    isTablet &&
                      styles.headerTitleTablet,
                  ]}
                >
                  Parent Dashboard
                </Text>
                <Text style={styles.parentName}>
                  {user?.name ??
                    user?.email ??
                    "Parent"}
                </Text>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Refresh dashboard"
                  disabled={loadingData}
                  onPress={() =>
                    void loadDashboard()
                  }
                  style={({ pressed }) => [
                    styles.headerIconButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={styles.headerIconText}
                  >
                    {loadingData ? "…" : "↻"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Student app-এ ফিরে যাই"
                  onPress={() =>
                    navigation.navigate(
                      "Subjects",
                    )
                  }
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.closeIcon}>
                    ×
                  </Text>
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorCard}>
                <View
                  style={styles.errorIconCircle}
                >
                  <Text style={styles.errorIcon}>
                    !
                  </Text>
                </View>

                <View style={styles.errorCopy}>
                  <Text style={styles.errorTitle}>
                    Dashboard data পাওয়া যায়নি
                  </Text>
                  <Text
                    style={styles.errorText}
                    numberOfLines={3}
                  >
                    {error}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    void loadDashboard()
                  }
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>
                    আবার
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.hero}>
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />

              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>
                  FAMILY LEARNING
                </Text>
                <Text
                  style={[
                    styles.heroTitle,
                    isSmallPhone &&
                      styles.heroTitleSmall,
                    isTablet &&
                      styles.heroTitleTablet,
                  ]}
                >
                  সন্তানের শেখা
                  {"\n"}এক নজরে দেখুন
                </Text>
                <Text style={styles.heroText}>
                  Progress, stars এবং subject
                  performance নিরাপদে monitor করুন।
                </Text>
              </View>

              <View style={styles.heroIconCircle}>
                <Text style={styles.heroIcon}>
                  👪
                </Text>
              </View>

              <View style={styles.cloudBadge}>
                <Text style={styles.cloudBadgeIcon}>
                  ☁️
                </Text>
                <Text style={styles.cloudBadgeText}>
                  Cloud sync active
                </Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <MetricCard
                icon="👧"
                value={children.length}
                label="Linked children"
                backgroundColor="#EEE6FF"
              />
              <MetricCard
                icon="⭐"
                value={totalStars}
                label="Total stars"
                backgroundColor="#FFF1C8"
              />
              <MetricCard
                icon="📈"
                value={`${averageProgress}%`}
                label="Average progress"
                backgroundColor="#E1F5DD"
              />
            </View>

            <View style={styles.linkCard}>
              <View style={styles.cardHeader}>
                <View style={styles.linkIconCircle}>
                  <Text style={styles.linkIcon}>
                    🔗
                  </Text>
                </View>

                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardEyebrow}>
                    CONNECT CHILD
                  </Text>
                  <Text style={styles.cardTitle}>
                    সন্তানকে যুক্ত করুন
                  </Text>
                </View>
              </View>

              <Text style={styles.helperText}>
                শিশুর নাম এবং Child-এর Subjects
                screen-এ থাকা Student ID লিখে
                link request পাঠান।
              </Text>

              <View style={styles.nameInputWrap}>
                <Text style={styles.codeIcon}>
                  😊
                </Text>

                <TextInput
                  value={childName}
                  editable={!sending}
                  onChangeText={setChildName}
                  maxLength={40}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="শিশুর নাম, যেমন: রাফি"
                  placeholderTextColor="#AAA1AE"
                  selectionColor="#7553BA"
                  returnKeyType="next"
                  style={styles.codeInput}
                  accessibilityLabel="Child name"
                />
              </View>

              <View style={styles.codeRow}>
                <View style={styles.codeInputWrap}>
                  <Text style={styles.codeIcon}>
                    🪪
                  </Text>

                  <TextInput
                    value={studentCode}
                    editable={!sending}
                    onChangeText={setStudentCode}
                    onSubmitEditing={() =>
                      void sendLinkRequest()
                    }
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="যেমন: SS-C1-ABC123"
                    placeholderTextColor="#AAA1AE"
                    selectionColor="#7553BA"
                    returnKeyType="send"
                    style={styles.codeInput}
                    accessibilityLabel="Student ID"
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={
                    sending ||
                    !childName.trim() ||
                    !studentCode.trim()
                  }
                  onPress={() =>
                    void sendLinkRequest()
                  }
                  style={({ pressed }) => [
                    styles.sendButton,
                    (sending ||
                      !childName.trim() ||
                      !studentCode.trim()) &&
                      styles.sendButtonDisabled,
                    pressed &&
                      !sending &&
                      childName.trim() &&
                      studentCode.trim() &&
                      styles.sendButtonPressed,
                  ]}
                >
                  <Text style={styles.sendIcon}>
                    {sending ? "…" : "→"}
                  </Text>
                </Pressable>
              </View>

              {pendingRequests.length > 0 ? (
                <View style={styles.requestList}>
                  {pendingRequests.map(
                    (request) => (
                      <View
                        key={request.id}
                        style={styles.requestRow}
                      >
                        <View
                          style={
                            styles.requestIconCircle
                          }
                        >
                          <Text
                            style={
                              styles.requestIcon
                            }
                          >
                            ⏳
                          </Text>
                        </View>

                        <View
                          style={
                            styles.requestCopy
                          }
                        >
                          <Text
                            style={
                              styles.requestTitle
                            }
                          >
                            {getStatusText(
                              request.status,
                            )}
                          </Text>
                          <Text
                            style={
                              styles.requestName
                            }
                            numberOfLines={1}
                          >
                            {request.requestedName}
                          </Text>
                          <Text
                            style={
                              styles.requestId
                            }
                          >
                            Request #
                            {request.id.slice(0, 8)}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.pendingBadge
                          }
                        >
                          <Text
                            style={
                              styles.pendingText
                            }
                          >
                            Pending
                          </Text>
                        </View>
                      </View>
                    ),
                  )}
                </View>
              ) : null}
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  CHILD PROFILES
                </Text>
                <Text style={styles.sectionTitle}>
                  আমার সন্তান
                </Text>
              </View>

              <Text style={styles.childCount}>
                {children.length} linked
              </Text>
            </View>

            {children.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.childrenRow
                }
              >
                {children.map((child) => {
                  const active =
                    child.id ===
                    selectedChild?.id;

                  return (
                    <Pressable
                      key={child.id}
                      onPress={() =>
                        setSelectedId(child.id)
                      }
                      style={({ pressed }) => [
                        styles.childCard,
                        active &&
                          styles.childCardActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.childAvatar,
                          active &&
                            styles.childAvatarActive,
                        ]}
                      >
                        <Text
                          style={
                            styles.childAvatarEmoji
                          }
                        >
                          {avatarEmoji(
                            child.avatarKey,
                          )}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.childName,
                          active &&
                            styles.childNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {child.displayName}
                      </Text>

                      <Text
                        style={[
                          styles.childClass,
                          active &&
                            styles.childClassActive,
                        ]}
                      >
                        Class {child.classLevel}
                      </Text>

                      {active ? (
                        <View
                          style={
                            styles.selectedDot
                          }
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIcon}>
                    ＋
                  </Text>
                </View>
                <Text style={styles.emptyTitle}>
                  এখনো কোনো child link হয়নি
                </Text>
                <Text style={styles.emptyText}>
                  উপরে শিশুর নাম ও Student ID
                  দিয়ে request পাঠান, তারপর child
                  device থেকে Allow Parent চাপুন।
                </Text>
              </View>
            )}

            {selectedChild ? (
              <>
                <View style={styles.progressCard}>
                  <View style={styles.progressHeader}>
                    <View>
                      <Text
                        style={
                          styles.progressEyebrow
                        }
                      >
                        SELECTED CHILD
                      </Text>
                      <Text
                        style={styles.progressTitle}
                      >
                        Progress Overview
                      </Text>
                    </View>

                    <View
                      style={styles.classBadge}
                    >
                      <Text
                        style={
                          styles.classBadgeText
                        }
                      >
                        Class{" "}
                        {selectedChild.classLevel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.overallRow}>
                    <ProgressRing
                      value={
                        selectedChild.totalProgress
                      }
                    />

                    <View style={styles.overallCopy}>
                      <Text
                        style={styles.selectedName}
                        numberOfLines={1}
                      >
                        {selectedChild.displayName}
                      </Text>

                      <View
                        style={
                          styles.studentIdChip
                        }
                      >
                        <Text
                          style={
                            styles.studentIdIcon
                          }
                        >
                          🪪
                        </Text>
                        <Text
                          style={
                            styles.studentIdText
                          }
                          numberOfLines={1}
                        >
                          {
                            selectedChild.studentCode
                          }
                        </Text>
                      </View>

                      <View
                        style={styles.scoreRow}
                      >
                        <ScorePill
                          icon="⭐"
                          value={
                            selectedChild.totalStars
                          }
                          label="Stars"
                        />
                        <ScorePill
                          icon="🏆"
                          value={
                            selectedChild.totalPoints
                          }
                          label="Points"
                        />
                      </View>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.subjectSectionTitle
                    }
                  >
                    বিষয়ভিত্তিক অগ্রগতি
                  </Text>

                  {selectedChild.subjectProgress
                    .length > 0 ? (
                    <View
                      style={styles.progressList}
                    >
                      {selectedChild.subjectProgress.map(
                        (subject) => (
                          <ProgressBar
                            key={
                              subject.subjectId
                            }
                            label={
                              subject.titleBn ||
                              subject.titleEn ||
                              subject.subjectId
                            }
                            detail={`${subject.completedChapters}/${subject.totalChapters} chapter`}
                            value={
                              subject.percentage
                            }
                            color={subjectColor(
                              subject.subjectId,
                            )}
                          />
                        ),
                      )}
                    </View>
                  ) : (
                    <View
                      style={styles.noProgressCard}
                    >
                      <Text
                        style={styles.noProgressIcon}
                      >
                        📚
                      </Text>
                      <Text
                        style={styles.noProgressText}
                      >
                        Published chapter complete
                        করলে এখানে subject progress
                        দেখা যাবে।
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.backupCard}>
                  <View
                    style={styles.backupIconCircle}
                  >
                    <Text style={styles.backupIcon}>
                      ☁️
                    </Text>
                  </View>

                  <View style={styles.backupCopy}>
                    <Text
                      style={styles.backupTitle}
                    >
                      Cloud backup active
                    </Text>
                    <Text
                      style={styles.backupText}
                    >
                      এই child Parent account-এর
                      সঙ্গে securely linked। Progress
                      Supabase-এ সংরক্ষিত থাকবে।
                    </Text>
                  </View>

                  <View style={styles.activeBadge}>
                    <Text
                      style={styles.activeBadgeText}
                    >
                      Active
                    </Text>
                  </View>
                </View>
              </>
            ) : null}

            <View style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View
                  style={styles.accountIconCircle}
                >
                  <Text
                    style={styles.accountIcon}
                  >
                    ⚙️
                  </Text>
                </View>

                <View>
                  <Text
                    style={styles.accountEyebrow}
                  >
                    ACCOUNT
                  </Text>
                  <Text
                    style={styles.accountTitle}
                  >
                    Parent settings
                  </Text>
                </View>
              </View>

              <Pressable
                disabled={loggingOut}
                onPress={confirmLogout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  loggingOut &&
                    styles.logoutButtonDisabled,
                  pressed &&
                    !loggingOut &&
                    styles.pressed,
                ]}
              >
                <Text style={styles.logoutIcon}>
                  ↪
                </Text>
                <Text style={styles.logoutText}>
                  {loggingOut
                    ? "Logout হচ্ছে…"
                    : "Parent account থেকে Logout"}
                </Text>
                <Text style={styles.rowArrow}>
                  ›
                </Text>
              </Pressable>

              <Pressable
                onPress={openAccountDeletion}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.deleteIcon}>
                  🗑️
                </Text>
                <Text style={styles.deleteText}>
                  Account ও data deletion request
                </Text>
                <Text style={styles.rowArrow}>
                  ›
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  value,
  label,
  backgroundColor,
}: {
  icon: string;
  value: number | string;
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
      <Text
        style={styles.metricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      <Text style={styles.metricLabel}>
        {label}
      </Text>
    </View>
  );
}

function ProgressRing({
  value,
}: {
  value: number;
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Math.round(value)),
  );

  return (
    <View style={styles.progressRing}>
      <View style={styles.progressRingInner}>
        <Text style={styles.progressRingValue}>
          {safeValue}%
        </Text>
        <Text style={styles.progressRingLabel}>
          complete
        </Text>
      </View>
    </View>
  );
}

function ScorePill({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.scorePill}>
      <Text style={styles.scoreIcon}>{icon}</Text>
      <View>
        <Text style={styles.scoreValue}>
          {value}
        </Text>
        <Text style={styles.scoreLabel}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function ProgressBar({
  label,
  detail,
  value,
  color,
}: {
  label: string;
  detail: string;
  value: number;
  color: string;
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Math.round(value)),
  );

  const progressWidth =
    `${safeValue}%` as `${number}%`;

  return (
    <View style={styles.progressItem}>
      <View style={styles.progressTopRow}>
        <View style={styles.progressCopy}>
          <Text
            style={styles.progressLabel}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text style={styles.progressDetail}>
            {detail}
          </Text>
        </View>

        <Text style={styles.progressValue}>
          {safeValue}%
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: progressWidth,
              backgroundColor: color,
            },
          ]}
        />
      </View>
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

  scrollContent: {
    paddingTop: 7,
    paddingBottom: 34,
  },

  shell: {
    width: "100%",
    alignSelf: "center",
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
    color: "#28232B",
  },

  header: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  headerCopy: {
    flex: 1,
    marginRight: 10,
  },

  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 1.6,
    fontWeight: "900",
    color: "#978D9B",
  },

  headerTitle: {
    marginTop: 3,
    fontSize: 25,
    fontWeight: "900",
    color: "#1D191F",
  },

  headerTitleTablet: {
    fontSize: 32,
  },

  parentName: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: "#786F7B",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerIconButton: {
    width: 41,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
  },

  headerIconText: {
    fontSize: 21,
    fontWeight: "900",
    color: "#7553BA",
  },

  closeButton: {
    width: 41,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#1A171C",
  },

  closeIcon: {
    marginTop: -2,
    fontSize: 23,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },

  errorCard: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
    padding: 11,
    borderWidth: 1,
    borderColor: "#F0B2B2",
    borderRadius: 20,
    backgroundColor: "#FFE9E9",
  },

  errorIconCircle: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#D85C5C",
  },

  errorIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  errorCopy: {
    flex: 1,
    marginHorizontal: 10,
  },

  errorTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#8E3737",
  },

  errorText: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "700",
    color: "#A45656",
  },

  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
  },

  retryText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#A44545",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: 245,
    padding: 23,
    borderRadius: 30,
    backgroundColor: "#CBBBF2",
  },

  heroOrbOne: {
    position: "absolute",
    top: -83,
    right: -62,
    width: 225,
    height: 225,
    borderRadius: 113,
    backgroundColor:
      "rgba(255,255,255,0.24)",
  },

  heroOrbTwo: {
    position: "absolute",
    left: -70,
    bottom: -95,
    width: 215,
    height: 215,
    borderRadius: 108,
    backgroundColor:
      "rgba(255,255,255,0.18)",
  },

  heroCopy: {
    zIndex: 2,
    width: "65%",
  },

  heroEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#5E5272",
  },

  heroTitle: {
    marginTop: 6,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    color: "#171419",
  },

  heroTitleSmall: {
    fontSize: 26,
    lineHeight: 32,
  },

  heroTitleTablet: {
    fontSize: 40,
    lineHeight: 47,
  },

  heroText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#5D5264",
  },

  heroIconCircle: {
    position: "absolute",
    top: 28,
    right: 23,
    width: 108,
    height: 108,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 54,
    backgroundColor:
      "rgba(255,255,255,0.48)",
  },

  heroIcon: {
    fontSize: 49,
  },

  cloudBadge: {
    position: "absolute",
    left: 23,
    bottom: 22,
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  cloudBadgeIcon: {
    fontSize: 16,
  },

  cloudBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#514858",
  },

  metricRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 13,
  },

  metricCard: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 13,
    borderRadius: 21,
  },

  metricIcon: {
    fontSize: 20,
  },

  metricValue: {
    maxWidth: "100%",
    marginTop: 4,
    fontSize: 20,
    fontWeight: "900",
    color: "#2A252C",
  },

  metricLabel: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: "800",
    color: "#756D78",
  },

  linkCard: {
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  linkIconCircle: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#EEE6FF",
  },

  linkIcon: {
    fontSize: 21,
  },

  cardHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  cardEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#9B929F",
  },

  cardTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#29242B",
  },

  helperText: {
    marginTop: 10,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#786F7B",
  },

  nameInputWrap: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#D9D2DE",
    borderRadius: 19,
    backgroundColor: "#FBFAFC",
  },

  codeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
  },

  codeInputWrap: {
    flex: 1,
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#D9D2DE",
    borderRadius: 19,
    backgroundColor: "#FBFAFC",
  },

  codeIcon: {
    fontSize: 18,
  },

  codeInput: {
    flex: 1,
    minHeight: 53,
    marginLeft: 9,
    fontSize: 13,
    fontWeight: "800",
    color: "#28232B",
  },

  sendButton: {
    width: 57,
    height: 57,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: "#1A171C",
  },

  sendButtonDisabled: {
    opacity: 0.6,
  },

  sendButtonPressed: {
    transform: [{ translateY: 2 }],
  },

  sendIcon: {
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  requestList: {
    gap: 8,
    marginTop: 12,
  },

  requestRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    padding: 9,
    borderRadius: 18,
    backgroundColor: "#FFF3D0",
  },

  requestIconCircle: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },

  requestIcon: {
    fontSize: 18,
  },

  requestCopy: {
    flex: 1,
    marginLeft: 9,
  },

  requestTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#715D2E",
  },

  requestName: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "900",
    color: "#715D2E",
  },

  requestId: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "700",
    color: "#89774D",
  },

  pendingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  pendingText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#A17012",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 11,
  },

  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: "900",
    color: "#968D99",
  },

  sectionTitle: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: "900",
    color: "#1D191F",
  },

  childCount: {
    fontSize: 9,
    fontWeight: "800",
    color: "#837A86",
  },

  childrenRow: {
    gap: 9,
    paddingRight: 4,
  },

  childCard: {
    width: 112,
    minHeight: 135,
    alignItems: "center",
    padding: 11,
    borderWidth: 2,
    borderColor: "#E1DCE5",
    borderBottomWidth: 5,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  childCardActive: {
    borderColor: "#7553BA",
    backgroundColor: "#EEE6FF",
  },

  childAvatar: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: "#F2EEF5",
  },

  childAvatarActive: {
    backgroundColor: "#FFFFFF",
  },

  childAvatarEmoji: {
    fontSize: 29,
  },

  childName: {
    maxWidth: "100%",
    marginTop: 8,
    fontSize: 11,
    fontWeight: "900",
    color: "#3D3740",
  },

  childNameActive: {
    color: "#593C99",
  },

  childClass: {
    marginTop: 3,
    fontSize: 8,
    fontWeight: "700",
    color: "#847B87",
  },

  childClassActive: {
    color: "#7359A9",
  },

  selectedDot: {
    width: 7,
    height: 7,
    marginTop: 7,
    borderRadius: 4,
    backgroundColor: "#7553BA",
  },

  emptyCard: {
    alignItems: "center",
    padding: 22,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  emptyIconCircle: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: "#EEE6FF",
  },

  emptyIcon: {
    fontSize: 28,
    fontWeight: "900",
    color: "#7553BA",
  },

  emptyTitle: {
    marginTop: 9,
    fontSize: 15,
    fontWeight: "900",
    color: "#2D282F",
  },

  emptyText: {
    maxWidth: 360,
    marginTop: 5,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#776E79",
    textAlign: "center",
  },

  progressCard: {
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: "#9B929F",
  },

  progressTitle: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "900",
    color: "#29242B",
  },

  classBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "#EEE6FF",
  },

  classBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#6545A8",
  },

  overallRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },

  progressRing: {
    width: 105,
    height: 105,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 11,
    borderColor: "#7553BA",
    borderRadius: 53,
    backgroundColor: "#EEE6FF",
  },

  progressRingInner: {
    width: 73,
    height: 73,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 37,
    backgroundColor: "#FFFFFF",
  },

  progressRingValue: {
    fontSize: 21,
    fontWeight: "900",
    color: "#593C99",
  },

  progressRingLabel: {
    marginTop: 1,
    fontSize: 7,
    fontWeight: "800",
    color: "#8C8291",
  },

  overallCopy: {
    flex: 1,
    marginLeft: 14,
  },

  selectedName: {
    maxWidth: "100%",
    fontSize: 20,
    fontWeight: "900",
    color: "#2A252C",
  },

  studentIdChip: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 9,
    borderRadius: 16,
    backgroundColor: "#F2EEF5",
  },

  studentIdIcon: {
    fontSize: 13,
  },

  studentIdText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: "900",
    color: "#655B69",
  },

  scoreRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 9,
  },

  scorePill: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
    backgroundColor: "#FBF9FC",
  },

  scoreIcon: {
    fontSize: 17,
  },

  scoreValue: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "900",
    color: "#2D282F",
  },

  scoreLabel: {
    marginLeft: 6,
    marginTop: 1,
    fontSize: 7,
    fontWeight: "700",
    color: "#8B828E",
  },

  subjectSectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "900",
    color: "#332E35",
  },

  progressList: {
    gap: 9,
  },

  progressItem: {
    padding: 11,
    borderRadius: 18,
    backgroundColor: "#F8F6F9",
  },

  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressCopy: {
    flex: 1,
    marginRight: 10,
  },

  progressLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#3A343D",
  },

  progressDetail: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "700",
    color: "#8A818D",
  },

  progressValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7553BA",
  },

  track: {
    height: 8,
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#E6E0E8",
  },

  fill: {
    height: "100%",
    borderRadius: 4,
  },

  noProgressCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#F7F4F9",
  },

  noProgressIcon: {
    fontSize: 23,
  },

  noProgressText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
    color: "#776E79",
  },

  backupCard: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 13,
    borderRadius: 22,
    backgroundColor: "#E4F4E1",
  },

  backupIconCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  backupIcon: {
    fontSize: 23,
  },

  backupCopy: {
    flex: 1,
    marginHorizontal: 10,
  },

  backupTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#357C31",
  },

  backupText: {
    marginTop: 3,
    fontSize: 8,
    lineHeight: 13,
    fontWeight: "700",
    color: "#5A7F57",
  },

  activeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  activeBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#3F8D3A",
  },

  accountCard: {
    marginTop: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  accountIconCircle: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#F2EEF5",
  },

  accountIcon: {
    fontSize: 19,
  },

  accountEyebrow: {
    marginLeft: 9,
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: "900",
    color: "#9B929F",
  },

  accountTitle: {
    marginLeft: 9,
    marginTop: 2,
    fontSize: 14,
    fontWeight: "900",
    color: "#332E35",
  },

  logoutButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#F7F4F9",
  },

  logoutButtonDisabled: {
    opacity: 0.6,
  },

  logoutIcon: {
    fontSize: 19,
    color: "#7553BA",
  },

  logoutText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 10,
    fontWeight: "900",
    color: "#514A54",
  },

  rowArrow: {
    marginTop: -2,
    fontSize: 24,
    color: "#8B828E",
  },

  deleteButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#FFF0F0",
  },

  deleteIcon: {
    fontSize: 18,
  },

  deleteText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 10,
    fontWeight: "900",
    color: "#A64E4E",
  },
});
