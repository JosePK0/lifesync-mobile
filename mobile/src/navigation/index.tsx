import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../state/AuthContext';
import { RecordsProvider } from '../state/RecordsContext';
import { colors } from '../core/theme';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import RecordsScreen from '../screens/RecordsScreen';
import RecordFormScreen from '../screens/RecordFormScreen';
import ScanScreen from '../screens/ScanScreen';
import AlertsScreen from '../screens/AlertsScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ProfileScreen from '../screens/ProfileScreen';

const AuthStackNav = createNativeStackNavigator();
const AppStackNav = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

// Pila SOLO para usuarios NO autenticados
function AuthStack() {
  return (
    <AuthStackNav.Navigator>
      <AuthStackNav.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStackNav.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: '', headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false, headerTintColor: colors.text }}
      />
    </AuthStackNav.Navigator>
  );
}

const icons: Record<string, [string, string]> = {
  Inicio: ['home', 'home-outline'],
  Historial: ['document-text', 'document-text-outline'],
  Alertas: ['notifications', 'notifications-outline'],
  Perfil: ['person', 'person-outline'],
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
        tabBarStyle: {
          height: 58 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
        },
        tabBarIcon: ({ focused, color, size }) => <Ionicons name={(icons[route.name][focused ? 0 : 1]) as any} size={size} color={color} />,
      })}
    >
      <Tabs.Screen name="Inicio" component={HomeScreen} />
      <Tabs.Screen name="Historial" component={RecordsScreen} />
      <Tabs.Screen name="Alertas" component={AlertsScreen} />
      <Tabs.Screen name="Perfil" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

// Pila SOLO para usuarios autenticados
function AppStack() {
  return (
    <RecordsProvider>
      <AppStackNav.Navigator screenOptions={{ headerTintColor: colors.text, headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false }}>
        <AppStackNav.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <AppStackNav.Screen name="RecordForm" component={RecordFormScreen} options={{ title: 'Registro' }} />
        <AppStackNav.Screen name="Scan" component={ScanScreen} options={{ title: 'Escanear receta' }} />
        <AppStackNav.Screen name="Emergency" component={EmergencyScreen} options={{ title: 'Emergencia' }} />
      </AppStackNav.Navigator>
    </RecordsProvider>
  );
}

export default function RootNavigation() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
  return <NavigationContainer>{user ? <AppStack /> : <AuthStack />}</NavigationContainer>;
}
