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
import { colors } from '../../../constants/colors';
import { mockMotorista } from '../../../data/mock';
import { isValidEmail, isValidPhone, isRequired, isValidPlaca } from '../../../utils/validators';
import { maskPhone, maskPlaca } from '../../../utils/formatters';

export default function MotoristaPerfilScreen() {
  const [nome, setNome] = useState(mockMotorista.nome);
  const [email, setEmail] = useState(mockMotorista.email);
  const [telefone, setTelefone] = useState(mockMotorista.telefone);
  const [veiculo, setVeiculo] = useState(mockMotorista.veiculo);
  const [placa, setPlaca] = useState(mockMotorista.placa);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const save = () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Nome obrigatório';
    if (!isValidEmail(email)) next.email = 'E-mail inválido';
    if (!isValidPhone(telefone)) next.telefone = 'Telefone inválido';
    if (!isRequired(veiculo)) next.veiculo = 'Modelo obrigatório';
    if (!isValidPlaca(placa)) next.placa = 'Placa inválida';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Perfil atualizado', 'Dados do motorista salvos (mock).');
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Meu Perfil</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color={colors.textSecondary} />
            </View>
            <Text style={styles.avatarHint}>Motorista</Text>
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
          <Input
            label="Modelo do veículo"
            value={veiculo}
            onChangeText={setVeiculo}
            leftIcon="bus-outline"
            error={errors.veiculo}
          />
          <Input
            label="Placa"
            value={placa}
            onChangeText={(v) => setPlaca(maskPlaca(v))}
            leftIcon="car-outline"
            autoCapitalize="characters"
            error={errors.placa}
          />

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
  backBtnPlaceholder: { width: 40 },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  avatarWrap: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
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
  save: { borderRadius: 16, marginTop: 8 },
  logout: { alignItems: 'center', marginTop: 18 },
  logoutText: { color: colors.error, fontWeight: '600', fontSize: 14 },
});
