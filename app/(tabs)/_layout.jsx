import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';

const tabs = [
  { name: 'menu', title: 'Menu', icon: 'grid-outline', iconFocused: 'grid' },
  { name: 'alunos', title: 'Alunos', icon: 'people-outline', iconFocused: 'people' },
  { name: 'chamada', title: 'Chamada', icon: 'clipboard-outline', iconFocused: 'clipboard' },
  { name: 'financeiro', title: 'Financeiro', icon: 'wallet-outline', iconFocused: 'wallet' },
  { name: 'itinerario', title: 'Itinerário', icon: 'location-outline', iconFocused: 'location' },
  { name: 'rotas', title: 'Rotas', icon: 'navigate-outline', iconFocused: 'navigate' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
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
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
