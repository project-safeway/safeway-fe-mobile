import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '../constants/colors';
import { usandoMockCore } from '../services/api';
import { carregarSessao } from '../services/sessao';

export default function Index() {
  const [destino, setDestino] = useState(null);

  useEffect(() => {
    let ativo = true;
    carregarSessao().then((sessao) => {
      const logado = usandoMockCore() ? Boolean(sessao) : Boolean(sessao?.accessToken);
      if (ativo) setDestino(logado ? '/(app)' : '/login');
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (destino) return <Redirect href={destino} />;
  return (
    <View style={styles.carregando}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
