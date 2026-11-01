import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from '../../../web/dom';

import { useLeaderboard } from '../hooks/useLeaderboard';

export default function LeaderboardScreen() {
  const { users, loading, error, reload } = useLeaderboard();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.infoText}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.button} onPress={reload}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={users}
      keyExtractor={(item) => item.user_id}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>🏆 Top Learners</Text>
          <Text style={styles.subtitle}>Leaderboard is updated from your secure backend.</Text>
        </>
      }
      renderItem={({ item, index }) => (
        <View style={styles.row}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.display_name}</Text>
            <Text style={styles.meta}>Class {item.class_level} • {item.chapters_completed} chapters</Text>
          </View>
          <Text style={styles.stars}>⭐ {item.total_stars}</Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No leaderboard data yet.</Text>
      }
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
    padding: 24,
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 1,
  },
  rank: {
    width: 44,
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  meta: {
    marginTop: 3,
    color: '#64748B',
  },
  stars: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F59E0B',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#64748B',
  },
  infoText: {
    marginTop: 10,
    color: '#64748B',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
