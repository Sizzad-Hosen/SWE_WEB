import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from '../web/dom';

import type { ScreenProps } from '../navigation/routes';
import { useStudentStore } from '../features/student/store/studentStore';
import { useGamificationStore } from '../features/gamification/store/gamificationStore';
import { getClassById } from '../features/lessons/data/lessonData';

const books = [
  { subjectId: 'bangla', title: 'বাংলা', subtitle: 'গল্পের বন', emoji: '📕', color: '#FF6B6B' },
  { subjectId: 'english', title: 'English', subtitle: 'Doyel Garden', emoji: '📘', color: '#4D96FF' },
  { subjectId: 'math', title: 'গণিত', subtitle: 'সংখ্যার নদী', emoji: '📗', color: '#49B66F' },
] as const;

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const student = useStudentStore((state) => state.student);
  const stars = useGamificationStore((state) => state.stars);
  const completedCount = useGamificationStore((state) => Object.keys(state.completedChapters).length);
  const classId = student?.classLevel ?? 1;
  const classData = getClassById(classId);

  const openSubject = (subjectId: string, title: string) => {
    const exists = classData?.subjects.some((item) => item.subjectId === subjectId);
    if (!exists) {
      Alert.alert('Coming soon!', `${title} lessons for Class ${classId} are being prepared.`);
      return;
    }
    navigation.navigate('ChapterList', { classId, subjectId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.hello}>আজ কী শিখবে?</Text>
            <Text style={styles.classText}>Class {classId} · {student?.studentCode}</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable style={styles.iconButton} onPress={() => Alert.alert('Leaderboard', 'University demo milestone 2-এ এটি যোগ হবে।')}>
              <Text style={styles.icon}>🏆</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => Alert.alert('Parent Area', 'Adult gate দিয়ে Parent Area পরবর্তী milestone-এ যোগ হবে।')}>
              <Text style={styles.icon}>⚙️</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.guideCard}>
          <Image source={'/images/tiger.png'} style={styles.mascot} resizeMode="contain" />
          <View style={styles.speechBubble}>
            <Text style={styles.speechTitle}>চলো অভিযান শুরু করি!</Text>
            <Text style={styles.speechText}>আজ আমরা কোন বই জয় করব?</Text>
          </View>
        </View>

        <View style={styles.progressStrip}>
          <Text style={styles.progressText}>⭐ {stars} Stars</Text>
          <Text style={styles.progressText}>✅ {completedCount} Chapters</Text>
        </View>

        <Text style={styles.sectionTitle}>একটি বই বেছে নাও</Text>

        {books.map((book) => (
          <Pressable
            key={book.subjectId}
            style={[styles.book, { backgroundColor: book.color }]}
            onPress={() => openSubject(book.subjectId, book.title)}
          >
            <View style={styles.bookSpine} />
            <Text style={styles.bookEmoji}>{book.emoji}</Text>
            <View style={styles.bookText}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookSubtitle}>{book.subtitle}</Text>
            </View>
            <Text style={styles.bookArrow}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9E9' },
  container: { padding: 20, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hello: { fontSize: 27, fontWeight: '900', color: '#342613' },
  classText: { marginTop: 4, fontSize: 13, fontWeight: '700', color: '#8B6C3E' },
  topActions: { flexDirection: 'row', gap: 9 },
  iconButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  icon: { fontSize: 23 },
  guideCard: { marginTop: 20, minHeight: 145, borderRadius: 30, backgroundColor: '#DFF7D4', flexDirection: 'row', alignItems: 'center', padding: 14, overflow: 'hidden' },
  mascot: { width: 118, height: 128, marginBottom: -15 },
  speechBubble: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 15 },
  speechTitle: { fontSize: 18, fontWeight: '900', color: '#315C2B' },
  speechText: { marginTop: 5, fontSize: 15, lineHeight: 21, fontWeight: '600', color: '#567052' },
  progressStrip: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, elevation: 1 },
  progressText: { fontSize: 15, fontWeight: '900', color: '#654A25' },
  sectionTitle: { marginTop: 24, marginBottom: 12, fontSize: 22, fontWeight: '900', color: '#342613' },
  book: { minHeight: 112, marginBottom: 15, borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, elevation: 4, overflow: 'hidden' },
  bookSpine: { position: 'absolute', left: 13, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(0,0,0,0.13)' },
  bookEmoji: { marginLeft: 10, marginRight: 15, fontSize: 43 },
  bookText: { flex: 1 },
  bookTitle: { fontSize: 25, fontWeight: '900', color: '#FFFFFF' },
  bookSubtitle: { marginTop: 3, fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.88)' },
  bookArrow: { fontSize: 42, fontWeight: '700', color: '#FFFFFF' },
});
