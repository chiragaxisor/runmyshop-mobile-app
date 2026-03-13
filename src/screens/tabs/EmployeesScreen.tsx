import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, ScrollView,
} from 'react-native';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../lib/api';
import { Colors } from '../../constants/colors';

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await getEmployees();
      if (res.success) setEmployees(res.data || res.employees || []);
    } catch (e) { console.log('Employees error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchEmployees(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchEmployees(); };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter employee name');
    
    setSaving(true);
    try {
      const payload = { 
        name: name.trim(), 
        phone: phone.trim(), 
        email: email.trim(), 
        role: role.trim(), 
        is_active: isActive 
      };

      const res = editingEmployee 
        ? await updateEmployee(editingEmployee.id, payload)
        : await createEmployee(payload);

      if (res.success) {
        setModalVisible(false);
        fetchEmployees();
        Alert.alert('Success ✅', `Employee ${editingEmployee ? 'updated' : 'added'} successfully`);
      } else {
        Alert.alert('Error', res.message || 'Failed to save');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: any) => {
    Alert.alert('Delete', `Are you sure you want to delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await deleteEmployee(item.id);
          if (res.success) fetchEmployees();
          else Alert.alert('Error', res.message || 'Delete failed');
        } catch (e) { Alert.alert('Error', 'Delete failed'); }
      }}
    ]);
  };

  const openForm = (item: any = null) => {
    setEditingEmployee(item);
    setName(item?.name || '');
    setPhone(item?.phone || '');
    setEmail(item?.email || '');
    setRole(item?.role || '');
    setIsActive(item ? item.is_active !== false : true);
    setModalVisible(true);
  };

  const getInitials = (name: string) =>
    name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const avatarColors = [Colors.primary, Colors.accent, Colors.success, Colors.warning, Colors.error];

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const bgColor = avatarColors[index % avatarColors.length];
    return (
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: bgColor + '30', borderColor: bgColor + '60' }]}>
          <Text style={[styles.avatarText, { color: bgColor }]}>{getInitials(item.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.role}>💼 {item.role || 'Staff'}</Text>
          {item.phone && <Text style={styles.phone}>📞 {item.phone}</Text>}
        </View>
        <View style={styles.actions}>
           <TouchableOpacity onPress={() => openForm(item)} style={styles.miniBtn}><Text>✏️</Text></TouchableOpacity>
           <TouchableOpacity onPress={() => handleDelete(item)} style={styles.miniBtn}><Text>🗑️</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.total}>{employees.length} Members</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openForm()}>
          <Text style={styles.addBtnText}>+ Add Staff</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No employees found</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      {/* Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEmployee ? 'Edit Member' : 'Add New Member'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
              <Text style={styles.label}>Member Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full Name" placeholderTextColor={Colors.textMuted} />

              <Text style={styles.label}>Role / Designation</Text>
              <TextInput style={styles.input} value={role} onChangeText={setRole} placeholder="e.g. Stylist, Manager" placeholderTextColor={Colors.textMuted} />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Mobile Number" keyboardType="phone-pad" placeholderTextColor={Colors.textMuted} />

              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textMuted} />

              <TouchableOpacity style={styles.statusToggle} onPress={() => setIsActive(!isActive)}>
                <Text style={styles.label}>Status: </Text>
                <View style={[styles.badge, { backgroundColor: isActive ? Colors.success : Colors.error }]}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{isActive ? 'Active' : 'Inactive'}</Text>
                </View>
                <Text style={{ fontSize: 12, color: Colors.textMuted, marginLeft: 10 }}>(Tap to toggle)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingEmployee ? 'Update' : 'Register'} Member</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 0 },
  total: { color: Colors.textMuted, fontSize: 14, fontWeight: 'bold' },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 16,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1.5 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  name: { color: Colors.textPrimary, fontSize: 17, fontWeight: 'bold' },
  role: { color: Colors.accent, fontSize: 13, marginTop: 2, fontWeight: '600' },
  phone: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  miniBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 60, fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  closeBtn: { fontSize: 24, color: Colors.textMuted },
  form: { gap: 14 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  input: { backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  statusToggle: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
