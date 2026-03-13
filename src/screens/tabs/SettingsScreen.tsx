import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { changePassword } from '../../lib/api';
import { Colors } from '../../constants/colors';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      const res = await changePassword(newPassword);
      if (res.success) {
        Alert.alert('Success ✅', 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', res.message || 'Failed to change password');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {user?.username?.charAt(0)?.toUpperCase() || 'A'}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.username || 'Admin'}</Text>
        <Text style={styles.profileRole}>{user?.role || 'Administrator'}</Text>
        {user?.tenant_id && (
          <View style={styles.tenantBadge}>
            <Text style={styles.tenantText}>🏢 Tenant ID: {user.tenant_id}</Text>
          </View>
        )}
      </View>

      {/* Change Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Change Password</Text>

        <Text style={styles.inputLabel}>Current Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!showCurrent}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
            <Text>{showCurrent ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>New Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!showNew}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
            <Text>{showNew ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter new password"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.changeBtn, loading && { opacity: 0.7 }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.changeBtnText}>Update Password →</Text>
          }
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ App Info</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>RunMyShop Admin</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪  Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  profileCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 28,
    alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Colors.border,
  },
  profileAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '30', justifyContent: 'center',
    alignItems: 'center', marginBottom: 14, borderWidth: 2, borderColor: Colors.primary,
  },
  profileAvatarText: { color: Colors.primary, fontSize: 36, fontWeight: 'bold' },
  profileName: { color: Colors.textPrimary, fontSize: 22, fontWeight: 'bold' },
  profileRole: { color: Colors.primaryLight, fontSize: 14, marginTop: 4 },
  tenantBadge: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 10,
  },
  tenantText: { color: Colors.textMuted, fontSize: 13 },
  section: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  inputLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12,
    padding: 14, color: Colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  eyeBtn: { padding: 14, position: 'absolute', right: 0, bottom: 14 },
  changeBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 4,
  },
  changeBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoLabel: { color: Colors.textSecondary, fontSize: 14 },
  infoValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: Colors.error + '15', borderRadius: 16, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '40',
    marginTop: 4,
  },
  logoutText: { color: Colors.error, fontSize: 17, fontWeight: 'bold' },
});
