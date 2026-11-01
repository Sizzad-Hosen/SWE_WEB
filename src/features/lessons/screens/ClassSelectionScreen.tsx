import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from '../../../web/dom';

import type { ScreenProps } from '../../../navigation/routes';
import { lessonData } from '../data/lessonData';

export default function ClassSelectionScreen({ navigation }: ScreenProps<'ClassSelection'>) {
  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={lessonData}
      keyExtractor={(item) => String(item.classId)}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Choose Your Class</Text>
          <Text style={styles.subtitle}>Start learning with videos and quizzes.</Text>
        </>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate('Subjects', { classId: item.classId })}
        >
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.subjects.length} subjects available</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 16,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2563EB',
  },
  cardSubtitle: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 15,
  },
});
