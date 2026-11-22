import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { Button } from '../../../components/Button';
import { BackHeader } from '../../../components/BackHeader';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { isRequired } from '../../../utils/validators';
import { HORARIO_OPTIONS, TIPO_VIAGEM_OPTIONS } from '../../../utils/constants';
import { criarItinerario } from '../../../services/itinerarios';

export default function CadastrarItinerarioScreen() {
  const [nome, setNome] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [tipoViagem, setTipoViagem] = useState('TO_SCHOOL');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
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
    try {
      await criarItinerario({
        name: nome.trim(),
        startTime: `${horarioInicio}:00`,
        endTime: `${horarioFim}:00`,
        routeType: tipoViagem,
      });
      Alert.alert('Itinerário criado', 'Itinerário criado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Não foi possível criar', e.message);
    } finally {
      setLoading(false);
    }
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

      <View style={styles.row}>
        <View style={styles.col}>
          <Select
            label="Horário Início *"
            placeholder="--:--"
            value={horarioInicio}
            options={HORARIO_OPTIONS}
            onChange={setHorarioInicio}
            error={errors.horarioInicio}
          />
        </View>
        <View style={styles.col}>
          <Select
            label="Horário Fim *"
            placeholder="--:--"
            value={horarioFim}
            options={HORARIO_OPTIONS}
            onChange={setHorarioFim}
            error={errors.horarioFim}
          />
        </View>
      </View>

      <Select
        label="Tipo de Viagem *"
        value={tipoViagem}
        options={TIPO_VIAGEM_OPTIONS}
        onChange={setTipoViagem}
      />

      <Button title="Salvar Itinerário" onPress={submit} loading={loading} style={styles.submit} />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  submit: { marginTop: 12, borderRadius: 14 },
});
