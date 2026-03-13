import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Modal, FlatList, Linking, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getCustomers, getServices, getProducts, getPackages,
  getEmployees, createAppointment, updateAppointment, getAppointmentById,
} from '../lib/api';
import { Colors } from '../constants/colors';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const GST_PERCENT_OPTIONS = [0, 5, 10, 12, 18, 28];

export default function AppointmentFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingId = route.params?.appointmentId;

  const [loading, setLoading] = useState(editingId ? true : false);
  const [saving, setSaving] = useState(false);

  // Master Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');

  // UI State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [custModal, setCustModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [staffModal, setStaffModal] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const [custSearch, setCustSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  // New Customer State
  const [newCustModal, setNewCustModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creatingCust, setCreatingCust] = useState(false);

  useEffect(() => {
    loadMasterData();
    if (editingId) loadExisting();
  }, []);

  const loadMasterData = async () => {
    try {
      const [c, s, p, pk, e] = await Promise.all([
        getCustomers(1, 100),
        getServices(),
        getProducts(),
        getPackages(),
        getEmployees(),
      ]);
      if (c.success) setCustomers(c.data || c.customers || []);
      if (s.success) setServices(s.data || []);
      if (p.success) setProducts(p.data || []);
      if (pk.success) setPackages(pk.data || []);
      if (e.success) setEmployees(e.data || []);
    } catch (err) {}
  };

  const loadExisting = async () => {
    try {
      const res = await getAppointmentById(editingId);
      if (res.success && res.data) {
        const d = res.data;
        setSelectedCustomer({ id: d.customer_id, name: d.customer_name, phone: d.customer_phone });
        setStatus(d.status || 'Pending');
        setNotes(d.notes || '');
        if (d.appointment_date) setDate(new Date(d.appointment_date));
        if (d.appointment_time) {
          const [h, m] = d.appointment_time.split(':');
          const t = new Date();
          t.setHours(parseInt(h), parseInt(m));
          setTime(t);
        }
        setItems(d.items?.map((it: any) => ({
          ...it,
          employee_ids: it.employees?.map((em: any) => em.id) || it.employee_ids || [],
          price: it.price?.toString()
        })) || []);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (type: any, item: any) => {
    setItems([...items, {
      item_type: type,
      service_id: type === 'Service' ? item.id : undefined,
      product_id: type === 'Product' ? item.id : undefined,
      package_id: type === 'Package' ? item.id : undefined,
      service_name: item.title || item.name || item.title,
      price: (item.price || 0).toString(),
      quantity: 1,
      gst_percent: item.gst_percent || 0,
      employee_ids: []
    }]);
    setItemModal(false);
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) return Alert.alert('Error', 'Enter name and phone');
    setCreatingCust(true);
    try {
      const { createCustomer } = await import('../lib/api');
      const res = await createCustomer({ name: newName.trim(), phone: newPhone.trim() });
      if (res.success) {
        const cust = res.data;
        setSelectedCustomer(cust);
        setNewCustModal(false);
        setCustModal(false);
        loadMasterData(); // Refresh list
      } else {
        Alert.alert('Error', res.message || 'Failed to create');
      }
    } catch (e) {
      Alert.alert('Error', 'Creation failed');
    } finally {
      setCreatingCust(false);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const list = [...items];
    list[index] = { ...list[index], [field]: value };
    setItems(list);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (parseFloat(it.price || '0') * (it.quantity || 1)), 0);
  }, [items]);

  const taxTotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const p = parseFloat(it.price || '0');
      const q = it.quantity || 1;
      const g = it.gst_percent || 0;
      return sum + (p * q * g / 100);
    }, 0);
  }, [items]);

  const totalAmount = useMemo(() => subtotal + taxTotal, [subtotal, taxTotal]);

  const handleSave = async () => {
    if (!selectedCustomer) return Alert.alert('Error', 'Select a customer');
    if (items.length === 0) return Alert.alert('Error', 'Add at least one service');

    setSaving(true);
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        appointment_date: date.toISOString().split('T')[0],
        appointment_time: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
        status,
        notes,
        total_amount: totalAmount,
        tax_amount: taxTotal,
        items: items.map(it => ({
          ...it,
          price: parseFloat(it.price),
          quantity: parseInt(it.quantity),
          gst_percent: it.gst_percent || 0
        }))
      };

      const res = editingId ? await updateAppointment(editingId, payload) : await createAppointment(payload);
      if (res.success) {
        Alert.alert('Success ✅', `Appointment ${editingId ? 'updated' : 'booked'} successfully`, [
          { text: 'OK', onPress: navigation.goBack }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to save');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.label}>👤 Customer</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setCustModal(true)}>
            <Text style={{ color: selectedCustomer ? Colors.textPrimary : Colors.textMuted }}>
              {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : 'Select Customer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>📅 Date</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: Colors.textPrimary }}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>🕐 Time</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowTimePicker(true)}>
              <Text style={{ color: Colors.textPrimary }}>{`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e: any, d?: Date) => { setShowDatePicker(false); if (d) setDate(d); }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e: any, d?: Date) => { setShowTimePicker(false); if (d) setTime(d); }}
          />
        )}

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.label}>🚥 Status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity 
                key={s} 
                onPress={() => setStatus(s)}
                style={[styles.statusTab, status === s && { backgroundColor: Colors.primary }]}
              >
                <Text style={[styles.statusText, status === s && { color: '#fff' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>✂️ Services</Text>
            <TouchableOpacity onPress={() => setItemModal(true)} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {items.map((it, idx) => (
            <View key={idx} style={styles.itemCard}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.service_name}</Text>
                  <Text style={{ fontSize: 10, color: Colors.textMuted }}>{it.item_type}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(idx)}><Text style={{ color: Colors.error }}>✕</Text></TouchableOpacity>
              </View>
              <View style={styles.itemControls}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>Price</Text>
                  <TextInput 
                    style={styles.miniInput} 
                    value={it.price} 
                    onChangeText={v => updateItem(idx, 'price', v)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 0.6 }}>
                  <Text style={styles.miniLabel}>GST %</Text>
                  <TouchableOpacity 
                    style={styles.miniPicker}
                    onPress={() => {
                      Alert.alert('GST %', 'Select GST rate', GST_PERCENT_OPTIONS.map(o => ({
                        text: o === 0 ? 'Exempt (0%)' : `${o}%`,
                        onPress: () => updateItem(idx, 'gst_percent', o)
                      })));
                    }}
                  >
                    <Text style={{ color: Colors.textPrimary, fontSize: 12 }}>{it.gst_percent}%</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.miniLabel}>Staff</Text>
                  <TouchableOpacity 
                    style={styles.staffBtn}
                    onPress={() => { setActiveItemIndex(idx); setStaffModal(true); }}
                  >
                    <Text style={styles.staffText}>
                      {it.employee_ids.length > 0 ? `${it.employee_ids.length} Staff` : 'Assign'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          
          <View style={styles.summaryBox}>
             <View style={styles.summaryRow}><Text style={styles.sumLabel}>Subtotal</Text><Text style={styles.sumVal}>₹{subtotal.toFixed(2)}</Text></View>
             <View style={styles.summaryRow}><Text style={styles.sumLabel}>GST</Text><Text style={styles.sumVal}>₹{taxTotal.toFixed(2)}</Text></View>
             <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 6, marginTop: 4 }]}><Text style={[styles.sumLabel, { fontWeight: 'bold', color: Colors.primary }]}>Total Amount</Text><Text style={[styles.sumVal, { fontWeight: 'bold', fontSize: 18, color: Colors.primary }]}>₹{totalAmount.toFixed(2)}</Text></View>
          </View>
        </View>

        <TextInput 
          style={styles.notesInput} 
          placeholder="Add internal notes..." 
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor={Colors.textMuted}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Confirm'} Appointment</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* MODALS (Customer & Items) - Same logic as BillForm */}
      <Modal visible={custModal} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalHeader}>
            <TextInput style={styles.search} placeholder="Search Customer..." value={custSearch} onChangeText={setCustSearch} placeholderTextColor={Colors.textMuted} />
            <TouchableOpacity onPress={() => setCustModal(false)}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.newCustItem} onPress={() => setNewCustModal(true)}>
            <Text style={styles.newCustText}>+ Create New Customer</Text>
          </TouchableOpacity>
          <FlatList 
            data={customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch))}
            keyExtractor={it => it.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.rowItem} onPress={() => { setSelectedCustomer(item); setCustModal(false); }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.phone}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal visible={itemModal} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalHeader}>
            <TextInput style={styles.search} placeholder="Search Items..." value={itemSearch} onChangeText={setItemSearch} placeholderTextColor={Colors.textMuted} />
            <TouchableOpacity onPress={() => setItemModal(false)}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {services.length > 0 && <Text style={styles.modalSubHeader}>SERVICES</Text>}
            {services.filter(s => s.title.toLowerCase().includes(itemSearch.toLowerCase())).map(s => (
              <TouchableOpacity key={`s-${s.id}`} style={styles.rowItem} onPress={() => addItem('Service', s)}>
                <Text style={styles.rowTitle}>{s.title}</Text>
                <Text style={styles.rowPrice}>₹{s.price}</Text>
              </TouchableOpacity>
            ))}
            {products.length > 0 && <Text style={styles.modalSubHeader}>PRODUCTS</Text>}
            {products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).map(p => (
              <TouchableOpacity key={`p-${p.id}`} style={styles.rowItem} onPress={() => addItem('Product', p)}>
                <Text style={styles.rowTitle}>{p.name}</Text>
                <Text style={styles.rowPrice}>₹{p.price}</Text>
              </TouchableOpacity>
            ))}
            {packages.length > 0 && <Text style={styles.modalSubHeader}>PACKAGES</Text>}
            {packages.filter(pk => pk.name.toLowerCase().includes(itemSearch.toLowerCase())).map(pk => (
              <TouchableOpacity key={`pk-${pk.id}`} style={styles.rowItem} onPress={() => addItem('Package', pk)}>
                <Text style={styles.rowTitle}>{pk.name}</Text>
                <Text style={styles.rowPrice}>₹{pk.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* New Customer Modal */}
      <Modal visible={newCustModal} transparent animationType="fade">
        <View style={styles.overlay}>
           <View style={styles.modalInner}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TextInput style={styles.search} placeholder="Name" value={newName} onChangeText={setNewName} placeholderTextColor={Colors.textMuted} />
              <View style={{ height: 10 }} />
              <TextInput style={styles.search} placeholder="Phone" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" placeholderTextColor={Colors.textMuted} />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                 <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: Colors.border }]} onPress={() => setNewCustModal(false)}><Text style={{ color: Colors.textPrimary }}>Cancel</Text></TouchableOpacity>
                 <TouchableOpacity style={[styles.saveBtn, { flex: 2 }]} onPress={handleCreateCustomer} disabled={creatingCust}>
                    {creatingCust ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Customer</Text>}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      <Modal visible={staffModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalInner}>
            <Text style={styles.modalTitle}>Select Staff</Text>
            <FlatList 
              data={employees}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = activeItemIndex !== null && items[activeItemIndex].employee_ids.includes(item.id);
                return (
                  <TouchableOpacity 
                    style={[styles.staffRow, isSelected && { backgroundColor: Colors.primary }]} 
                    onPress={() => {
                      if (activeItemIndex === null) return;
                      const ids = [...items[activeItemIndex].employee_ids];
                      updateItem(activeItemIndex, 'employee_ids', isSelected ? ids.filter(i => i !== item.id) : [...ids, item.id]);
                    }}
                  >
                    <Text style={{ color: isSelected ? '#fff' : Colors.textPrimary }}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={() => setStaffModal(false)}><Text style={styles.saveBtnText}>Done</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 16 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  picker: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  statusTab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  statusText: { fontSize: 12, color: Colors.textSecondary, fontWeight: 'bold' },
  addBtn: { backgroundColor: Colors.primary + '15', padding: 6, borderRadius: 8, paddingHorizontal: 12 },
  addBtnText: { color: Colors.primary, fontWeight: 'bold', fontSize: 12 },
  itemCard: { backgroundColor: Colors.surface, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  itemName: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 14 },
  itemControls: { flexDirection: 'row', marginTop: 8, gap: 10 },
  miniInput: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 8, padding: 8, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  staffBtn: { flex: 1.5, backgroundColor: Colors.primary + '10', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  staffText: { color: Colors.primary, fontSize: 12, fontWeight: 'bold' },
  notesInput: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, color: Colors.textPrimary, minHeight: 80, borderWidth: 1, borderColor: Colors.border, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  modalHeader: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  search: { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  close: { fontSize: 24, color: Colors.textMuted },
  rowItem: { backgroundColor: Colors.surface, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  rowTitle: { color: Colors.textPrimary, fontWeight: 'bold' },
  rowSub: { color: Colors.textMuted, fontSize: 12 },
  rowPrice: { color: Colors.success, fontWeight: 'bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalInner: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  staffRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  miniLabel: { fontSize: 10, color: Colors.textSecondary, marginBottom: 4, fontWeight: 'bold' },
  miniPicker: { backgroundColor: Colors.surfaceElevated, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: Colors.border, height: 38, justifyContent: 'center' },
  summaryBox: { marginTop: 20, backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sumLabel: { fontSize: 14, color: Colors.textSecondary },
  sumVal: { fontSize: 14, color: Colors.textPrimary, fontWeight: 'bold' },
  newCustItem: { backgroundColor: Colors.primary + '10', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.primary + '30', alignItems: 'center' },
  newCustText: { color: Colors.primary, fontWeight: 'bold' },
  modalSubHeader: { fontSize: 12, color: Colors.textMuted, fontWeight: 'bold', marginVertical: 10, letterSpacing: 1 },
});
