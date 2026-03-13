import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  Linking, ScrollView, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { login as apiLogin } from '../../lib/api';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const [tenantId, setTenantId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    const shopName = tenantId.trim().toLowerCase();
    if (!shopName || !username.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter Shop Name, username and password');
      return;
    }
    try {
      setLoading(true);
      // Save tenant first so api interceptor can use it
      await AsyncStorage.setItem('tenantId', shopName);
      
      const response = await apiLogin(username.trim(), password);
      if (response.success && response.token && response.user) {
        await login(response.token, response.user);
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Login failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactForRegister = () => {
    const phone = '919876543210'; // TODO: Replace with your actual WhatsApp number
    const message = 'Hello, I want to register for the RunMyShop Admin App.';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open WhatsApp'));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🛍️</Text>
          </View>
          <Text style={styles.appName}>RunMyShop</Text>
          <Text style={styles.subtitle}>Admin Panel</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to manage your business</Text>

          {/* Shop Name (Tenant) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🏢  Shop Name (Subdomain)</Text>
            <TextInput
              style={styles.input}
              value={tenantId}
              onChangeText={setTenantId}
              placeholder="e.g. dipen or chirag"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Text style={{ color: Colors.textMuted, fontSize: 11, marginTop: 4 }}>
              Your URL will be: {tenantId ? tenantId.toLowerCase() : 'shop'}.runmyshop.in
            </Text>
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>👤  Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🔒  Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.loginBtnText}>Sign In →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={handleContactForRegister} style={styles.whatsappBtn}>
            <Text style={styles.whatsappBtnText}>💬  Contact us on WhatsApp</Text>
          </TouchableOpacity>
          <Text style={styles.registerNote}>
            We'll set up your account for you
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 36 },
  logoContainer: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: Colors.surface, justifyContent: 'center',
    alignItems: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: Colors.primary + '60',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  logoIcon: { fontSize: 44 },
  appName: { color: Colors.textPrimary, fontSize: 28, fontWeight: 'bold', letterSpacing: 1 },
  subtitle: { color: Colors.primaryLight, fontSize: 14, marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  cardTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitle: { color: Colors.textMuted, fontSize: 14, marginBottom: 24 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12,
    padding: 14, color: Colors.textPrimary, fontSize: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: {
    position: 'absolute', right: 14, top: 14,
  },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: Colors.white, fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
  registerSection: { alignItems: 'center', marginTop: 28 },
  registerText: { color: Colors.textMuted, fontSize: 14, marginBottom: 12 },
  whatsappBtn: {
    backgroundColor: '#25D36620',
    borderWidth: 1, borderColor: '#25D366',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24,
    marginBottom: 10,
  },
  whatsappBtnText: { color: '#25D366', fontWeight: '700', fontSize: 15 },
  registerNote: { color: Colors.textMuted, fontSize: 12 },
});
