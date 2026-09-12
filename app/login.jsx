import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { validateLoginForm } from '../utils/validators';
import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';

export default function LoginScreen() {
  const scrollRef = useRef(null);
  const fieldY = useRef({});
  const keyboardInset = useKeyboardBottomInset();
  const [role, setRole] = useState('motorista');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isResponsavel = role === 'responsavel';

  const registerFieldY = (key) => (event) => {
    fieldY.current[key] = event.nativeEvent.layout.y;
  };

  const focusField = (key) => () => {
    const y = fieldY.current[key];
    if (typeof y !== 'number') return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(y - 24, 0),
        animated: true,
      });
    });
  };

  const handleLogin = () => {
    const result = validateLoginForm({ email, senha });
    setErrors(result.errors);
    if (!result.isValid) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (isResponsavel) {
        router.replace('/(pais)/inicio');
      } else {
        router.replace('/(motorista)/menu');
      }
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 28 + (Platform.OS === 'android' ? keyboardInset : 0) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="bus-outline" size={36} color={colors.white} />
            </View>
            <Text style={styles.title}>Bem-vindo ao SafeWay</Text>
            <Text style={styles.subtitle}>
              {isResponsavel
                ? 'Monitore o transporte escolar do seu filho em tempo real'
                : 'Gerencie rotas, alunos e o dia a dia do transporte escolar'}
            </Text>
          </View>

          <View style={styles.roleSwitch}>
            <TouchableOpacity
              style={[styles.roleBtn, !isResponsavel && styles.roleBtnActive]}
              onPress={() => setRole('motorista')}
            >
              <Text style={[styles.roleText, !isResponsavel && styles.roleTextActive]}>
                Motorista
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, isResponsavel && styles.roleBtnActive]}
              onPress={() => setRole('responsavel')}
            >
              <Text style={[styles.roleText, isResponsavel && styles.roleTextActive]}>
                Responsável
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View onLayout={registerFieldY('email')}>
              <Input
                label={isResponsavel ? 'E-mail dos pais' : 'E-mail'}
                placeholder={
                  isResponsavel ? 'responsavel@exemplo.com.br' : 'seuemail@exemplo.com.br'
                }
                value={email}
                onChangeText={setEmail}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
                onFocus={focusField('email')}
              />
            </View>
            <View onLayout={registerFieldY('senha')}>
              <Input
                label="Senha"
                placeholder="Digite sua senha de acesso"
                value={senha}
                onChangeText={setSenha}
                leftIcon="lock-closed-outline"
                isPassword
                error={errors.senha}
                onFocus={focusField('senha')}
              />
            </View>

            <TouchableOpacity
              style={styles.forgot}
              onPress={() => Alert.alert('Em breve', 'Recuperação de senha ainda não disponível.')}
            >
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>

          <Button title="Entrar no App" onPress={handleLogin} loading={loading} />

          <View style={styles.footer}>
            {isResponsavel ? (
              <TouchableOpacity
                style={styles.inviteLink}
                onPress={() => router.push('/convite/enzo-gabriel-silva')}
              >
                <Text style={styles.inviteText}>
                  Recebeu um convite de motorista? Acesse aqui
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OU</Text>
                  <View style={styles.divider} />
                </View>

                <Link href="/register" asChild>
                  <Button title="Criar uma nova conta" variant="outline" />
                </Link>
              </>
            )}
          </View>
        </ScrollView>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F1EEEA',
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  roleBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBtnActive: {
    backgroundColor: colors.primary,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleTextActive: {
    color: colors.white,
  },
  form: {
    marginBottom: 20,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 16,
    gap: 16,
    minHeight: 120,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  inviteLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  inviteText: {
    fontSize: 13,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
