import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { mockResponsavel } from '../../../data/mock';
import { isValidEmail, isValidPhone, isRequired } from '../../../utils/validators';
import { maskPhone } from '../../../utils/formatters';

export default function PaisPerfilScreen() {
  const [nome, setNome] = useState(mockResponsavel.nome);
  const [email, setEmail] = useState(mockResponsavel.email);
  const [telefone, setTelefone] = useState(mockResponsavel.telefone);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const save = () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Nome obrigatório';
    if (!isValidEmail(email)) next.email = 'E-mail inválido';
    if (!isValidPhone(telefone)) next.telefone = 'Telefone inválido';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos (mock).');
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>Conta</Text>
          <Text style={styles.title}>Meu Perfil</Text>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color={colors.textSecondary} />
            </View>
            <Text style={styles.avatarHint}>Responsável</Text>
          </View>

          <Input
            label="Nome completo"
            value={nome}
            onChangeText={setNome}
            leftIcon="person-outline"
            error={errors.nome}
          />
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Telefone"
            value={telefone}
            onChangeText={(v) => setTelefone(maskPhone(v))}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            error={errors.telefone}
          />

          <Card>
            <Text style={styles.cardLabel}>FILHO VINCULADO</Text>
            <Text style={styles.childName}>{mockResponsavel.filho.nome}</Text>
            <Text style={styles.childMeta}>
              {mockResponsavel.filho.school} • {mockResponsavel.filho.grade}
            </Text>
          </Card>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => router.push('/(pais)/perfil/mensalidades')}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="card-outline" size={20} color={colors.primary} />
              <Text style={styles.linkText}>Histórico de mensalidades</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <Button title="Salvar alterações" onPress={save} loading={loading} style={styles.save} />

          <TouchableOpacity style={styles.logout} onPress={() => router.replace('/login')}>
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  eyebrow: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 18 },
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E8E2DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarHint: { fontSize: 13, color: colors.textMuted },
  cardLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 6,
  },
  childName: { fontSize: 16, fontWeight: '700', color: colors.text },
  childMeta: { marginTop: 3, fontSize: 13, color: colors.textMuted },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 16,
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { fontSize: 15, fontWeight: '600', color: colors.text },
  save: { borderRadius: 16 },
  logout: { alignItems: 'center', marginTop: 18 },
  logoutText: { color: colors.error, fontWeight: '600', fontSize: 14 },
});
