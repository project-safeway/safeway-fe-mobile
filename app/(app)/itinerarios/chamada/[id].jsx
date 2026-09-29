import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { BackHeader } from '../../../../components/BackHeader';
import { Card } from '../../../../components/Card';
import { Button } from '../../../../components/Button';
import { KeyboardScreen } from '../../../../components/KeyboardScreen';
import { colors } from '../../../../constants/colors';
import { mockItinerarios } from '../../../../data/mock';

export default function ChamadaScreen() {
  const { id } = useLocalSearchParams();
  const itinerario = useMemo(
    () => mockItinerarios.find((i) => String(i.id) === String(id)) || mockItinerarios[0],
    [id]
  );

  const [alunos, setAlunos] = useState(() =>
    [...(itinerario.alunos || [])]
      .sort((a, b) => (a.ordemEmbarque || 0) - (b.ordemEmbarque || 0))
      .map((a) => ({
        id: a.alunoId,
        nomeAluno: a.nomeAluno,
        responsavel: a.nomeResponsavel,
        escola: a.nomeEscola,
        sala: a.sala,
        presente: null,
      }))
  );
  const [indice, setIndice] = useState(0);

  const atual = alunos[indice];
  const registrados = alunos.filter((a) => a.presente !== null).length;

  const marcar = (presente) => {
    setAlunos((prev) =>
      prev.map((a, i) => (i === indice ? { ...a, presente } : a))
    );
    if (indice < alunos.length - 1) {
      setIndice((i) => i + 1);
    } else {
      Alert.alert('Último aluno', 'Todos registrados. Finalize a chamada.');
    }
  };

  const finalizar = () => {
    const pendentes = alunos.filter((a) => a.presente === null).length;
    if (pendentes > 0) {
      Alert.alert(
        'Finalizar chamada',
        `Ainda há ${pendentes} aluno(s) sem registro. Finalizar mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Finalizar',
            onPress: () =>
              Alert.alert('Chamada finalizada', 'Presença salva (mock).', [
                { text: 'OK', onPress: () => router.back() },
              ]),
          },
        ]
      );
      return;
    }
    Alert.alert('Chamada finalizada', 'Presença salva (mock).', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  if (!atual) {
    return (
      <KeyboardScreen>
        <BackHeader title="Chamada" subtitle={itinerario.nome} />
        <Text style={styles.empty}>Nenhum aluno neste itinerário.</Text>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen>
      <BackHeader title="Chamada" subtitle={itinerario.nome} />

      <Text style={styles.progress}>
        {registrados}/{alunos.length} registrados • Aluno {indice + 1} de {alunos.length}
      </Text>

      <Card style={styles.card}>
        <Text style={styles.nome}>{atual.nomeAluno}</Text>
        <Text style={styles.meta}>Responsável: {atual.responsavel || 'Não informado'}</Text>
        <Text style={styles.meta}>Escola: {atual.escola || 'Não informado'}</Text>
        {atual.sala ? <Text style={styles.meta}>Sala: {atual.sala}</Text> : null}
      </Card>

      <View style={styles.actions}>
        <Button
          title="Presente"
          onPress={() => marcar(true)}
          style={[styles.btn, { backgroundColor: colors.successAlt }]}
        />
        <Button
          title="Ausente"
          variant="outline"
          onPress={() => marcar(false)}
          style={styles.btn}
        />
      </View>

      <View style={styles.nav}>
        <Button
          title="Anterior"
          variant="soft"
          disabled={indice === 0}
          onPress={() => setIndice((i) => Math.max(0, i - 1))}
          style={styles.navBtn}
        />
        <Button
          title="Próximo"
          variant="soft"
          disabled={indice === alunos.length - 1}
          onPress={() => setIndice((i) => Math.min(alunos.length - 1, i + 1))}
          style={styles.navBtn}
        />
      </View>

      <Button title="Finalizar Chamada" onPress={finalizar} style={styles.finish} />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  progress: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  card: { marginBottom: 16 },
  nome: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 },
  meta: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btn: { flex: 1, borderRadius: 14 },
  nav: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  navBtn: { flex: 1, borderRadius: 12 },
  finish: { borderRadius: 14 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
});
