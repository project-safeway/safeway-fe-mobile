import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';

const tabs = [
  { name: 'inicio', title: 'Início', icon: 'home-outline', iconFocused: 'home' },
  { name: 'acompanhar', title: 'Acompanhar', icon: 'location-outline', iconFocused: 'location' },
  { name: 'mensagens', title: 'Mensagens', icon: 'chatbubble-outline', iconFocused: 'chatbubble' },
  { name: 'perfil', title: 'Perfil', icon: 'person-outline', iconFocused: 'person' },
];

export default function PaisTabsLayout() {
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
            ...(tab.name === 'mensagens'
              ? { tabBarBadge: 2, tabBarBadgeStyle: { backgroundColor: colors.error } }
              : {}),
          }}
        />
      ))}
    </Tabs>
  );
}
