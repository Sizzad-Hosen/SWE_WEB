import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "../../../web/dom";
import { SafeAreaView } from "../../../web/safe-area";

import { BottomNav } from "../../../components/BottomNav";
import type { ScreenProps } from "../../../navigation/routes";

type PaymentMethod = "bKash" | "Nagad" | "Rocket";

const QUICK_AMOUNTS = ["100", "500", "1000"] as const;

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  icon: string;
  subtitle: string;
}> = [
  {
    id: "bKash",
    icon: "💗",
    subtitle: "Mobile payment",
  },
  {
    id: "Nagad",
    icon: "🟠",
    subtitle: "Mobile payment",
  },
  {
    id: "Rocket",
    icon: "🟣",
    subtitle: "Mobile payment",
  },
];

function createChallenge() {
  const second =
    Math.floor(Math.random() * 25) + 15;
  const answer =
    Math.floor(Math.random() * 24) + 12;

  return {
    first: second + answer,
    second,
    answer,
  };
}

export default function DonationScreen({
  navigation,
}: ScreenProps<"Donation">) {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortScreen = height < 740;
  const isTablet = width >= 700;

  const maxWidth = isTablet ? 760 : 560;
  const horizontalPadding = isSmallPhone
    ? 12
    : isTablet
      ? 28
      : 16;

  const challenge = useMemo(
    () => createChallenge(),
    [],
  );

  const [gateAnswer, setGateAnswer] =
    useState("");
  const [unlocked, setUnlocked] =
    useState(false);
  const [amount, setAmount] =
    useState("500");
  const [method, setMethod] =
    useState<PaymentMethod>("bKash");
  const [submitting, setSubmitting] =
    useState(false);

  const numericAmount = Number(amount);
  const validAmount =
    Number.isFinite(numericAmount) &&
    numericAmount >= 10 &&
    numericAmount <= 100000;

  const unlock = () => {
    if (!gateAnswer.trim()) {
      Alert.alert(
        "উত্তর প্রয়োজন",
        "Adult verification প্রশ্নটির উত্তর লিখুন।",
      );
      return;
    }

    if (
      Number(gateAnswer) !== challenge.answer
    ) {
      Alert.alert(
        "সঠিক উত্তর হয়নি",
        "প্রশ্নটি আবার দেখে চেষ্টা করুন।",
      );
      setGateAnswer("");
      return;
    }

    setUnlocked(true);
  };

  const donate = () => {
    if (!validAmount) {
      Alert.alert(
        "সঠিক পরিমাণ দিন",
        "Donation amount ৳10 থেকে ৳100,000-এর মধ্যে হতে হবে।",
      );
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);

      Alert.alert(
        "Demo Donation Successful",
        `৳${numericAmount.toLocaleString()} via ${method}\n\nধন্যবাদ শিশুদের শিক্ষাকে সহযোগিতা করার জন্য!`,
      );
    }, 550);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.page}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal:
                  horizontalPadding,
                paddingTop: isShortScreen
                  ? 7
                  : 12,
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
                  accessibilityRole="button"
                  accessibilityLabel="ফিরে যাই"
                  onPress={() =>
                    navigation.goBack()
                  }
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
                  <Text
                    style={styles.headerEyebrow}
                  >
                    SUPPORT LEARNING
                  </Text>
                  <Text style={styles.headerTitle}>
                    সহযোগিতা করুন
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Parent area"
                  onPress={() =>
                    navigation.navigate(
                      "AdultGate",
                      {
                        destination: "parent",
                      },
                    )
                  }
                  style={({ pressed }) => [
                    styles.parentButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={styles.parentIcon}
                  >
                    👪
                  </Text>
                </Pressable>
              </View>

              {!unlocked ? (
                <View style={styles.gateCard}>
                  <View style={styles.gateOrbOne} />
                  <View style={styles.gateOrbTwo} />

                  <View
                    style={styles.gateIconCircle}
                  >
                    <Text style={styles.gateIcon}>
                      🛡️
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.gateTitle,
                      isTablet &&
                        styles.gateTitleTablet,
                    ]}
                  >
                    Parent verification
                  </Text>

                  <Text style={styles.gateMessage}>
                    Payment option দেখার আগে বড়দের
                    প্রশ্নটির উত্তর দিন।
                  </Text>

                  <View
                    style={styles.questionCard}
                  >
                    <Text
                      style={styles.questionLabel}
                    >
                      কত হবে?
                    </Text>
                    <Text
                      style={[
                        styles.question,
                        isTablet &&
                          styles.questionTablet,
                      ]}
                    >
                      {challenge.first} −{" "}
                      {challenge.second} = ?
                    </Text>
                  </View>

                  <Text style={styles.fieldLabel}>
                    উত্তর
                  </Text>

                  <TextInput
                    value={gateAnswer}
                    onChangeText={(value) =>
                      setGateAnswer(
                        value.replace(
                          /[^0-9]/g,
                          "",
                        ),
                      )
                    }
                    onSubmitEditing={unlock}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={3}
                    placeholder="উত্তর লিখুন"
                    placeholderTextColor="#AAA1AE"
                    selectionColor="#7553BA"
                    style={styles.gateInput}
                    accessibilityLabel="Adult verification answer"
                  />

                  <Pressable
                    accessibilityRole="button"
                    onPress={unlock}
                    style={({ pressed }) => [
                      styles.unlockButton,
                      pressed &&
                        styles.unlockButtonPressed,
                    ]}
                  >
                    <View
                      style={
                        styles.unlockIconCircle
                      }
                    >
                      <Text
                        style={styles.unlockIcon}
                      >
                        ✓
                      </Text>
                    </View>

                    <Text
                      style={styles.unlockText}
                    >
                      Donation option খুলুন
                    </Text>

                    <Text
                      style={styles.unlockArrow}
                    >
                      →
                    </Text>
                  </Pressable>

                  <View style={styles.gateNote}>
                    <Text
                      style={styles.gateNoteIcon}
                    >
                      🔐
                    </Text>
                    <Text
                      style={styles.gateNoteText}
                    >
                      এই verification শিশুদের
                      accidental payment action থেকে
                      দূরে রাখে।
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.hero}>
                    <View
                      style={styles.heroOrbOne}
                    />
                    <View
                      style={styles.heroOrbTwo}
                    />

                    <View style={styles.heroCopy}>
                      <Text
                        style={styles.heroEyebrow}
                      >
                        VOLUNTARY SUPPORT
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
                        শিশুদের শেখায়
                        {"\n"}পাশে থাকুন
                      </Text>

                      <Text
                        style={styles.heroText}
                      >
                        আপনার স্বেচ্ছা সহযোগিতা
                        content, server এবং app
                        maintenance-এ ব্যবহার হবে।
                      </Text>
                    </View>

                    <View
                      style={styles.tigerCircle}
                    >
                      <Image
                        source={'/images/tiger.png'}
                        style={styles.tiger}
                        resizeMode="contain"
                      />
                    </View>

                    <View
                      style={styles.voluntaryBadge}
                    >
                      <Text
                        style={
                          styles.voluntaryIcon
                        }
                      >
                        ❤️
                      </Text>
                      <Text
                        style={
                          styles.voluntaryText
                        }
                      >
                        100% voluntary
                      </Text>
                    </View>
                  </View>

                  <View style={styles.impactCard}>
                    <View
                      style={styles.cardHeader}
                    >
                      <View
                        style={
                          styles.impactIconCircle
                        }
                      >
                        <Text
                          style={
                            styles.impactIcon
                          }
                        >
                          🌱
                        </Text>
                      </View>

                      <View
                        style={
                          styles.cardHeaderCopy
                        }
                      >
                        <Text
                          style={
                            styles.cardEyebrow
                          }
                        >
                          YOUR IMPACT
                        </Text>
                        <Text
                          style={styles.cardTitle}
                        >
                          সহায়তার প্রভাব
                        </Text>
                      </View>
                    </View>

                    <View
                      style={styles.impactList}
                    >
                      <ImpactRow
                        icon="🧩"
                        title="নতুন interactive lesson"
                        text="শিশুবান্ধব activity ও game তৈরি।"
                      />
                      <ImpactRow
                        icon="📚"
                        title="Ad-free learning"
                        text="মনোযোগ নষ্ট না করে নিরাপদ শেখা।"
                      />
                      <ImpactRow
                        icon="☁️"
                        title="Server ও content maintenance"
                        text="Cloud data ও curriculum সচল রাখা।"
                        last
                      />
                    </View>
                  </View>

                  <View
                    style={styles.donationCard}
                  >
                    <View
                      style={styles.cardHeader}
                    >
                      <View
                        style={
                          styles.amountIconCircle
                        }
                      >
                        <Text
                          style={
                            styles.amountHeaderIcon
                          }
                        >
                          ৳
                        </Text>
                      </View>

                      <View
                        style={
                          styles.cardHeaderCopy
                        }
                      >
                        <Text
                          style={
                            styles.cardEyebrow
                          }
                        >
                          DONATION AMOUNT
                        </Text>
                        <Text
                          style={styles.cardTitle}
                        >
                          পরিমাণ নির্বাচন করুন
                        </Text>
                      </View>
                    </View>

                    <View style={styles.amountRow}>
                      {QUICK_AMOUNTS.map(
                        (item) => {
                          const selected =
                            amount === item;

                          return (
                            <Pressable
                              key={item}
                              onPress={() =>
                                setAmount(item)
                              }
                              style={({ pressed }) => [
                                styles.amountButton,
                                selected &&
                                  styles.amountButtonSelected,
                                pressed &&
                                  styles.pressed,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.amountText,
                                  selected &&
                                    styles.amountTextSelected,
                                ]}
                              >
                                ৳{item}
                              </Text>
                            </Pressable>
                          );
                        },
                      )}
                    </View>

                    <Text
                      style={styles.fieldLabel}
                    >
                      Custom amount
                    </Text>

                    <View
                      style={[
                        styles.customInputWrap,
                        amount &&
                        !validAmount
                          ? styles.customInputError
                          : null,
                      ]}
                    >
                      <Text
                        style={styles.currencyIcon}
                      >
                        ৳
                      </Text>

                      <TextInput
                        value={amount}
                        editable={!submitting}
                        onChangeText={(value) =>
                          setAmount(
                            value.replace(
                              /[^0-9]/g,
                              "",
                            ),
                          )
                        }
                        keyboardType="number-pad"
                        placeholder="500"
                        placeholderTextColor="#AAA1AE"
                        selectionColor="#7553BA"
                        maxLength={6}
                        style={styles.customInput}
                        accessibilityLabel="Donation amount"
                      />
                    </View>

                    {amount &&
                    !validAmount ? (
                      <Text
                        style={
                          styles.amountErrorText
                        }
                      >
                        ৳10 থেকে ৳100,000-এর মধ্যে
                        পরিমাণ দিন।
                      </Text>
                    ) : null}

                    <Text
                      style={[
                        styles.fieldLabel,
                        styles.methodLabel,
                      ]}
                    >
                      Payment method
                    </Text>

                    <View
                      style={styles.methodList}
                    >
                      {PAYMENT_METHODS.map(
                        (item) => {
                          const selected =
                            method === item.id;

                          return (
                            <Pressable
                              key={item.id}
                              onPress={() =>
                                setMethod(item.id)
                              }
                              style={({ pressed }) => [
                                styles.methodButton,
                                selected &&
                                  styles.methodButtonSelected,
                                pressed &&
                                  styles.pressed,
                              ]}
                            >
                              <View
                                style={[
                                  styles.methodIconCircle,
                                  selected &&
                                    styles.methodIconCircleSelected,
                                ]}
                              >
                                <Text
                                  style={
                                    styles.methodIcon
                                  }
                                >
                                  {item.icon}
                                </Text>
                              </View>

                              <View
                                style={
                                  styles.methodCopy
                                }
                              >
                                <Text
                                  style={[
                                    styles.methodTitle,
                                    selected &&
                                      styles.methodTitleSelected,
                                  ]}
                                >
                                  {item.id}
                                </Text>
                                <Text
                                  style={
                                    styles.methodSubtitle
                                  }
                                >
                                  {item.subtitle}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.radioOuter,
                                  selected &&
                                    styles.radioOuterSelected,
                                ]}
                              >
                                {selected ? (
                                  <View
                                    style={
                                      styles.radioInner
                                    }
                                  />
                                ) : null}
                              </View>
                            </Pressable>
                          );
                        },
                      )}
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      disabled={submitting}
                      onPress={donate}
                      style={({ pressed }) => [
                        styles.donateButton,
                        submitting &&
                          styles.donateButtonDisabled,
                        pressed &&
                          !submitting &&
                          styles.donateButtonPressed,
                      ]}
                    >
                      <View
                        style={
                          styles.donateIconCircle
                        }
                      >
                        <Text
                          style={styles.donateIcon}
                        >
                          {submitting
                            ? "…"
                            : "❤️"}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.donateCopy
                        }
                      >
                        <Text
                          style={styles.donateText}
                        >
                          {submitting
                            ? "Processing demo…"
                            : `Demo Donate ৳${
                                validAmount
                                  ? numericAmount.toLocaleString()
                                  : "0"
                              }`}
                        </Text>
                        <Text
                          style={
                            styles.donateSubtext
                          }
                        >
                          via {method}
                        </Text>
                      </View>

                      <Text
                        style={styles.donateArrow}
                      >
                        →
                      </Text>
                    </Pressable>

                    <View
                      style={styles.disclaimerCard}
                    >
                      <Text
                        style={
                          styles.disclaimerIcon
                        }
                      >
                        ℹ️
                      </Text>
                      <Text
                        style={
                          styles.disclaimerText
                        }
                      >
                        এটি university prototype।
                        Real payment gateway সংযুক্ত
                        নয়। Donation কোনো stars,
                        points বা learning advantage
                        দেয় না।
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          <View
            style={[
              styles.bottomNavWrap,
              {
                paddingHorizontal:
                  horizontalPadding,
              },
            ]}
          >
            <View
              style={[
                styles.bottomNavShell,
                { maxWidth },
              ]}
            >
              <BottomNav
                navigation={navigation}
                active="Donation"
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ImpactRow({
  icon,
  title,
  text,
  last = false,
}: {
  icon: string;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.impactRow,
        !last && styles.impactBorder,
      ]}
    >
      <View style={styles.impactRowIcon}>
        <Text
          style={styles.impactRowEmoji}
        >
          {icon}
        </Text>
      </View>

      <View style={styles.impactRowCopy}>
        <Text style={styles.impactRowTitle}>
          {title}
        </Text>
        <Text style={styles.impactRowText}>
          {text}
        </Text>
      </View>

      <Text style={styles.checkIcon}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F3F8",
  },

  keyboard: {
    flex: 1,
  },

  page: {
    flex: 1,
    backgroundColor: "#F6F3F8",
  },

  scrollContent: {
    paddingBottom: 108,
  },

  shell: {
    width: "100%",
    alignSelf: "center",
  },

  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
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
    fontWeight: "500",
    color: "#28232B",
  },

  headerCopy: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },

  headerEyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: "900",
    color: "#978D9B",
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#211D23",
  },

  parentButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#EEE6FF",
  },

  parentIcon: {
    fontSize: 19,
  },

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },

  gateCard: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    padding: 20,
    borderRadius: 30,
    backgroundColor: "#CBBBF2",
  },

  gateOrbOne: {
    position: "absolute",
    top: -70,
    right: -55,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor:
      "rgba(255,255,255,0.23)",
  },

  gateOrbTwo: {
    position: "absolute",
    left: -55,
    bottom: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor:
      "rgba(255,255,255,0.18)",
  },

  gateIconCircle: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor:
      "rgba(255,255,255,0.75)",
    borderRadius: 39,
    backgroundColor:
      "rgba(255,255,255,0.43)",
  },

  gateIcon: {
    fontSize: 38,
  },

  gateTitle: {
    marginTop: 11,
    fontSize: 25,
    fontWeight: "900",
    color: "#171419",
  },

  gateTitleTablet: {
    fontSize: 32,
  },

  gateMessage: {
    maxWidth: 360,
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#5D5264",
    textAlign: "center",
  },

  questionCard: {
    width: "100%",
    alignItems: "center",
    marginTop: 15,
    padding: 14,
    borderRadius: 22,
    backgroundColor:
      "rgba(255,255,255,0.52)",
  },

  questionLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#776A83",
  },

  question: {
    marginTop: 3,
    fontSize: 34,
    fontWeight: "900",
    color: "#4C337F",
  },

  questionTablet: {
    fontSize: 42,
  },

  fieldLabel: {
    alignSelf: "flex-start",
    marginTop: 14,
    marginBottom: 7,
    marginLeft: 4,
    fontSize: 10,
    fontWeight: "900",
    color: "#5A525D",
  },

  gateInput: {
    width: "100%",
    minHeight: 57,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor:
      "rgba(255,255,255,0.82)",
    borderRadius: 19,
    backgroundColor:
      "rgba(255,255,255,0.72)",
    fontSize: 20,
    fontWeight: "900",
    color: "#28232B",
    textAlign: "center",
  },

  unlockButton: {
    width: "100%",
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
    paddingHorizontal: 7,
    borderRadius: 30,
    backgroundColor: "#1A171C",
  },

  unlockButtonPressed: {
    transform: [{ translateY: 2 }],
  },

  unlockIconCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#C98BFF",
  },

  unlockIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  unlockText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  unlockArrow: {
    marginRight: 13,
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  gateNote: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    padding: 10,
    borderRadius: 17,
    backgroundColor:
      "rgba(255,255,255,0.42)",
  },

  gateNoteIcon: {
    fontSize: 16,
  },

  gateNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 8,
    lineHeight: 13,
    fontWeight: "700",
    color: "#655A6B",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: 250,
    padding: 23,
    borderRadius: 30,
    backgroundColor: "#8FD6E8",
  },

  heroOrbOne: {
    position: "absolute",
    top: -82,
    right: -62,
    width: 225,
    height: 225,
    borderRadius: 113,
    backgroundColor:
      "rgba(255,255,255,0.30)",
  },

  heroOrbTwo: {
    position: "absolute",
    left: -70,
    bottom: -95,
    width: 215,
    height: 215,
    borderRadius: 108,
    backgroundColor:
      "rgba(255,255,255,0.20)",
  },

  heroCopy: {
    zIndex: 2,
    width: "64%",
  },

  heroEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#396B78",
  },

  heroTitle: {
    marginTop: 6,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    color: "#15313A",
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
    color: "#3F6974",
  },

  tigerCircle: {
    position: "absolute",
    top: 25,
    right: 18,
    width: 126,
    height: 126,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 63,
    backgroundColor:
      "rgba(255,255,255,0.50)",
  },

  tiger: {
    width: 110,
    height: 110,
  },

  voluntaryBadge: {
    position: "absolute",
    left: 23,
    bottom: 21,
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  voluntaryIcon: {
    fontSize: 15,
  },

  voluntaryText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#44646D",
  },

  impactCard: {
    marginTop: 13,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  impactIconCircle: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#E4F4E1",
  },

  impactIcon: {
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

  impactList: {
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#F8F6F9",
  },

  impactRow: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },

  impactBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E7E2E9",
  },

  impactRowIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },

  impactRowEmoji: {
    fontSize: 18,
  },

  impactRowCopy: {
    flex: 1,
    marginLeft: 9,
  },

  impactRowTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#3D3740",
  },

  impactRowText: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 12,
    fontWeight: "700",
    color: "#847B87",
  },

  checkIcon: {
    fontSize: 17,
    fontWeight: "900",
    color: "#58A950",
  },

  donationCard: {
    marginTop: 13,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },

  amountIconCircle: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#FFF1C8",
  },

  amountHeaderIcon: {
    fontSize: 22,
    fontWeight: "900",
    color: "#B77A13",
  },

  amountRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 13,
  },

  amountButton: {
    flex: 1,
    minHeight: 51,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E1DCE5",
    borderRadius: 18,
    backgroundColor: "#F8F6F9",
  },

  amountButtonSelected: {
    borderColor: "#7553BA",
    backgroundColor: "#EEE6FF",
  },

  amountText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#625A65",
  },

  amountTextSelected: {
    color: "#593C99",
  },

  customInputWrap: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderWidth: 2,
    borderColor: "#D9D2DE",
    borderRadius: 19,
    backgroundColor: "#FBFAFC",
  },

  customInputError: {
    borderColor: "#D96363",
    backgroundColor: "#FFF7F7",
  },

  currencyIcon: {
    fontSize: 19,
    fontWeight: "900",
    color: "#7553BA",
  },

  customInput: {
    flex: 1,
    minHeight: 53,
    marginLeft: 9,
    fontSize: 17,
    fontWeight: "900",
    color: "#28232B",
  },

  amountErrorText: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 8,
    fontWeight: "800",
    color: "#B34C4C",
  },

  methodLabel: {
    marginTop: 17,
  },

  methodList: {
    gap: 8,
  },

  methodButton: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    padding: 9,
    borderWidth: 2,
    borderColor: "#E1DCE5",
    borderRadius: 19,
    backgroundColor: "#FBFAFC",
  },

  methodButtonSelected: {
    borderColor: "#7553BA",
    backgroundColor: "#F4EFFF",
  },

  methodIconCircle: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  methodIconCircleSelected: {
    backgroundColor: "#EEE6FF",
  },

  methodIcon: {
    fontSize: 21,
  },

  methodCopy: {
    flex: 1,
    marginLeft: 10,
  },

  methodTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#514A54",
  },

  methodTitleSelected: {
    color: "#593C99",
  },

  methodSubtitle: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "700",
    color: "#918895",
  },

  radioOuter: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#CBC4CE",
    borderRadius: 11,
  },

  radioOuterSelected: {
    borderColor: "#7553BA",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#7553BA",
  },

  donateButton: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 7,
    borderRadius: 32,
    backgroundColor: "#E54884",
    shadowColor: "#C43E70",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 6,
  },

  donateButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },

  donateButtonPressed: {
    transform: [{ translateY: 2 }],
  },

  donateIconCircle: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },

  donateIcon: {
    fontSize: 20,
  },

  donateCopy: {
    flex: 1,
    marginLeft: 12,
  },

  donateText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  donateSubtext: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "700",
    color: "#FFE6EF",
  },

  donateArrow: {
    marginRight: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  disclaimerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 13,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "#FFF3D0",
  },

  disclaimerIcon: {
    width: 24,
    height: 24,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 12,
    backgroundColor: "#E1A329",
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  disclaimerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 8,
    lineHeight: 13,
    fontWeight: "700",
    color: "#715D2E",
  },

  bottomNavWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 7,
  },

  bottomNavShell: {
    width: "100%",
    alignSelf: "center",
  },
});
