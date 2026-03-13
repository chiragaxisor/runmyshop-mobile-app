import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getAppointments, deleteAppointment, updateAppointmentStatus } from '../../lib/api';
import { Colors } from '../../constants/colors';

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.success,
  completed: Colors.info,
  cancelled: Colors.error,
};

export default function AppointmentsScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await getAppointments();
      if (res.success) {
        setAppointments(res.data || res.appointments || []);
      }
    } catch (e) { console.log('Apps error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (isFocused) fetchAppointments();
  }, [isFocused]);

  const onRefresh = () => { setRefreshing(true); fetchAppointments(); };

  const handleDelete = (item: any) => {
    Alert.alert('Delete', 'Delete this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const res = await deleteAppointment(item.id);
        if (res.success) fetchAppointments();
      }}
    ]);
  };

  const handleWhatsApp = (item: any) => {
    const phone = (item.customer_phone || item.phone).replace(/\D/g, '');
    const waPhone = phone.length === 10 ? `91${phone}` : phone;
    const date = new Date(item.appointment_date).toLocaleDateString();
    
    let message = `*Appointment Confirmation - RunMyShop*\n`;
    message += `Customer: ${item.customer_name}\n`;
    message += `Date: ${date}\n`;
    message += `Time: ${item.appointment_time}\n`;
    message += `Status: ${item.status}\n\n`;
    message += `See you soon! ✨`;

    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'WhatsApp not found'));
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = STATUS_COLORS[item.status?.toLowerCase()] || Colors.textMuted;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customer_name || item.name}</Text>
            <Text style={styles.phone}>📞 {item.customer_phone || item.phone}</Text>
            <Text style={styles.service}>✂️ {item.service_name || 'Multiple'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
              <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                {item.status || 'Pending'}
              </Text>
            </View>
            <Text style={styles.date}>📅 {new Date(item.appointment_date).toLocaleDateString()}</Text>
            <Text style={styles.time}>🕐 {item.appointment_time}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {item.status !== 'Completed' && item.status !== 'Cancelled' && (
            <TouchableOpacity onPress={() => navigation.navigate('BillForm', { appointmentId: item.id })} style={[styles.actionBtn, { width: 70 }]}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: Colors.success }}>Checkout</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleWhatsApp(item)} style={styles.actionBtn}>
             <Text>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AppointmentForm', { appointmentId: item.id })} style={styles.actionBtn}>
             <Text>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
             <Text>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.total}>{appointments.length} Appointments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AppointmentForm')}>
          <Text style={styles.addBtnText}>+ New Booking</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No appointments found</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}
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
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  customerName: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
  phone: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  service: { color: Colors.accent, fontSize: 13, marginTop: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  date: { color: Colors.textSecondary, fontSize: 12 },
  time: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 60, fontSize: 16 },
});
