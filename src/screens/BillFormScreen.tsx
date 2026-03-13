import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Modal, FlatList, Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  getCustomers, getServices, getProducts, getPackages,
  getEmployees, createBill, updateBill, getBillById, getSettings,
  getAppointmentById, checkoutAppointment
} from '../lib/api';
import { Colors } from '../constants/colors';

const GST_OPTIONS = [0, 5, 10, 12, 18, 28];
const PAYMENT_METHODS = ['Cash', 'GPay', 'PhonePe', 'Paytm', 'Card', 'Bank Transfer', 'Pending', 'Other'];

export default function BillFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingBillId = route.params?.billId;
  const appointmentId = route.params?.appointmentId;

  const [loading, setLoading] = useState((editingBillId || appointmentId) ? true : false);
  const [saving, setSaving] = useState(false);

  // Master Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState('0');
  const [gstNo, setGstNo] = useState('');
  const [payments, setPayments] = useState<any[]>([{ payment_method: 'Cash', amount: '' }]);

  // Modals
  const [custModal, setCustModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [staffModal, setStaffModal] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Search local states
  const [custSearch, setCustSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => {
    loadMasterData();
    if (editingBillId) loadEditingBill();
    else if (appointmentId) loadAppointmentData();
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
    } catch (err) {
      console.log('Load Master Data Error:', err);
    }
  };

  const loadEditingBill = async () => {
    try {
      const res = await getBillById(editingBillId);
      if (res.success && res.data) {
        const b = res.data;
        setSelectedCustomer({ id: b.customer_id, name: b.customer_name, phone: b.customer_phone });
        setDiscount(b.discount?.toString() || '0');
        setGstNo(b.gst_no || '');
        setBillItems(b.items?.map((it: any) => ({
          ...it,
          employee_ids: it.employees?.map((em: any) => em.id) || it.employee_ids || [],
          price: it.price?.toString()
        })) || []);
        
        if (b.payments && b.payments.length > 0) {
          setPayments(b.payments.map((p: any) => ({ payment_method: p.payment_method, amount: p.amount.toString() })));
        } else {
          setPayments([{ payment_method: b.payment_method || 'Cash', amount: b.paid_amount?.toString() || b.total_amount?.toString() || '' }]);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentData = async () => {
    try {
      const res = await getAppointmentById(appointmentId);
      if (res.success && res.data) {
        const d = res.data;
        setSelectedCustomer({ id: d.customer_id, name: d.customer_name, phone: d.customer_phone });
        setBillItems(d.items?.map((it: any) => ({
          ...it,
          employee_ids: it.employees?.map((em: any) => em.id) || it.employee_ids || [],
          price: it.price?.toString()
        })) || []);
        setPayments([{ payment_method: 'Cash', amount: d.total_amount?.toString() || '' }]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return billItems.reduce((sum, it) => sum + (parseFloat(it.price || '0') * (it.quantity || 1)), 0);
  }, [billItems]);

  const taxTotal = useMemo(() => {
    return billItems.reduce((sum, it) => {
      const p = parseFloat(it.price || '0');
      const q = it.quantity || 1;
      const g = it.gst_percent || 0;
      return sum + (p * q * g / 100);
    }, 0);
  }, [billItems]);

  const totalAmount = useMemo(() => {
    return subtotal + taxTotal - parseFloat(discount || '0');
  }, [subtotal, taxTotal, discount]);

  const handleAddItem = (type: 'Service' | 'Product' | 'Package', item: any) => {
    const newItem = {
      item_type: type,
      service_id: type === 'Service' ? item.id : undefined,
      product_id: type === 'Product' ? item.id : undefined,
      package_id: type === 'Package' ? item.id : undefined,
      service_name: item.title || item.name,
      price: (item.price || 0).toString(),
      quantity: 1,
      gst_percent: item.gst_percent || 0,
      employee_ids: []
    };
    setBillItems([...billItems, newItem]);
    setItemModal(false);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...billItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBillItems(newItems);
  };

  const removeItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const addPaymentRow = () => {
    setPayments([...payments, { payment_method: 'Cash', amount: '' }]);
  };

  const removePaymentRow = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const updatePayment = (index: number, field: string, value: string) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  const handleSave = async () => {
    if (!selectedCustomer) return Alert.alert('Error', 'Please select a customer');
    if (billItems.length === 0) return Alert.alert('Error', 'Add at least one item');

    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    if (totalPaid > totalAmount + 1) return Alert.alert('Error', 'Paid amount cannot exceed total');

    setSaving(true);
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        items: billItems.map(it => ({
          ...it,
          price: parseFloat(it.price),
          quantity: parseInt(it.quantity)
        })),
        payments: payments.filter(p => parseFloat(p.amount) > 0),
        discount: parseFloat(discount || '0'),
        tax_amount: taxTotal,
        total_amount: totalAmount,
        gst_no: gstNo.trim() || undefined,
        payment_method: payments.length > 1 ? 'Multiple' : payments[0].payment_method
      };

      let res;
      if (editingBillId) {
        res = await updateBill(editingBillId, payload);
      } else if (appointmentId) {
        // Use checkout endpoint for appointments
        res = await checkoutAppointment(appointmentId, {
          ...payload,
          paid_amount: totalPaid
        });
      } else {
        res = await createBill(payload);
      }

      if (res.success) {
        const billId = editingBillId || res.data.id;
        Alert.alert('Success ✅', `Bill ${editingBillId ? 'updated' : 'created'} successfully`, [
          { text: 'View Bills', onPress: () => navigation.goBack() },
          { text: 'WhatsApp Share', onPress: () => handleWhatsApp({ ...payload, id: billId, customer_name: selectedCustomer.name, customer_phone: selectedCustomer.phone, created_at: new Date() }) }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to save bill');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = async (bill: any) => {
    const phone = bill.customer_phone.replace(/\D/g, '');
    const waPhone = phone.length === 10 ? `91${phone}` : phone;
    
    let message = `*INVOICE - RunMyShop*\n`;
    message += `Bill No: #${bill.id}\n`;
    message += `Customer: ${bill.customer_name}\n\n`;
    
    bill.items.forEach((it: any, i: number) => {
      message += `${i+1}. ${it.service_name} - ₹${it.price} x${it.quantity}\n`;
    });
    
    message += `\n*Total: ₹${bill.total_amount.toFixed(2)}*\n`;
    message += `Thank you! ✨`;

    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'WhatsApp not found'));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Customer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer</Text>
          <TouchableOpacity 
            style={styles.pickerBtn} 
            onPress={() => setCustModal(true)}
          >
            <Text style={{ color: selectedCustomer ? Colors.textPrimary : Colors.textMuted }}>
              {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : 'Select Customer'}
            </Text>
            <Text style={{ color: Colors.textMuted }}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>🛍️ Items</Text>
            <TouchableOpacity onPress={() => setItemModal(true)} style={styles.addSmallBtn}>
              <Text style={styles.addSmallBtnText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {billItems.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.itemName}>{item.service_name}</Text>
                <TouchableOpacity onPress={() => removeItem(index)}><Text style={{ color: Colors.error }}>✕</Text></TouchableOpacity>
              </View>
              
              <View style={styles.itemControls}>
                <View style={{ flex: 1.5, marginRight: 8 }}>
                  <Text style={styles.miniLabel}>Price</Text>
                  <TextInput 
                    style={styles.miniInput} 
                    value={item.price} 
                    onChangeText={(val) => updateItem(index, 'price', val)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.miniLabel}>Qty</Text>
                  <TextInput 
                    style={styles.miniInput} 
                    value={item.quantity.toString()} 
                    onChangeText={(val) => updateItem(index, 'quantity', val)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>GST %</Text>
                  <TouchableOpacity 
                    style={styles.miniPicker} 
                    onPress={() => {
                      Alert.alert('Select GST', '', GST_OPTIONS.map(g => ({
                        text: `${g}%`, onPress: () => updateItem(index, 'gst_percent', g)
                      })));
                    }}
                  >
                    <Text style={{ color: Colors.textPrimary }}>{item.gst_percent}%</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.staffPicker}
                onPress={() => { setActiveItemIndex(index); setStaffModal(true); }}
              >
                <Text style={styles.staffPickerText}>
                  {item.employee_ids.length > 0 
                  ? `Staff: ${item.employee_ids.map((id: any) => employees.find(e => e.id === id)?.name).join(', ')}`
                  : 'Assign Staff (Multiple)'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST</Text>
            <Text style={styles.summaryValue}>₹{taxTotal.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <TextInput 
              style={[styles.miniInput, { width: 80, height: 32 }]} 
              value={discount} 
              onChangeText={setDiscount}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontSize: 20, color: Colors.primary }]}>Total</Text>
            <Text style={[styles.summaryValue, { fontSize: 20, color: Colors.primary }]}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>💰 Payments</Text>
            <TouchableOpacity onPress={addPaymentRow}><Text style={{ color: Colors.primary }}>+ Add Method</Text></TouchableOpacity>
          </View>
          
          {payments.map((p, i) => (
            <View key={i} style={styles.paymentRow}>
              <TouchableOpacity 
                style={[styles.miniPicker, { flex: 1.5, marginRight: 8 }]}
                onPress={() => {
                  Alert.alert('Payment Method', '', PAYMENT_METHODS.map(m => ({
                    text: m, onPress: () => updatePayment(i, 'payment_method', m)
                  })));
                }}
              >
                <Text style={{ color: Colors.textPrimary }}>{p.payment_method}</Text>
              </TouchableOpacity>
              <TextInput 
                style={[styles.miniInput, { flex: 1 }]} 
                value={p.amount} 
                onChangeText={(val) => updatePayment(i, 'amount', val)}
                placeholder="Amount"
                keyboardType="numeric"
              />
              <TouchableOpacity onPress={() => removePaymentRow(i)} style={{ marginLeft: 10 }}>
                <Text style={{ color: Colors.error }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingBillId ? 'Update' : 'Generate'} Bill</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Customer Modal */}
      <Modal visible={custModal} animationType="slide">
        <View style={styles.modalBody}>
          <View style={styles.modalHead}>
            <TextInput 
              style={styles.modalSearch} 
              placeholder="Search Customer..." 
              value={custSearch} 
              onChangeText={setCustSearch} 
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity onPress={() => setCustModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <FlatList 
            data={customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch))}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.listRow} onPress={() => { setSelectedCustomer(item); setCustModal(false); }}>
                <Text style={styles.listRowTitle}>{item.name}</Text>
                <Text style={styles.listRowSub}>{item.phone}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Items Modal */}
      <Modal visible={itemModal} animationType="slide">
        <View style={styles.modalBody}>
          <View style={styles.modalHead}>
            <TextInput 
              style={styles.modalSearch} 
              placeholder="Search Services/Products/Packages..." 
              value={itemSearch} 
              onChangeText={setItemSearch} 
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity onPress={() => setItemModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          
          <ScrollView>
            {services.length > 0 && <Text style={styles.modalSectionHead}>SERVICES</Text>}
            {services.filter(s => s.title.toLowerCase().includes(itemSearch.toLowerCase())).map(s => (
              <TouchableOpacity key={`s-${s.id}`} style={styles.listRow} onPress={() => handleAddItem('Service', s)}>
                <Text style={styles.listRowTitle}>{s.title}</Text>
                <Text style={styles.listRowPrice}>₹{s.price}</Text>
              </TouchableOpacity>
            ))}
            {products.length > 0 && <Text style={styles.modalSectionHead}>PRODUCTS</Text>}
            {products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).map(p => (
              <TouchableOpacity key={`p-${p.id}`} style={styles.listRow} onPress={() => handleAddItem('Product', p)}>
                <Text style={styles.listRowTitle}>{p.name}</Text>
                <Text style={styles.listRowPrice}>₹{p.price}</Text>
              </TouchableOpacity>
            ))}
            {packages.length > 0 && <Text style={styles.modalSectionHead}>PACKAGES</Text>}
            {packages.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).map(pk => (
              <TouchableOpacity key={`pk-${pk.id}`} style={styles.listRow} onPress={() => handleAddItem('Package', pk)}>
                <Text style={styles.listRowTitle}>{pk.name}</Text>
                <Text style={styles.listRowPrice}>₹{pk.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Staff Multi-Select Modal */}
      <Modal visible={staffModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Assign Staff</Text>
              <TouchableOpacity onPress={() => setStaffModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <FlatList 
              data={employees}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = activeItemIndex !== null && billItems[activeItemIndex].employee_ids.includes(item.id);
                return (
                  <TouchableOpacity 
                    style={[styles.staffRow, isSelected && styles.staffRowSelected]} 
                    onPress={() => {
                      if (activeItemIndex === null) return;
                      const currentIds = [...billItems[activeItemIndex].employee_ids];
                      if (isSelected) {
                        updateItem(activeItemIndex, 'employee_ids', currentIds.filter(id => id !== item.id));
                      } else {
                        updateItem(activeItemIndex, 'employee_ids', [...currentIds, item.id]);
                      }
                    }}
                  >
                    <Text style={{ color: isSelected ? Colors.white : Colors.textPrimary }}>{item.name}</Text>
                    {isSelected && <Text style={{ color: Colors.white }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={() => setStaffModal(false)}>
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 60 },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  pickerBtn: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addSmallBtn: { backgroundColor: Colors.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  addSmallBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  itemCard: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  itemName: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 14 },
  itemControls: { flexDirection: 'row', marginTop: 10 },
  miniLabel: { color: Colors.textMuted, fontSize: 10, marginBottom: 4, fontWeight: 'bold' },
  miniInput: {
    backgroundColor: Colors.surface, borderRadius: 8, padding: 8,
    color: Colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: Colors.border,
  },
  miniPicker: {
    backgroundColor: Colors.surface, borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: Colors.border, height: 40, justifyContent: 'center',
  },
  staffPicker: { marginTop: 12, backgroundColor: Colors.primary + '10', padding: 8, borderRadius: 8 },
  staffPickerText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 14 },
  summaryValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 18,
    alignItems: 'center', marginTop: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Modal Styles
  modalBody: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  modalHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  modalSearch: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 10,
    padding: 12, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  modalClose: { fontSize: 28, color: Colors.textMuted, padding: 5 },
  modalSectionHead: { color: Colors.primary, fontSize: 12, fontWeight: 'bold', marginVertical: 10, letterSpacing: 1 },
  listRow: {
    backgroundColor: Colors.surface, padding: 16, borderRadius: 12,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  listRowTitle: { color: Colors.textPrimary, fontWeight: '600' },
  listRowSub: { color: Colors.textMuted, fontSize: 12 },
  listRowPrice: { color: Colors.success, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
  staffRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  staffRowSelected: { backgroundColor: Colors.primary, borderRadius: 8 },
});
