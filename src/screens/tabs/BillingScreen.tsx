import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Linking,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getBills, deleteBill } from '../../lib/api';
import { Colors } from '../../constants/colors';

export default function BillingScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBills = useCallback(async (p = 1, q = '') => {
    try {
      if (p === 1) setLoading(true);
      const res = await getBills(p, 20, q);
      if (res.success) {
        const list = res.data || res.bills || [];
        setBills(p === 1 ? list : (prev) => [...prev, ...list]);
        setTotal(res.total || list.length);
      }
    } catch (e) {
      console.log('Bills error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchBills(1, search);
    }
  }, [isFocused]);

  const onRefresh = () => { setRefreshing(true); setPage(1); fetchBills(1, search); };
  
  const handleSearch = (text: string) => { 
    setSearch(text); 
    setPage(1); 
    fetchBills(1, text); 
  };

  const loadMore = () => {
    if (bills.length < total && !loadingMore) {
      setLoadingMore(true);
      const next = page + 1;
      setPage(next);
      fetchBills(next, search);
    }
  };

  const handleDelete = (bill: any) => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete Invoice #${bill.tenant_invoice_number || bill.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const res = await deleteBill(bill.id);
              if (res.success) {
                fetchBills(1, search);
              } else {
                Alert.alert('Error', res.message || 'Failed to delete');
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to delete bill');
            }
          }
        }
      ]
    );
  };

  const handleWhatsApp = (bill: any) => {
    const phone = bill.customer_phone.replace(/\D/g, '');
    const waPhone = phone.length === 10 ? `91${phone}` : phone;
    
    let message = `*INVOICE - RunMyShop*\n`;
    message += `Bill No: #${bill.tenant_invoice_number || bill.id}\n`;
    message += `Customer: ${bill.customer_name}\n`;
    message += `Amount: ₹${Number(bill.total_amount).toFixed(2)}\n`;
    message += `Payment: ${bill.payment_method}\n\n`;
    message += `Thank you! ✨`;

    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'WhatsApp not found'));
  };

  const getPaymentColor = (method: string) => {
    if (!method) return Colors.textMuted;
    const m = method.toLowerCase();
    if (m.includes('cash')) return Colors.success;
    if (m.includes('gpay') || m.includes('phone') || m.includes('paytm')) return Colors.info;
    return Colors.textSecondary;
  };

  const renderItem = ({ item }: { item: any }) => {
    const isPaid = item.paid_amount >= item.total_amount;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.billId}>
              Invoice #{item.tenant_invoice_number || item.id}
            </Text>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.phone}>📞 {item.customer_phone}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amount}>₹{Number(item.total_amount).toFixed(2)}</Text>
            <View style={[styles.badge, { backgroundColor: isPaid ? Colors.success + '20' : Colors.warning + '20' }]}>
              <Text style={{ color: isPaid ? Colors.success : Colors.warning, fontSize: 10, fontWeight: '700' }}>
                {isPaid ? '✓ PAID' : '⏳ DUE'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.cardFooter}>
          <Text style={[styles.payMethod, { color: getPaymentColor(item.payment_method) }]}>
            💳 {item.payment_method || 'N/A'}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleWhatsApp(item)} style={styles.actionBtn}>
              <Text style={{ fontSize: 16 }}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('BillForm', { billId: item.id })} style={styles.actionBtn}>
              <Text style={{ fontSize: 16 }}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={{ color: Colors.textMuted, marginRight: 8, fontSize: 16 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
            placeholder="Search bills..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('BillForm')} 
          style={styles.addBtn}
        >
          <Text style={styles.addBtnText}>+ New Bill</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.total}>{total} Bills</Text>

      {loading && page === 1 ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No bills found</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} /> : null}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingRight: 16 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, margin: 16, marginRight: 8, marginBottom: 8,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 15, paddingVertical: 10 },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginTop: 8,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  total: { color: Colors.textMuted, fontSize: 13, marginLeft: 20, marginBottom: 4 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  billId: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  customerName: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  phone: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  amount: { color: Colors.success, fontSize: 18, fontWeight: 'bold' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payMethod: { fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 5 },
  actionBtn: { padding: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 10, marginLeft: 5 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 60, fontSize: 16 },
});
