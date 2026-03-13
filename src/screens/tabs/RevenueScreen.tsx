import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { getRevenue } from '../../lib/api';
import { Colors } from '../../constants/colors';

export default function RevenueScreen() {
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const res = await getRevenue();
      if (res.success) setRevenue(res.data || res);
    } catch (e) { console.log('Revenue error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchRevenue(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchRevenue(); };

  const revenueCards = revenue ? [
    { label: 'Today', value: revenue.today || revenue.todayRevenue || 0, color: Colors.success, subtitle: 'Current Day' },
    { label: 'This Week', value: revenue.weekly || revenue.weeklyRevenue || 0, color: Colors.accent, subtitle: 'Last 7 Days' },
    { label: 'This Month', value: revenue.monthly || revenue.monthlyRevenue || 0, color: Colors.primary, subtitle: 'Last 30 Days' },
    { label: 'This Year', value: revenue.yearly || revenue.yearlyRevenue || 0, color: Colors.warning, subtitle: 'Current Year' },
  ] : [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.title}>Revenue Performance</Text>
        <Text style={styles.subtitle}>Track your salon growth across time periods</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : revenue ? (
          <>
            <View style={styles.grid}>
              {revenueCards.map((card) => (
                <View key={card.label} style={styles.revenueCard}>
                  <View style={[styles.cardHeader, { backgroundColor: card.color + '10' }]}>
                    <Text style={[styles.cardLabel, { color: card.color }]}>{card.label}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.currency}>₹</Text>
                    <Text style={[styles.amount, { color: Colors.textPrimary }]}>
                       {Number(card.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={styles.cardSub}>{card.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Payment Mode Breakdown */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💰 Collections Breakdown</Text>
            </View>

            <View style={styles.breakdownList}>
               <View style={styles.breakdownItem}>
                  <View style={[styles.iconBox, { backgroundColor: Colors.success + '20' }]}><Text>💵</Text></View>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.breakdownName}>Cash Payments</Text>
                     <Text style={styles.breakdownValue}>₹{Number(revenue.cashRevenue || 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: '60%', backgroundColor: Colors.success }]} />
                  </View>
               </View>

               <View style={styles.breakdownItem}>
                  <View style={[styles.iconBox, { backgroundColor: Colors.info + '20' }]}><Text>📱</Text></View>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.breakdownName}>Digital Payments</Text>
                     <Text style={styles.breakdownValue}>₹{Number(revenue.digitalRevenue || 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: '40%', backgroundColor: Colors.info }]} />
                  </View>
               </View>
            </View>

            <View style={styles.infoBox}>
               <Text>💡 </Text>
               <Text style={styles.infoText}>Revenue data is calculated based on completed bills and verified payments.</Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyView}>
            <Text style={{ fontSize: 40 }}>📊</Text>
            <Text style={styles.emptyText}>No revenue data found.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchRevenue}>
               <Text style={styles.refreshBtnText}>Reload Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  revenueCard: {
    width: '47.8%', backgroundColor: Colors.surface, borderRadius: 24,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardHeader: { padding: 12, alignItems: 'center' },
  cardLabel: { fontSize: 12, fontWeight: 'bold' },
  cardBody: { padding: 16, alignItems: 'center' },
  currency: { fontSize: 13, color: Colors.textMuted, fontWeight: 'bold' },
  amount: { fontSize: 22, fontWeight: 'black', marginVertical: 4 },
  cardSub: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' },
  sectionHeader: { marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  breakdownList: { gap: 12 },
  breakdownItem: { 
    backgroundColor: Colors.surface, borderRadius: 20, padding: 16, 
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border 
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  breakdownName: { fontSize: 12, color: Colors.textSecondary, fontWeight: 'bold' },
  breakdownValue: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 2 },
  progressContainer: { width: 60, height: 6, backgroundColor: Colors.border, borderRadius: 3, marginLeft: 10, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  infoBox: { 
    flexDirection: 'row', backgroundColor: Colors.surfaceElevated, 
    borderRadius: 16, padding: 16, marginTop: 30, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border 
  },
  infoText: { flex: 1, color: Colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
  emptyView: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: Colors.textMuted, fontSize: 16, marginVertical: 10 },
  refreshBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  refreshBtnText: { color: '#fff', fontWeight: 'bold' },
});
