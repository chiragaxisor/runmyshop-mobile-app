import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal,
} from 'react-native';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../lib/api';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

export default function CustomersScreen() {
  const navigation = useNavigation<any>();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async (p = 1, q = '') => {
    try {
      if (p === 1) setLoading(true);
      const res = await getCustomers(p, 20, q);
      if (res.success) {
        const list = res.data || res.customers || [];
        setCustomers(p === 1 ? list : (prev) => [...prev, ...list]);
        setTotal(res.total || list.length);
      }
    } catch (e) {
      console.log('Customers error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(1, search); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchCustomers(1, search);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    setPage(1);
    fetchCustomers(1, text);
  };

  const loadMore = () => {
    if (customers.length < total && !loadingMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCustomers(nextPage, search);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please enter name and phone');
      return;
    }
    if (phone.trim().length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (editingCustomer) {
        res = await updateCustomer(editingCustomer.id, { name: name.trim(), phone: phone.trim() });
      } else {
        res = await createCustomer({ name: name.trim(), phone: phone.trim() });
      }

      if (res.success) {
        setModalVisible(false);
        fetchCustomers(1, search);
        Alert.alert('Success ✅', `Customer ${editingCustomer ? 'updated' : 'added'} successfully`);
      } else {
        Alert.alert('Error', res.message || 'Failed to save customer');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (customer: any) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteCustomer(customer.id);
              if (res.success) {
                fetchCustomers(1, search);
              } else {
                Alert.alert('Error', res.message || 'Failed to delete');
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to delete customer');
            }
          }
        }
      ]
    );
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setModalVisible(true);
  };

  const openEditModal = (customer: any) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phone}>📞 {item.phone}</Text>
        {item.tenant_customer_number && (
          <Text style={styles.meta}>Customer #{item.tenant_customer_number}</Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerDetails', { customer: item })} style={styles.actionBtn}>
          <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: 'bold' }}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
          <Text style={{ fontSize: 18 }}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={{ color: Colors.textMuted, marginRight: 8, fontSize: 16 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
            placeholder="Search customers..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.total}>{total} Customers</Text>
      
      {loading && page === 1 ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No customers found</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} /> : null}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 24, color: Colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter customer name"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter 10-digit number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingCustomer ? 'Update' : 'Save'} Customer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primary + '30', justifyContent: 'center',
    alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: Colors.primary, fontSize: 20, fontWeight: 'bold' },
  name: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  phone: { color: Colors.textSecondary, fontSize: 13, marginTop: 3 },
  meta: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 5 },
  actionBtn: { padding: 8 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 60, fontSize: 16 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  form: { gap: 16 },
  label: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14, padding: 16, color: Colors.textPrimary,
    fontSize: 16, borderWidth: 1, borderColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16, padding: 18, alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
