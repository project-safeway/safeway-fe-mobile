import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../components/BackHeader';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { KeyboardScreen } from '../components/KeyboardScreen';
import { colors } from '../constants/colors';
import { redefinirSenha, solicitarRecuperacaoSenha } from '../services/auth';
import { isValidEmail, validatePassword } from '../utils/validators';

export default function ForgotPasswordScreen() {
  const [etapa, setEtapa] = useState('solicitar');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const solicitarCodigo = async () => {
    if (!isValidEmail(email)) {
      setErrors({ email: 'Informe um e-mail válido' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await solicitarRecuperacaoSenha(email.trim());
      setEtapa('redefinir');
    } catch (erro) {
      Alert.alert('Não foi possível solicitar', erro.message);
    } finally {
      setLoading(false);
    }
  };

  const irParaCodigo = () => {
    if (!isValidEmail(email)) {
      setErrors({ email: 'Informe o e-mail da conta primeiro' });
      return;
    }
    setErrors({});
    setEtapa('redefinir');
  };

  const confirmarRedefinicao = async () => {
    const next = {};
    const codigoLimpo = codigo.replace(/\D/g, '');
    if (!isValidEmail(email)) next.email = 'E-mail inválido';
    if (codigoLimpo.length !== 6) next.codigo = 'Informe o código de 6 dígitos';

    const validacaoSenha = validatePassword(novaSenha, {
      minLength: 6,
      requireSpecialChars: true,
      requireUppercase: true,
      requireLowercase: true,
    });
    if (!validacaoSenha.isValid) next.novaSenha = validacaoSenha.message;
    if (confirmacao !== novaSenha) next.confirmacao = 'As senhas não coincidem';

    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await redefinirSenha({
        email: email.trim(),
        code: codigoLimpo,
        newPassword: novaSenha,
      });
      Alert.alert('Senha redefinida', 'Sua senha foi atualizada! Entre com a nova senha.', [
        { text: 'Ir para o login', onPress: () => router.replace('/login') },
      ]);
    } catch (erro) {
      Alert.alert('Não foi possível redefinir', erro.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardScreen edges={['top', 'bottom']}>
      <BackHeader
        title="Recuperar Senha"
        subtitle={
          etapa === 'solicitar'
            ? 'Informe seu e-mail para gerar um código de recuperação'
            : 'Digite o código de 6 dígitos e defina sua nova senha'
        }
      />

      {etapa === 'solicitar' ? (
        <>
          <Input
            label="E-mail da conta"
            placeholder="seuemail@exemplo.com.br"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          <Button
            title="Enviar código"
            onPress={solicitarCodigo}
            loading={loading}
            style={styles.submit}
          />

          <TouchableOpacity style={styles.linkBtn} onPress={irParaCodigo}>
            <Text style={styles.linkText}>Já tenho um código de recuperação</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Card style={styles.infoCard}>
            <Ionicons name="mail-open-outline" size={18} color={colors.primaryDark} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoText}>
                Código válido por 15 minutos para <Text style={styles.infoBold}>{email.trim()}</Text>.
              </Text>
              <View style={styles.infoActions}>
                <TouchableOpacity onPress={() => setEtapa('solicitar')} hitSlop={6}>
                  <Text style={styles.infoAction}>Alterar e-mail</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={solicitarCodigo} disabled={loading} hitSlop={6}>
                  <Text style={styles.infoAction}>Reenviar código</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          <Input
            label="Código de 6 dígitos"
            placeholder="000000"
            value={codigo}
            onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
            leftIcon="key-outline"
            keyboardType="number-pad"
            maxLength={6}
            error={errors.codigo}
          />

          <Input
            label="Nova senha"
            placeholder="Mínimo 6 caracteres"
            value={novaSenha}
            onChangeText={setNovaSenha}
            leftIcon="lock-closed-outline"
            isPassword
            error={errors.novaSenha}
          />

          <Input
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            value={confirmacao}
            onChangeText={setConfirmacao}
            leftIcon="lock-closed-outline"
            isPassword
            error={errors.confirmacao}
          />

          <Button
            title="Redefinir senha"
            onPress={confirmarRedefinicao}
            loading={loading}
            style={styles.submit}
          />
        </>
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  infoTextWrap: { flex: 1 },
  infoText: { fontSize: 13, lineHeight: 19, color: colors.text },
  infoBold: { fontWeight: '700' },
  infoActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  infoAction: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  submit: { marginTop: 8, borderRadius: 16 },
  linkBtn: { marginTop: 18, alignItems: 'center', paddingVertical: 8 },
  linkText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark, textDecorationLine: 'underline' },
});
