import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Colors } from './src/constants/colors';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import DashboardScreen from './src/screens/tabs/DashboardScreen';
import CustomersScreen from './src/screens/tabs/CustomersScreen';
import BillingScreen from './src/screens/tabs/BillingScreen';
import AppointmentsScreen from './src/screens/tabs/AppointmentsScreen';
import BillFormScreen from './src/screens/BillFormScreen';
import AppointmentFormScreen from './src/screens/AppointmentFormScreen';
import CustomerDetailsScreen from './src/screens/CustomerDetailsScreen';
import BillDetailsScreen from './src/screens/BillDetailsScreen';
import ReportsScreen from './src/screens/tabs/ReportsScreen';
import RevenueScreen from './src/screens/tabs/RevenueScreen';
import EmployeesScreen from './src/screens/tabs/EmployeesScreen';
import SettingsScreen from './src/screens/tabs/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
          headerTitle: '📊 Dashboard',
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          tabBarLabel: 'Customers',
          tabBarIcon: ({ color }) => <TabIcon icon="👥" color={color} />,
          headerTitle: '👥 Customers',
        }}
      />
      <Tab.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          tabBarLabel: 'Billing',
          tabBarIcon: ({ color }) => <TabIcon icon="🧾" color={color} />,
          headerTitle: '🧾 Billing',
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color }) => <TabIcon icon="📅" color={color} />,
          headerTitle: '📅 Appointments',
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color }) => <TabIcon icon="☰" color={color} />,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

const MoreStack_ = createNativeStackNavigator();
function MoreStack() {
  return (
    <MoreStack_.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <MoreStack_.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: '☰ More' }} />
      <MoreStack_.Screen name="Reports" component={ReportsScreen} options={{ title: '📈 Reports' }} />
      <MoreStack_.Screen name="Revenue" component={RevenueScreen} options={{ title: '💰 Revenue' }} />
      <MoreStack_.Screen name="Employees" component={EmployeesScreen} options={{ title: '👨‍💼 Employees' }} />
      <MoreStack_.Screen name="Settings" component={SettingsScreen} options={{ title: '⚙️ Settings' }} />
    </MoreStack_.Navigator>
  );
}

import { TouchableOpacity, ScrollView } from 'react-native';
function MoreMenuScreen({ navigation }: any) {
  const { logout, user } = useAuth();
  const menuItems = [
    { icon: '📈', label: 'Reports', screen: 'Reports', color: Colors.warning },
    { icon: '💰', label: 'Revenue', screen: 'Revenue', color: Colors.error },
    { icon: '👨‍💼', label: 'Employees', screen: 'Employees', color: Colors.primaryLight },
    { icon: '⚙️', label: 'Settings', screen: 'Settings', color: Colors.textSecondary },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ color: Colors.textMuted, fontSize: 12, marginBottom: 4 }}>Logged in as</Text>
        <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>{user?.username || 'Admin'}</Text>
        <Text style={{ color: Colors.primaryLight, fontSize: 13 }}>{user?.role || 'Administrator'}</Text>
      </View>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.screen}
          onPress={() => navigation.navigate(item.screen)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.surface,
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text style={{ fontSize: 24, marginRight: 16 }}>{item.icon}</Text>
          <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '600', flex: 1 }}>{item.label}</Text>
          <Text style={{ color: Colors.textMuted, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        onPress={logout}
        style={{
          backgroundColor: '#1F2937',
          borderRadius: 14,
          padding: 18,
          marginTop: 10,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: Colors.error + '40',
        }}
      >
        <Text style={{ fontSize: 24, marginRight: 16 }}>🚪</Text>
        <Text style={{ color: Colors.error, fontSize: 16, fontWeight: '600' }}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 18 }}>{icon}</Text>;
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: 20 }}>🛍️</Text>
      <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>RunMyShop</Text>
      <Text style={{ color: Colors.textMuted, marginBottom: 30 }}>Admin Panel</Text>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen 
            name="BillForm" 
            component={BillFormScreen} 
            options={{ 
              headerShown: true, 
              title: 'Create Bill',
              headerStyle: { backgroundColor: Colors.surface },
              headerTintColor: Colors.textPrimary
            }} 
          />
          <Stack.Screen 
            name="AppointmentForm" 
            component={AppointmentFormScreen} 
            options={{ 
              headerShown: true, 
              title: 'Booking Info',
              headerStyle: { backgroundColor: Colors.surface },
              headerTintColor: Colors.textPrimary
            }} 
          />
          <Stack.Screen 
            name="CustomerDetails" 
            component={CustomerDetailsScreen} 
            options={{ 
              headerShown: true, 
              title: 'Customer History',
              headerStyle: { backgroundColor: Colors.surface },
              headerTintColor: Colors.textPrimary
            }} 
          />
          <Stack.Screen 
            name="BillDetails" 
            component={BillDetailsScreen} 
            options={{ 
              headerShown: true, 
              title: 'Invoice Details',
              headerStyle: { backgroundColor: Colors.surface },
              headerTintColor: Colors.textPrimary
            }} 
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
