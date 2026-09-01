import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { mockAlunos, mockChamadaHistorico } from '../../data/mock';

export default function ChamadaScreen() {
  const [presentes, setPresentes] = useState(() =>
    Object.fromEntries(mockAlunos.map((aluno) => [aluno.id, aluno.id !== 3]))
  );

  const presentesCount = useMemo(
    () => Object.values(presentes).filter(Boolean).length,
    [presentes]
  );

  const toggle = (id) => {
    setPresentes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Diário de Embarque" title="Fazer Chamada Diária" />

        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.chevron}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.dateText}>Quinta, 24 de Outubro</Text>
          </View>
          <TouchableOpacity style={styles.chevron}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {mockAlunos.map((aluno) => (
          <Card key={aluno.id} style={styles.alunoCard}>
            <View style={styles.alunoRow}>
              <View style={styles.alunoInfo}>
                <Text style={styles.alunoName}>{aluno.name}</Text>
                <Text style={styles.alunoSchool}>{aluno.school}</Text>
              </View>
              <Switch
                value={!!presentes[aluno.id]}
                onValueChange={() => toggle(aluno.id)}
                trackColor={{ false: '#E5E0DA', true: colors.successAlt }}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        ))}

        <Button
          title={`Salvar Chamada (${presentesCount}/${mockAlunos.length} Presentes)`}
          onPress={() =>
            Alert.alert('Chamada salva', `${presentesCount} alunos marcados como presentes.`)
          }
          style={styles.saveBtn}
        />

        <Text style={styles.historyTitle}>Histórico Recente</Text>
        {mockChamadaHistorico.map((item) => (
          <Card key={item.id} style={styles.historyCard}>
            <Text style={styles.historyLabel}>{item.label}</Text>
            <Text style={styles.historyPercent}>{item.percent}% presença</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3EEE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  alunoCard: {
    paddingVertical: 14,
  },
  alunoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alunoInfo: {
    flex: 1,
    marginRight: 12,
  },
  alunoName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  alunoSchool: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  saveBtn: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 16,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  historyLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  historyPercent: {
    fontSize: 14,
    color: colors.successAlt,
    fontWeight: '700',
  },
});
