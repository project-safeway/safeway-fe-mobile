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
import { Checkbox } from '../components/Checkbox';
import { colors } from '../constants/colors';
import { validateRegisterForm, validatePassword, isValidPhone, validatePlaca } from '../utils/validators';
import { maskPhone, maskPlaca } from '../utils/formatters';
import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';

export default function RegisterScreen() {
  const scrollRef = useRef(null);
  const fieldY = useRef({});
  const keyboardInset = useKeyboardBottomInset();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    placa: '',
    modelo: '',
    capacidade: '',
    aceiteTermos: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const registerFieldY = (key) => (event) => {
    fieldY.current[key] = event.nativeEvent.layout.y;
  };

  const focusField = (key) => () => {
    const y = fieldY.current[key];
    if (typeof y !== 'number') return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(y - 20, 0),
        animated: true,
      });
    });
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSenhaChange = (value) => {
    updateField('senha', value);
    if (value.length > 0) {
      const result = validatePassword(value, {
        minLength: 6,
        requireSpecialChars: true,
        requireUppercase: true,
        requireLowercase: true,
      });
      setErrors((prev) => ({
        ...prev,
        senha: result.isValid ? undefined : result.message,
      }));
    }
  };

  const handleTelefoneChange = (value) => {
    const masked = maskPhone(value);
    updateField('telefone', masked);
    const clean = masked.replace(/\D/g, '');
    if (clean.length >= 10) {
      setErrors((prev) => ({
        ...prev,
        telefone: isValidPhone(masked) ? undefined : 'Telefone inválido',
      }));
    }
  };

  const handlePlacaChange = (value) => {
    const masked = maskPlaca(value);
    updateField('placa', masked);
    if (masked.replace('-', '').length >= 7) {
      const result = validatePlaca(masked);
      setErrors((prev) => ({
        ...prev,
        placa: result.isValid ? undefined : result.message,
      }));
    }
  };

  const handleSubmit = () => {
    const result = validateRegisterForm(form);
    setErrors(result.errors);
    if (!result.isValid) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Conta criada', 'Cadastro mockado com sucesso!', [
        { text: 'Entrar', onPress: () => router.replace('/login') },
      ]);
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Criar Conta</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 140 + (Platform.OS === 'android' ? keyboardInset : 0) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.heading}>Cadastre-se grátis</Text>
          <Text style={styles.subheading}>Comece agora a monitorar os trajetos.</Text>

          <View onLayout={registerFieldY('nome')}>
            <Input
              label="Nome completo"
              placeholder="Digite seu nome completo"
              value={form.nome}
              onChangeText={(v) => updateField('nome', v)}
              leftIcon="person-outline"
              error={errors.nome}
              onFocus={focusField('nome')}
            />
          </View>
          <View onLayout={registerFieldY('email')}>
            <Input
              label="E-mail"
              placeholder="seuemail@exemplo.com.br"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              onFocus={focusField('email')}
            />
          </View>
          <View onLayout={registerFieldY('senha')}>
            <Input
              label="Senha"
              placeholder="No mínimo 6 caracteres"
              value={form.senha}
              onChangeText={handleSenhaChange}
              leftIcon="lock-closed-outline"
              isPassword
              error={errors.senha}
              onFocus={focusField('senha')}
            />
          </View>
          <View onLayout={registerFieldY('telefone')}>
            <Input
              label="Telefone"
              placeholder="(11) 99999-9999"
              value={form.telefone}
              onChangeText={handleTelefoneChange}
              leftIcon="call-outline"
              keyboardType="phone-pad"
              error={errors.telefone}
              onFocus={focusField('telefone')}
            />
          </View>
          <View onLayout={registerFieldY('placa')}>
            <Input
              label="Placa do veículo"
              placeholder="ABC1D23"
              value={form.placa}
              onChangeText={handlePlacaChange}
              leftIcon="car-outline"
              autoCapitalize="characters"
              error={errors.placa}
              onFocus={focusField('placa')}
            />
          </View>
          <View onLayout={registerFieldY('modelo')}>
            <Input
              label="Modelo do veículo"
              placeholder="Ex.: Gol / Uno / Onix"
              value={form.modelo}
              onChangeText={(v) => updateField('modelo', v)}
              leftIcon="bus-outline"
              error={errors.modelo}
              onFocus={focusField('modelo')}
            />
          </View>
          <View onLayout={registerFieldY('capacidade')}>
            <Input
              label="Capacidade de passageiros"
              placeholder="Ex.: 4 / 5 / 7"
              value={form.capacidade}
              onChangeText={(v) => updateField('capacidade', v.replace(/\D/g, ''))}
              leftIcon="people-outline"
              keyboardType="number-pad"
              error={errors.capacidade}
              onFocus={focusField('capacidade')}
            />
          </View>

          <View style={styles.termsRow}>
            <Checkbox
              checked={form.aceiteTermos}
              onChange={(v) => updateField('aceiteTermos', v)}
            />
            <Text style={styles.termsText}>
              Concordo com os{' '}
              <Text style={styles.termsLink}>Termos de Uso</Text> e a{' '}
              <Text style={styles.termsLink}>Política de Privacidade</Text> do app.
            </Text>
          </View>
          {errors.aceiteTermos ? (
            <Text style={styles.termsError}>{errors.aceiteTermos}</Text>
          ) : null}

          <Button
            title="Finalizar Cadastro"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submit}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Entrar</Text>
              </TouchableOpacity>
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
    backgroundColor: colors.backgroundAlt,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 40,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    flexGrow: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 22,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primaryDark,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  termsError: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 8,
  },
  submit: {
    marginTop: 12,
    borderRadius: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
