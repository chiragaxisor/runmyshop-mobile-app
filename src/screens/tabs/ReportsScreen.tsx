import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Modal, TextInput,
  ActivityIndicator, RefreshControl, TouchableOpacity, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getReports, getCustomers, getServices } from '../../lib/api';
import { Colors } from '../../constants/colors';

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  // Filter State
  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const [filterModal, setFilterModal] = useState(false);
  const [filters, setFilters] = useState<any>({
    customerId: 'all',
    serviceId: 'all',
    paymentMethod: 'all',
  });

  // Master Data for filters
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const getDateRange = (range: string) => {
    const now = new Date();
    const endStr = now.toISOString().split('T')[0];
    if (range === 'today') return { startDate: endStr, endDate: endStr };
    if (range === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return { startDate: start.toISOString().split('T')[0], endDate: endStr };
    }
    if (range === 'month') {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      return { startDate: start.toISOString().split('T')[0], endDate: endStr };
    }
    return { 
      startDate: customStart.toISOString().split('T')[0], 
      endDate: customEnd.toISOString().split('T')[0] 
    };
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(selectedRange);
      const params: any = { startDate, endDate };
      if (filters.customerId !== 'all') params.customerId = filters.customerId;
      if (filters.serviceId !== 'all') params.serviceId = filters.serviceId;
      if (filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;

      const res = await getReports(params);
      if (res.success) {
        setBills(res.data || res.bills || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (e) {
      console.log('Reports error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFilterData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([getCustomers(1, 1000), getServices()]);
      if (cRes.success) setCustomers(cRes.data || cRes.customers || []);
      if (sRes.success) setServices(sRes.data || []);
    } catch (e) { console.log('Filter load error:', e); }
  };

  useEffect(() => {
    fetchReports();
    loadFilterData();
  }, [selectedRange]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  return (
    <View style={styles.container}>
      <View style={styles.rangeHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeScroll}>
          {(['today', 'week', 'month', 'custom'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, selectedRange === r && styles.rangeBtnActive]}
              onPress={() => setSelectedRange(r)}
            >
              <Text style={[styles.rangeBtnText, selectedRange === r && styles.rangeBtnTextActive]}>
                {r === 'today' ? 'Today' : r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : '📅 Custom'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.filterToggle} onPress={() => setFilterModal(true)}>
             <Text style={styles.filterToggleText}>🔍 Advanced Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {selectedRange === 'custom' && (
        <View style={styles.customDateRow}>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStart(true)}>
            <Text style={styles.datePickerLabel}>From</Text>
            <Text style={styles.datePickerValue}>{customStart.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEnd(true)}>
            <Text style={styles.datePickerLabel}>To</Text>
            <Text style={styles.datePickerValue}>{customEnd.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={fetchReports}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}

      {showStart && <DateTimePicker value={customStart} mode="date" onChange={(e: any, d?: Date) => { setShowStart(false); if (d) setCustomStart(d); }} />}
      {showEnd && <DateTimePicker value={customEnd} mode="date" onChange={(e: any, d?: Date) => { setShowEnd(false); if (d) setCustomEnd(d); }} />}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 50 }} />
        ) : (
          <>
            {summary && (
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, { backgroundColor: Colors.success + '10', borderColor: Colors.success + '30' }]}>
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={[styles.summaryValue, { color: Colors.success }]}>₹{Number(summary.totalAmount || summary.total || 0).toFixed(0)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '30' }]}>
                  <Text style={styles.summaryLabel}>Total Bills</Text>
                  <Text style={[styles.summaryValue, { color: Colors.primary }]}>{bills.length}</Text>
                </View>
              </View>
            )}

            <View style={styles.breakdownBox}>
               <Text style={styles.sectionTitle}>💰 Payment Summary</Text>
               <View style={styles.statRow}><Text style={styles.statName}>Paid Amount</Text><Text style={[styles.statAmt, { color: Colors.success }]}>₹{summary?.totalPaid || 0}</Text></View>
               <View style={styles.statRow}><Text style={styles.statName}>Pending / Due</Text><Text style={[styles.statAmt, { color: Colors.error }]}>₹{summary?.totalPending || 0}</Text></View>
               
               {summary?.paymentBreakdown?.length > 0 && (
                 <View style={styles.miniGrid}>
                    {summary.paymentBreakdown.map((pb: any) => (
                      <View key={pb.method} style={styles.miniCard}>
                         <Text style={styles.miniLabel}>{pb.method}</Text>
                         <Text style={styles.miniValue}>₹{pb.amount}</Text>
                      </View>
                    ))}
                 </View>
               )}
            </View>

            <Text style={styles.detailedTitle}>Transaction History</Text>
            {bills.length === 0 ? (
              <Text style={styles.empty}>No logs found for selected filters.</Text>
            ) : (
              bills.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.billCard}
                  onPress={() => navigation.navigate('BillDetails', { billId: item.id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billName}>{item.customer_name}</Text>
                    <Text style={styles.billMeta}>#{item.tenant_invoice_number || item.id} • {new Date(item.created_at).toLocaleDateString()} • {item.payment_method}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.billAmount}>₹{Number(item.total_amount).toFixed(0)}</Text>
                    <Text style={styles.clickHint}>Details ›</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={filterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Search</Text>
              <TouchableOpacity onPress={() => setFilterModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 20 }}>
              <View>
                <Text style={styles.filterLabel}>Customer</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                  <TouchableOpacity style={[styles.chip, filters.customerId === 'all' && styles.chipActive]} onPress={() => setFilters({ ...filters, customerId: 'all' })}>
                    <Text style={[styles.chipText, filters.customerId === 'all' && styles.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {customers.slice(0, 10).map(c => (
                    <TouchableOpacity key={c.id} style={[styles.chip, filters.customerId === c.id.toString() && styles.chipActive]} onPress={() => setFilters({ ...filters, customerId: c.id.toString() })}>
                      <Text style={[styles.chipText, filters.customerId === c.id.toString() && styles.chipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text style={styles.filterLabel}>Service / Staff Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                  <TouchableOpacity style={[styles.chip, filters.serviceId === 'all' && styles.chipActive]} onPress={() => setFilters({ ...filters, serviceId: 'all' })}>
                    <Text style={[styles.chipText, filters.serviceId === 'all' && styles.chipTextActive]}>All Services</Text>
                  </TouchableOpacity>
                  {services.slice(0, 8).map(s => (
                    <TouchableOpacity key={s.id} style={[styles.chip, filters.serviceId === s.id.toString() && styles.chipActive]} onPress={() => setFilters({ ...filters, serviceId: s.id.toString() })}>
                      <Text style={[styles.chipText, filters.serviceId === s.id.toString() && styles.chipTextActive]}>{s.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text style={styles.filterLabel}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                  {['all', 'Cash', 'GPay', 'PhonePe', 'Pending'].map(m => (
                    <TouchableOpacity key={m} style={[styles.chip, filters.paymentMethod === m && styles.chipActive]} onPress={() => setFilters({ ...filters, paymentMethod: m })}>
                      <Text style={[styles.chipText, filters.paymentMethod === m && styles.chipTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: Colors.surfaceElevated }]} onPress={() => { setFilters({ customerId: 'all', serviceId: 'all', paymentMethod: 'all' }); }}>
                   <Text style={{ color: Colors.textPrimary, fontWeight: 'bold' }}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { flex: 2, backgroundColor: Colors.primary }]} onPress={() => { setFilterModal(false); fetchReports(); }}>
                   <Text style={{ color: '#fff', fontWeight: 'bold' }}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rangeHeader: { backgroundColor: Colors.surface, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rangeScroll: { paddingHorizontal: 16, gap: 10 },
  rangeBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  rangeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rangeBtnText: { color: Colors.textSecondary, fontWeight: 'bold', fontSize: 13 },
  rangeBtnTextActive: { color: '#fff' },
  filterToggle: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.accent + '20', borderWidth: 1, borderColor: Colors.accent + '40' },
  filterToggleText: { color: Colors.accent, fontWeight: 'bold', fontSize: 13 },
  customDateRow: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 12, paddingHorizontal: 16, gap: 10, alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: Colors.border },
  datePickerBtn: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: Colors.border },
  datePickerLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: 'bold', marginBottom: 2 },
  datePickerValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  applyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  applyBtnText: { color: '#fff', fontWeight: 'bold' },
  content: { padding: 16 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  summaryValue: { fontSize: 24, fontWeight: 'black' },
  breakdownBox: { backgroundColor: Colors.surface, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  statName: { color: Colors.textSecondary, fontSize: 13 },
  statAmt: { fontWeight: 'bold', fontSize: 15 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  miniCard: { backgroundColor: Colors.surfaceElevated, borderRadius: 10, padding: 10, minWidth: '30%', borderWidth: 1, borderColor: Colors.border },
  miniLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: 'bold', textTransform: 'uppercase' },
  miniValue: { fontSize: 13, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 2 },
  detailedTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12, marginTop: 10 },
  billCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  billName: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 14 },
  billMeta: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  billAmount: { color: Colors.primary, fontWeight: 'black', fontSize: 16 },
  clickHint: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  closeBtn: { fontSize: 24, color: Colors.textMuted },
  filterLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  filterChips: { flexDirection: 'row', marginHorizontal: -4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surfaceElevated, marginHorizontal: 4, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  actionBtn: { padding: 16, borderRadius: 14, alignItems: 'center' },
});
