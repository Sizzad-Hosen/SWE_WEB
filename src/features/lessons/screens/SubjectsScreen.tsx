import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from '../../../web/dom';

import type { ScreenProps } from '../../../navigation/routes';
import { getClassById } from '../data/lessonData';

export default function SubjectsScreen({ route, navigation }: ScreenProps<'Subjects'>) {
  const classId = route.params?.classId ?? 1;
  const classItem = getClassById(classId);

  if (!classItem) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Class not found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={classItem.subjects}
      keyExtractor={(item) => item.subjectId}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>{classItem.name}</Text>
          <Text style={styles.subtitle}>Choose a subject.</Text>
        </>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() =>
            navigation.navigate('ChapterList', {
              classId,
              subjectId: item.subjectId,
            })
          }
        >
          <Text style={styles.emoji}>{item.emoji}</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.chapters.length} chapters</Text>
          </View>
        </Pressable>
      )}
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
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    color: '#64748B',
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
  },
  emoji: {
    fontSize: 38,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardSubtitle: {
    marginTop: 4,
    color: '#64748B',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
  },
});
