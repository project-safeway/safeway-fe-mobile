import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';

/**
 * @param {Object} props
 * @param {import('react-native-reanimated').AnimatedRef<Animated.ScrollView>} [props.scrollRef]
 */
export function KeyboardScreen({ children, contentStyle, edges = ['top', 'bottom'], scrollRef }) {
  const keyboardInset = useKeyboardBottomInset();

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Animated.ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            contentStyle,
            { paddingBottom: 32 + (Platform.OS === 'android' ? keyboardInset : 0) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {children}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, flexGrow: 1 },
});
