import { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { BackHeader } from '../../../components/BackHeader';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { colors } from '../../../constants/colors';
import { isRequired } from '../../../utils/validators';

const HORARIOS = [
  '06:00', '06:30', '07:00', '07:30', '08:00',
  '12:00', '12:30', '13:00', '13:30', '14:00',
  '17:00', '17:30', '18:00', '18:30', '19:00',
];

export default function CadastrarItinerarioScreen() {
  const [nome, setNome] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [tipoViagem, setTipoViagem] = useState('SO_IDA');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Nome é obrigatório';
    if (!horarioInicio) next.horarioInicio = 'Horário de início é obrigatório';
    if (!horarioFim) next.horarioFim = 'Horário de fim é obrigatório';
    if (horarioInicio && horarioFim && horarioFim <= horarioInicio) {
      next.horarioFim = 'Horário de fim deve ser maior que o início';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Itinerário criado', 'Cadastro mockado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 500);
  };

  return (
    <KeyboardScreen>
      <BackHeader title="Cadastrar Itinerário" subtitle="Nova rota de transporte" />

      <Input
        label="Nome *"
        placeholder="Ex: Rota Escolar da Manhã"
        value={nome}
        onChangeText={setNome}
        error={errors.nome}
      />

      <Text style={styles.label}>Tipo de viagem *</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, tipoViagem === 'SO_IDA' && styles.chipActive]}
          onPress={() => setTipoViagem('SO_IDA')}
        >
          <Text style={[styles.chipText, tipoViagem === 'SO_IDA' && styles.chipTextActive]}>
            Ida
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, tipoViagem === 'SO_VOLTA' && styles.chipActive]}
          onPress={() => setTipoViagem('SO_VOLTA')}
        >
          <Text style={[styles.chipText, tipoViagem === 'SO_VOLTA' && styles.chipTextActive]}>
            Volta
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Horário de início *</Text>
      <View style={styles.chipsWrap}>
        {HORARIOS.map((h) => (
          <TouchableOpacity
            key={`ini-${h}`}
            style={[styles.timeChip, horarioInicio === h && styles.chipActive]}
            onPress={() => setHorarioInicio(h)}
          >
            <Text style={[styles.chipText, horarioInicio === h && styles.chipTextActive]}>{h}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.horarioInicio ? <Text style={styles.error}>{errors.horarioInicio}</Text> : null}

      <Text style={styles.label}>Horário de fim *</Text>
      <View style={styles.chipsWrap}>
        {HORARIOS.map((h) => (
          <TouchableOpacity
            key={`fim-${h}`}
            style={[styles.timeChip, horarioFim === h && styles.chipActive]}
            onPress={() => setHorarioFim(h)}
          >
            <Text style={[styles.chipText, horarioFim === h && styles.chipTextActive]}>{h}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.horarioFim ? <Text style={styles.error}>{errors.horarioFim}</Text> : null}

      <Button title="Salvar Itinerário" onPress={submit} loading={loading} style={styles.submit} />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '600', color: colors.text, fontSize: 13 },
  chipTextActive: { color: colors.white },
  error: { color: colors.error, fontSize: 12, marginBottom: 8 },
  submit: { marginTop: 12, borderRadius: 14 },
});
