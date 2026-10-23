import { Stack } from 'expo-router';
import { colors } from '../../../constants/colors';

export default function FinanceiroLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
