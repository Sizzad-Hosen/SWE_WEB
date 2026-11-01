import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from '../../../web/dom';

import type { ScreenProps } from '../../../navigation/routes';
import { getSubjectById } from '../data/lessonData';
import { useGamificationStore } from '../../gamification/store/gamificationStore';

export default function ChapterListScreen({ route, navigation }: ScreenProps<'ChapterList'>) {
  const { classId, subjectId } = route.params;

  const subject = getSubjectById(classId, subjectId);

  const unlockedChapterIds = useGamificationStore((state) => state.unlockedChapterIds);
  const completedChapters = useGamificationStore((state) => state.completedChapters);

  if (!subject) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Subject not found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={subject.chapters}
      keyExtractor={(item) => item.chapterId}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>{subject.emoji} {subject.name}</Text>
          <Text style={styles.subtitle}>Watch lesson, pass quiz, earn stars.</Text>
        </>
      }
      renderItem={({ item, index }) => {
        const isFirstChapter = index === 0;
        const isUnlocked = isFirstChapter || unlockedChapterIds.includes(item.chapterId);
        const isCompleted = Boolean(completedChapters[item.chapterId]);

        return (
          <Pressable
            style={[styles.card, !isUnlocked && styles.lockedCard]}
            disabled={!isUnlocked}
            onPress={() =>
              navigation.navigate('Player', {
                chapterId: item.chapterId,
                title: item.title,
                videoUrl: item.videoUrl,
                quizId: item.quizId,
                nextChapterId: item.nextChapterId,
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.status}>
                {isCompleted ? '✅ Done' : isUnlocked ? '▶️ Start' : '🔒 Locked'}
              </Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.reward}>Reward: ⭐ {item.starsReward}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: '#64748B',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
  },
  lockedCard: {
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
  },
  status: {
    fontWeight: '800',
    color: '#2563EB',
  },
  description: {
    marginTop: 8,
    color: '#64748B',
  },
  reward: {
    marginTop: 10,
    color: '#F59E0B',
    fontWeight: '800',
  },
  errorText: {
    color: '#DC2626',
  },
});
