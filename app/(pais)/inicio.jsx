import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { colors } from '../../constants/colors';
import {
  mockResponsavel,
  mockMotorista,
  mockProximaViagem,
  mockMensalidadePais,
} from '../../data/mock';
import { formatCurrency } from '../../utils/formatters';

export default function PaisInicioScreen() {
  const [viagemStatus, setViagemStatus] = useState(mockProximaViagem.status);
  const filho = mockResponsavel.filho;

  const confirmar = () => {
    setViagemStatus('confirmado');
    Alert.alert('Ida confirmada', `${filho.nome} irá na viagem de amanhã.`);
  };

  const rejeitar = () => {
    setViagemStatus('rejeitado');
    Alert.alert('Ida rejeitada', `${filho.nome} não irá nesta viagem.`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Responsável</Text>
            <Text style={styles.greeting}>Olá, {mockResponsavel.nome.split(' ')[0]}</Text>
          </View>
        </View>

        <Card>
          <View style={styles.cardHead}>
            <Text style={styles.cardLabel}>MEU FILHO</Text>
            <Ionicons name="person" size={16} color={colors.primary} />
          </View>
          <View style={styles.childRow}>
            <View style={styles.childAvatar}>
              <Ionicons name="person" size={22} color={colors.white} />
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{filho.nome}</Text>
              <Text style={styles.childMeta}>
                {filho.school} • {filho.grade}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.cardHead}>
            <Text style={styles.cardLabel}>MOTORISTA RESPONSÁVEL</Text>
            <Ionicons name="bus" size={16} color={colors.mapBlue} />
          </View>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={22} color={colors.textSecondary} />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.childName}>{mockMotorista.nome}</Text>
              <Text style={styles.childMeta}>
                {mockMotorista.veiculo} • {mockMotorista.telefone}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.phoneBtn}
              onPress={() => Linking.openURL(`tel:${mockMotorista.telefone.replace(/\D/g, '')}`)}
            >
              <Ionicons name="call" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <View style={styles.cardHead}>
            <Text style={styles.cardLabel}>PRÓXIMA VIAGEM / EMBARQUE</Text>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
          </View>
          <View style={styles.tripTop}>
            <Text style={styles.tripTime}>{mockProximaViagem.horario}</Text>
            <View style={styles.tripMeta}>
              <Text style={styles.tripDate}>{mockProximaViagem.dataLabel}</Text>
              <View
                style={[
                  styles.badge,
                  viagemStatus === 'confirmado' && styles.badgeOk,
                  viagemStatus === 'rejeitado' && styles.badgeNo,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    viagemStatus === 'confirmado' && styles.badgeTextOk,
                    viagemStatus === 'rejeitado' && styles.badgeTextNo,
                  ]}
                >
                  {viagemStatus === 'confirmado'
                    ? 'Confirmado'
                    : viagemStatus === 'rejeitado'
                      ? 'Não vai'
                      : 'Aguardando'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.routeRow}>
            <Text style={styles.routeText}>{mockProximaViagem.rota}</Text>
            <TouchableOpacity onPress={() => router.push('/(pais)/acompanhar')}>
              <Text style={styles.routeLink}>Ver Itinerário</Text>
            </TouchableOpacity>
          </View>
          {viagemStatus === 'aguardando' ? (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmar}>
                <Text style={styles.confirmText}>Confirmar Ida</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={rejeitar}>
                <Text style={styles.rejectText}>Rejeitar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </Card>

        <Card>
          <View style={styles.cardHead}>
            <Text style={styles.cardLabel}>MENSALIDADE E FINANCEIRO</Text>
            <Ionicons name="card-outline" size={16} color={colors.primary} />
          </View>
          <TouchableOpacity
            style={styles.financeRow}
            onPress={() => router.push('/(pais)/perfil/mensalidades')}
          >
            <View>
              <Text style={styles.childName}>{mockMensalidadePais.atual.titulo}</Text>
              <Text style={styles.childMeta}>{mockMensalidadePais.atual.vencimento}</Text>
            </View>
            <View style={styles.financeRight}>
              <Text style={styles.financeValue}>
                {formatCurrency(mockMensalidadePais.atual.valor)}
              </Text>
              <View style={styles.badgeOk}>
                <Text style={styles.badgeTextOk}>Em dia</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  header: { marginBottom: 16 },
  eyebrow: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  greeting: { fontSize: 26, fontWeight: '700', color: colors.text },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.textMuted,
    fontWeight: '700',
  },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '700', color: colors.text },
  childMeta: { marginTop: 3, fontSize: 13, color: colors.textMuted },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: { flex: 1 },
  phoneBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  tripTime: { fontSize: 28, fontWeight: '700', color: colors.text },
  tripMeta: { flex: 1 },
  tripDate: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeOk: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeNo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.errorBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  badgeTextOk: { fontSize: 12, fontWeight: '700', color: colors.success },
  badgeTextNo: { fontSize: 12, fontWeight: '700', color: colors.error },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  routeText: { flex: 1, fontSize: 13, color: colors.textSecondary, marginRight: 8 },
  routeLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  actions: { flexDirection: 'row', gap: 10 },
  confirmBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: colors.successAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  rejectBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { color: colors.error, fontWeight: '700', fontSize: 14 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  financeRight: { alignItems: 'flex-end', gap: 6 },
  financeValue: { fontSize: 18, fontWeight: '700', color: colors.text },
});
