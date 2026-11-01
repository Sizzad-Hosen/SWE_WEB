import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "./src/web/dom";
import { StatusBar } from "./src/web/status-bar";

import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/contexts/AuthContext";
import { useGamificationStore } from "./src/features/gamification/store/gamificationStore";
import { useStudentStore } from "./src/features/student/store/studentStore";
import { useLessonSessionStore } from "./src/features/learning/store/lessonSessionStore";

function AppContent() {
  const [ready, setReady] = useState(false);

  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const loadProgress = useGamificationStore(
    (state) => state.loadLocalProgress,
  );
  const loadStudent = useStudentStore(
    (state) => state.loadStudent,
  );
  const loadLessonSessions = useLessonSessionStore(
    (state) => state.loadSessions,
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale]);

  useEffect(() => {
    let active = true;

    Promise.all([
      loadProgress(),
      loadStudent(),
      loadLessonSessions(),
    ])
      .catch((error) => {
        console.warn("Local restore failed", error);
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [
    loadLessonSessions,
    loadProgress,
    loadStudent,
  ]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <StatusBar style="dark" />

        <View style={styles.starRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.smallStar}>★</Text>
          <Text style={styles.star}>★</Text>
        </View>

        <Animated.View
          style={[
            styles.logoCard,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={'/splash-icon.png'}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.title}>NCTB Kids</Text>
        <Text style={styles.subtitle}>
          শিখি আনন্দে, এগিয়ে যাই
        </Text>

        <View style={styles.loadingRow}>
          <ActivityIndicator
            size="small"
            color="#54B948"
          />
          <Text style={styles.loadingText}>
            শেখার জগৎ প্রস্তুত হচ্ছে...
          </Text>
        </View>

        <View style={styles.dotRow}>
          <View style={[styles.dot, styles.blueDot]} />
          <View style={[styles.dot, styles.yellowDot]} />
          <View style={[styles.dot, styles.pinkDot]} />
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#FFFDF7",
  },

  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  star: {
    fontSize: 24,
    color: "#FFBF1A",
  },

  smallStar: {
    fontSize: 16,
    color: "#F65B9A",
  },

  logoCard: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 48,
    backgroundColor: "#FFFFFF",
    shadowColor: "#5B4A7A",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },

  logo: {
    width: 238,
    height: 238,
  },

  title: {
    marginTop: 24,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0.3,
    color: "#2F2268",
  },

  subtitle: {
    marginTop: 7,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: "#EC4F8B",
    textAlign: "center",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 30,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "#F3FAEE",
  },

  loadingText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#507046",
  },

  dotRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  blueDot: {
    backgroundColor: "#2398DD",
  },

  yellowDot: {
    backgroundColor: "#FFBE1B",
  },

  pinkDot: {
    backgroundColor: "#F45191",
  },
});
