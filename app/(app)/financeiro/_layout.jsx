import { Stack } from 'expo-router';
import { colors } from '../../../constants/colors';
import { FinanceiroProvider } from '../../../contexts/FinanceiroContext';

export default function FinanceiroLayout() {
  return (
    <FinanceiroProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </FinanceiroProvider>
  );
}
