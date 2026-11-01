import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from '../../../web/dom';
import type { ScreenProps } from '../../../navigation/routes';
import { AppHeader } from '../../../components/AppHeader';
import { BottomNav } from '../../../components/BottomNav';
import { useStudentStore } from '../../student/store/studentStore';
import { useGamificationStore } from '../../gamification/store/gamificationStore';
import { colors, shadows } from '../../../theme/theme';

const demo = [
  { name: 'সাবা', avatar: '👧', points: 480, rank: 1 }, { name: 'আরিফ', avatar: '👦', points: 420, rank: 2 }, { name: 'রিয়া', avatar: '👧', points: 400, rank: 3 },
  { name: 'আদিব', avatar: '👦', points: 360, rank: 4 }, { name: 'মীম', avatar: '👧', points: 330, rank: 5 }, { name: 'রাফি', avatar: '👦', points: 300, rank: 6 },
];

export default function LeaderboardV2Screen({ navigation }: ScreenProps<'Leaderboard'>) {
  const student = useStudentStore((state) => state.student); const stars = useGamificationStore((state) => state.stars);
  const me = { name: student?.nickname ?? 'তুমি', avatar: student?.avatar ?? '🐯', points: stars, rank: 15 };
  return <SafeAreaView style={styles.safe}><View style={styles.page}><AppHeader title="সেরাদের তালিকা" onParentPress={() => navigation.navigate('AdultGate', { destination: 'parent' })} /><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>সেরাদের তালিকা</Text><View style={styles.classPill}><Text style={styles.classText}>Class {student?.classLevel ?? 1} · Weekly Ranking</Text></View>
    <View style={styles.podium}><Podium item={demo[1]} height={125} color="#D8E4EE" /><Podium item={demo[0]} height={165} color="#FFD43B" /><Podium item={demo[2]} height={105} color="#FFB07A" /></View>
    {demo.slice(3, 5).map((item) => <RankRow key={item.rank} item={item} />)}
    <View style={styles.me}><Text style={styles.rank}>{me.rank}</Text><Text style={styles.avatar}>{me.avatar}</Text><View style={styles.nameArea}><Text style={styles.name}>{me.name}</Text><Text style={styles.small}>তোমার অবস্থান</Text></View><Text style={styles.points}>⭐ {me.points}</Text></View>
    {demo.slice(5).map((item) => <RankRow key={item.rank} item={item} />)}
    <Text style={styles.privacy}>Leaderboard-এ শুধু nickname ও avatar দেখানো হয়।</Text>
  </ScrollView><BottomNav navigation={navigation} active="Leaderboard" /></View></SafeAreaView>;
}

function Podium({ item, height, color }: { item: typeof demo[number]; height: number; color: string }) { return <View style={styles.podiumSlot}><Text style={styles.podiumAvatar}>{item.avatar}</Text><View style={[styles.podiumBlock, { height, backgroundColor: color }]}><Text style={styles.podiumRank}>{item.rank}</Text><Text style={styles.podiumName}>{item.name}</Text><Text style={styles.podiumPoints}>{item.points}</Text></View></View>; }
function RankRow({ item }: { item: typeof demo[number] }) { return <View style={styles.row}><Text style={styles.rank}>{item.rank}</Text><Text style={styles.avatar}>{item.avatar}</Text><View style={styles.nameArea}><Text style={styles.name}>{item.name}</Text><Text style={styles.small}>Class ranking</Text></View><Text style={styles.points}>⭐ {item.points}</Text></View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, page: { flex: 1, padding: 10 }, content: { padding: 8, paddingBottom: 18 }, title: { marginTop: 14, fontSize: 24, fontWeight: '900', color: '#126D90', textAlign: 'center' }, classPill: { alignSelf: 'center', marginTop: 5, backgroundColor: colors.orange, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 }, classText: { fontSize: 11, fontWeight: '900', color: '#FFF' }, podium: { height: 230, marginTop: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }, podiumSlot: { width: '31%', alignItems: 'center' }, podiumAvatar: { fontSize: 42, marginBottom: -4, zIndex: 2 }, podiumBlock: { width: '100%', borderTopLeftRadius: 25, borderTopRightRadius: 25, alignItems: 'center', paddingTop: 13, ...shadows.card }, podiumRank: { fontSize: 22, fontWeight: '900', color: colors.ink }, podiumName: { marginTop: 4, fontWeight: '900' }, podiumPoints: { marginTop: 3, fontSize: 11, fontWeight: '800' }, row: { minHeight: 61, marginTop: 9, borderRadius: 20, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, ...shadows.card }, me: { minHeight: 65, marginTop: 9, borderRadius: 20, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, ...shadows.card }, rank: { width: 28, fontWeight: '900', color: '#126D90' }, avatar: { fontSize: 30 }, nameArea: { flex: 1, marginLeft: 8 }, name: { fontWeight: '900', color: colors.ink }, small: { fontSize: 10, color: colors.muted }, points: { fontWeight: '900', color: colors.greenDark }, privacy: { marginTop: 16, textAlign: 'center', fontSize: 11, color: colors.muted } });
