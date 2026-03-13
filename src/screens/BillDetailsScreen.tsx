import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Alert, Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getBillById } from '../lib/api';
import { Colors } from '../constants/colors';

export default function BillDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { billId } = route.params;

  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<any>(null);

  useEffect(() => {
    fetchBill();
  }, [billId]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const res = await getBillById(billId);
      if (res.success) setBill(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const phone = bill.customer_phone.replace(/\D/g, '');
    const waPhone = phone.length === 10 ? `91${phone}` : phone;
    
    let message = `🌟 *INVOICE - RunMyShop* 🌟\n\n`;
    message += `Bill No: #${bill.tenant_invoice_number || bill.id}\n`;
    message += `Date: ${new Date(bill.created_at).toLocaleDateString()}\n`;
    message += `Customer: ${bill.customer_name}\n\n`;
    
    bill.items?.forEach((it: any, i: number) => {
      message += `${i+1}. ${it.service_name} - ₹${it.price}\n`;
    });
    
    message += `\n*Total: ₹${bill.total_amount}*\n`;
    message += `Payment: ${bill.payment_method}\n\n`;
    message += `Thank you! ✨`;

    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'WhatsApp not found'));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!bill) return <View style={styles.center}><Text style={{ color: Colors.textMuted }}>Bill not found</Text></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.invoiceNo}>INV #{(bill.tenant_invoice_number || bill.id).toString().padStart(4, '0')}</Text>
            <View style={[styles.badge, { backgroundColor: bill.payment_method === 'Pending' ? Colors.error + '20' : Colors.success + '20' }]}>
               <Text style={{ color: bill.payment_method === 'Pending' ? Colors.error : Colors.success, fontWeight: 'bold', fontSize: 10 }}>{bill.payment_method}</Text>
            </View>
          </View>
          <Text style={styles.date}>{new Date(bill.created_at).toLocaleString()}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.customerName}>{bill.customer_name}</Text>
          <Text style={styles.customerPhone}>📞 {bill.customer_phone}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Summary</Text>
          {bill.items?.map((it: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.service_name}</Text>
                {it.employees?.length > 0 && (
                  <Text style={styles.itemStaff}>Staff: {it.employees.map((e: any) => e.name).join(', ')}</Text>
                )}
              </View>
              <Text style={styles.itemPrice}>₹{it.price}</Text>
            </View>
          ))}

          <View style={[styles.divider, { marginTop: 10 }]} />
          
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>₹{(bill.total_amount + (bill.discount || 0) - (bill.tax_amount || 0)).toFixed(2)}</Text>
          </View>
          {bill.tax_amount > 0 && (
            <View style={styles.rowBetween}>
              <Text style={styles.totalLabel}>GST</Text>
              <Text style={styles.totalValue}>+ ₹{bill.tax_amount.toFixed(2)}</Text>
            </View>
          )}
          {bill.discount > 0 && (
            <View style={styles.rowBetween}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, { color: Colors.error }]}>- ₹{bill.discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{bill.total_amount}</Text>
          </View>

          {bill.payments?.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Payments History</Text>
              {bill.payments.map((p: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName}>{p.payment_method}</Text>
                  <Text style={styles.itemPrice}>₹{p.amount}</Text>
                </View>
              ))}
            </>
          )}

          {bill.bill_note && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Note</Text>
              <Text style={styles.noteText}>{bill.bill_note}</Text>
            </>
          )}
        </View>

        <View style={styles.btnRow}>
           <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={handleWhatsApp}>
              <Text style={styles.btnText}>Share on WhatsApp</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]} onPress={() => navigation.navigate('BillForm', { billId: bill.id })}>
              <Text style={[styles.btnText, { color: Colors.textPrimary }]}>Edit Bill</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceNo: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  date: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 12 },
  customerName: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  customerPhone: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  itemStaff: { fontSize: 11, color: Colors.accent, marginTop: 2 },
  itemPrice: { fontSize: 15, color: Colors.textPrimary, fontWeight: 'bold' },
  totalLabel: { fontSize: 14, color: Colors.textSecondary },
  totalValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, backgroundColor: Colors.primary + '10', padding: 16, borderRadius: 16 },
  grandTotalLabel: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  grandTotalValue: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  noteText: { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 14 },
  btnRow: { marginTop: 24, gap: 12 },
  actionBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
