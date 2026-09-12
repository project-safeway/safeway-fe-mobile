import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {boolean} [props.online]
 * @param {Array<{id:number|string, from:string, text:string, time:string}>} props.messages
 * @param {'motorista'|'responsavel'} props.selfRole
 * @param {() => void} [props.onBack]
 * @param {boolean} [props.showCall]
 * @param {boolean} [props.showBack]
 * @param {Array<'top'|'right'|'bottom'|'left'>} [props.edges]
 * @param {number} [props.bottomOffset] espaço extra abaixo (ex.: tab bar)
 */
export function ChatThread({
  title,
  subtitle,
  online = false,
  messages: initialMessages,
  selfRole,
  onBack,
  showCall = true,
  showBack = true,
  edges = ['top', 'bottom'],
  bottomOffset = 0,
}) {
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');

  const sorted = useMemo(() => messages, [messages]);

  const composerLift = Math.max(
    0,
    keyboardInset - (Platform.OS === 'android' ? bottomOffset + insets.bottom : 0)
  );

  useEffect(() => {
    if (!keyboardInset) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [keyboardInset, messages.length]);

  const send = () => {
    const value = text.trim();
    if (!value) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        from: selfRole,
        text: value,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setText('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onBack || (() => router.back())}
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtnPlaceholder} />
        )}

        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.subtitleRow}>
              {online ? <View style={styles.onlineDot} /> : null}
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
        </View>

        {showCall ? (
          <TouchableOpacity style={styles.callBtn} accessibilityLabel="Ligar">
            <Ionicons name="call-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtnPlaceholder} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={sorted}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.from === selfRole;
            return (
              <View style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.theirsWrap]}>
                <View style={[styles.bubble, mine ? styles.mineBubble : styles.theirsBubble]}>
                  <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.text}</Text>
                </View>
                <Text style={[styles.time, mine && styles.timeMine]}>{item.time}</Text>
              </View>
            );
          }}
        />

        <View style={[styles.composer, { marginBottom: composerLift }]}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            onFocus={() => {
              setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
            }}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send} accessibilityLabel="Enviar">
            <Ionicons name="send" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPlaceholder: {
    width: 40,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubbleWrap: {
    maxWidth: '80%',
    marginBottom: 4,
  },
  mineWrap: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirsWrap: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mineBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirsBubble: {
    backgroundColor: '#ECE8E3',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  mineText: {
    color: colors.white,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  timeMine: {
    textAlign: 'right',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
