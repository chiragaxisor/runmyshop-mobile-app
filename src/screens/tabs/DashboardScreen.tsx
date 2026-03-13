import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats } from '../../lib/api';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
}

function StatCard({ icon, label, value, color, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.quickBtn, { borderColor: color + '50' }]} onPress={onPress}>
      <Text style={{ fontSize: 28, marginBottom: 6 }}>{icon}</Text>
      <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      if (res.success) setStats(res.data || res);
    } catch (error) {
      console.log('Dashboard stats error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.username}>{user?.username || 'Admin'} 👋</Text>
        <Text style={styles.greetingMeta}>Here's your business overview</Text>
      </View>

      {/* Stats Cards */}
      <Text style={styles.sectionTitle}>📊 Overview</Text>
      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginVertical: 40 }} />
      ) : (
        <View style={styles.statsGrid}>
          <StatCard icon="👥" label="Customers" value={stats?.customers ?? '—'} color={Colors.cards.customers} onPress={() => navigation.navigate('Customers')} />
          <StatCard icon="📦" label="Services" value={stats?.services ?? '—'} color={Colors.accent} />
          <StatCard icon="📅" label="Today's Appt." value={stats?.todayAppointments ?? '—'} color={Colors.cards.appointments} onPress={() => navigation.navigate('Appointments')} />
          <StatCard icon="📂" label="Categories" value={stats?.categories ?? '—'} color={Colors.warning} />
          <StatCard icon="🎁" label="Packages" value={stats?.packages ?? '—'} color={Colors.cards.revenue} />
          <StatCard icon="🖼️" label="Gallery" value={stats?.gallery ?? '—'} color={Colors.primaryLight} />
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.quickGrid}>
        <QuickAction icon="🧾" label="New Bill" color={Colors.accent} onPress={() => navigation.navigate('Billing')} />
        <QuickAction icon="👤" label="Add Customer" color={Colors.primary} onPress={() => navigation.navigate('Customers')} />
        <QuickAction icon="📅" label="Book Appt." color={Colors.success} onPress={() => navigation.navigate('Appointments')} />
        <QuickAction icon="📈" label="Reports" color={Colors.warning} onPress={() => navigation.navigate('More', { screen: 'Reports' })} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  greetingSection: {
    marginBottom: 28, backgroundColor: Colors.surface, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  greeting: { color: Colors.textSecondary, fontSize: 16 },
  username: { color: Colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  greetingMeta: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 14, marginTop: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
    width: '47%', borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { fontSize: 26, marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickBtn: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
    width: '47%', alignItems: 'center', borderWidth: 1,
  },
});
