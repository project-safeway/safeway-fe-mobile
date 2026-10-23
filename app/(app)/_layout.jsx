import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { ChamadaProvider } from '../../contexts/ChamadaContext';
import { FinanceiroProvider } from '../../contexts/FinanceiroContext';

const tabs = [
  { name: 'index', title: 'Início', icon: 'home-outline', iconFocused: 'home' },
  { name: 'alunos', title: 'Alunos', icon: 'people-outline', iconFocused: 'people' },
  { name: 'itinerarios', title: 'Itinerário', icon: 'map-outline', iconFocused: 'map' },
  { name: 'assistente', title: 'Assistente', icon: 'mic-outline', iconFocused: 'mic' },
  { name: 'financeiro', title: 'Financeiro', icon: 'wallet-outline', iconFocused: 'wallet' },
  { name: 'perfil', title: 'Perfil', icon: 'person-outline', iconFocused: 'person' },
];

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <FinanceiroProvider>
      <ChamadaProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.tabInactive,
            tabBarStyle: {
              backgroundColor: colors.white,
              borderTopColor: colors.border,
              height: 56 + bottomPad,
              paddingTop: 6,
              paddingBottom: bottomPad,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
            },
          }}
        >
          {tabs.map((tab) => (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                tabBarIcon: ({ color, focused, size }) => (
                  <Ionicons
                    name={focused ? tab.iconFocused : tab.icon}
                    size={size ?? 22}
                    color={color}
                  />
                ),
              }}
            />
          ))}
        </Tabs>
      </ChamadaProvider>
    </FinanceiroProvider>
  );
}
