import { useState } from 'react';
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    const result = validateLoginForm({ email, senha });
    setErrors(result.errors);
    if (!result.isValid) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/menu');
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="bus-outline" size={36} color={colors.white} />
            </View>
            <Text style={styles.title}>Bem-vindo ao SafeWay</Text>
            <Text style={styles.subtitle}>
              Seja bem-vindo de volta,{'\n'}Insira suas informações abaixo!
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="E-mail"
              placeholder="seuemail@exemplo.com.br"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              variant="pill"
              error={errors.email}
            />
            <Input
              label="Senha"
              placeholder="Digite sua senha de acesso"
              value={senha}
              onChangeText={setSenha}
              leftIcon="lock-closed-outline"
              isPassword
              variant="pill"
              error={errors.senha}
            />

            <TouchableOpacity
              style={styles.forgot}
              onPress={() => Alert.alert('Em breve', 'Recuperação de senha ainda não disponível.')}
            >
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <Button title="Entrar no App" onPress={handleLogin} loading={loading} />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.divider} />
            </View>

            <Link href="/register" asChild>
              <Button title="Criar uma nova conta" variant="outline" />
            </Link>
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
    paddingTop: 36,
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
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
  },
  form: {
    marginBottom: 28,
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
  actions: {
    marginTop: 'auto',
    gap: 16,
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
});
