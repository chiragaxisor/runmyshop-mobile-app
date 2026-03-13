import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getAppointments, getBills } from '../lib/api';
import { Colors } from '../constants/colors';

export default function CustomerDetailsScreen() {
  const route = useRoute<any>();
  const { customer } = route.params;

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Apps' | 'Bills'>('Apps');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Note: Backend might need specific filters, but using existing ones for now
      // and filtering locally if needed, or using search/id if API supports it.
      // Based on web code, it calls getAppointments and getBills with customerId.
      const [appRes, billRes] = await Promise.all([
        getAppointments(), // Assume these return all or we can filter
        getBills(1, 100)
      ]);

      if (appRes.success) {
        setAppointments(appRes.data.filter((a: any) => a.customer_id === customer.id));
      }
      if (billRes.success) {
        setBills((billRes.data || billRes.bills || []).filter((b: any) => b.customer_id === customer.id));
      }
    } catch (e) {
      console.log('History error:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderAppointment = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.date}>{new Date(item.appointment_date).toLocaleDateString()}</Text>
        <Text style={[styles.status, { color: item.status?.toLowerCase() === 'completed' ? Colors.success : Colors.warning }]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.services}>{item.service_name || 'Multiple Services'}</Text>
      <Text style={styles.total}>Amount: ₹{item.total_amount}</Text>
    </View>
  );

  const renderBill = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <Text style={styles.paymentMethod}>{item.payment_method}</Text>
      </View>
      <Text style={styles.invoiceNo}>INV #{item.tenant_invoice_number || item.id}</Text>
      <Text style={styles.total}>Total: ₹{item.total_amount}</Text>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Customer Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.name[0]}</Text>
        </View>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.phone}>📱 {customer.phone}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Apps' && styles.activeTab]} 
          onPress={() => setActiveTab('Apps')}
        >
          <Text style={[styles.tabText, activeTab === 'Apps' && styles.activeTabText]}>Appointments ({appointments.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Bills' && styles.activeTab]} 
          onPress={() => setActiveTab('Bills')}
        >
          <Text style={[styles.tabText, activeTab === 'Bills' && styles.activeTabText]}>Bills ({bills.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'Apps' ? appointments : bills}
        renderItem={activeTab === 'Apps' ? renderAppointment : renderBill}
        keyExtractor={(it, idx) => idx.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No records found.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 24, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  name: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
  phone: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  tabs: { flexDirection: 'row', padding: 10, gap: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  activeTab: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: 'bold', fontSize: 13 },
  activeTabText: { color: '#fff' },
  historyCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  date: { color: Colors.textPrimary, fontWeight: '700' },
  status: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  services: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
  total: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
  paymentMethod: { color: Colors.success, fontSize: 11, fontWeight: 'bold' },
  invoiceNo: { color: Colors.textMuted, fontSize: 12, marginBottom: 4 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 40 },
});
