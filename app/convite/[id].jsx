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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors } from '../../constants/colors';
import { mockConvites } from '../../data/mock';
import { isRequired, isValidPhone, validatePassword } from '../../utils/validators';
import { maskPhone } from '../../utils/formatters';

export default function ConviteScreen() {
  const { id } = useLocalSearchParams();
  const convite = mockConvites[id] || mockConvites['enzo-gabriel-silva'];

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleActivate = () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Este campo é obrigatório';
    if (!isRequired(telefone)) next.telefone = 'Este campo é obrigatório';
    else if (!isValidPhone(telefone)) next.telefone = 'Telefone inválido';
    const senhaResult = validatePassword(senha, {
      minLength: 6,
      requireSpecialChars: false,
      requireUppercase: false,
      requireLowercase: false,
    });
    if (!senhaResult.isValid) next.senha = senhaResult.message;
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Conta ativada', 'Você já pode acompanhar o transporte do seu filho.', [
        { text: 'Entrar', onPress: () => router.replace('/(pais)/inicio') },
      ]);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Convite de Motorista</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inviteHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.textSecondary} />
            </View>
            <Text style={styles.heading}>Convite Recebido</Text>
            <Text style={styles.motorista}>Motorista {convite.motorista.nome}</Text>
            <Text style={styles.description}>
              O motorista {convite.motorista.nome.split(' ')[0]} convidou você para acompanhar o
              transporte escolar de{' '}
              <Text style={styles.bold}>{convite.aluno.nome}</Text>. Confirme os dados
              pré-preenchidos:
            </Text>
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>CRIANÇA / PASSAGEIRO</Text>
                <Text style={styles.infoValue}>{convite.aluno.nome}</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={18} color={colors.textMuted} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>ESCOLA / DESTINO</Text>
                <Text style={styles.infoValue}>
                  {convite.aluno.school} ({convite.aluno.grade})
                </Text>
              </View>
            </View>
          </Card>

          <Input
            label="Seu nome"
            placeholder="Digite seu nome completo"
            value={nome}
            onChangeText={setNome}
            leftIcon="person-outline"
            error={errors.nome}
          />
          <Input
            label="Seu telefone"
            placeholder="(11) 99999-9999"
            value={telefone}
            onChangeText={(v) => setTelefone(maskPhone(v))}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            error={errors.telefone}
          />
          <Input
            label="Criar senha de acesso"
            placeholder="No mínimo 6 caracteres"
            value={senha}
            onChangeText={setSenha}
            leftIcon="lock-closed-outline"
            isPassword
            error={errors.senha}
          />

          <Button
            title="Ativar Minha Conta"
            onPress={handleActivate}
            loading={loading}
            style={styles.submit}
          />
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
    paddingBottom: 40,
  },
  inviteHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8E2DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  motorista: {
    marginTop: 4,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  infoCard: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  submit: {
    marginTop: 8,
    borderRadius: 16,
  },
});
