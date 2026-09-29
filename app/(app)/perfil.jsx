import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { KeyboardScreen } from '../../components/KeyboardScreen';
import { colors } from '../../constants/colors';
import { mockMotorista } from '../../data/mock';
import {
  isValidEmail,
  isValidPhone,
  isRequired,
  isValidPlaca,
} from '../../utils/validators';
import { maskPhone, maskPlaca } from '../../utils/formatters';

export default function PerfilScreen() {
  const [nome, setNome] = useState(mockMotorista.nome);
  const [email, setEmail] = useState(mockMotorista.email);
  const [telefone, setTelefone] = useState(mockMotorista.telefone);
  const [veiculo, setVeiculo] = useState(mockMotorista.veiculo);
  const [placa, setPlaca] = useState(mockMotorista.placa);
  const [fotoUri, setFotoUri] = useState(mockMotorista.fotoUri || null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para alterar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setFotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à câmera para tirar a foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setFotoUri(result.assets[0].uri);
    }
  };

  const changePhoto = () => {
    Alert.alert('Foto de perfil', 'Escolha uma opção', [
      { text: 'Tirar foto', onPress: takePhoto },
      { text: 'Escolher da galeria', onPress: pickFromLibrary },
      ...(fotoUri
        ? [{ text: 'Remover foto', style: 'destructive', onPress: () => setFotoUri(null) }]
        : []),
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

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
    <KeyboardScreen edges={['top']}>
      <Text style={styles.eyebrow}>Conta</Text>
      <Text style={styles.title}>Meu Perfil</Text>
      <Text style={styles.subtitle}>Edite seus dados e a foto de perfil</Text>

      <View style={styles.avatarWrap}>
        <TouchableOpacity
          onPress={changePhoto}
          accessibilityLabel="Alterar foto de perfil"
          activeOpacity={0.85}
        >
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.white} />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color={colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
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
        leftIcon="car-outline"
        error={errors.veiculo}
      />
      <Input
        label="Placa"
        value={placa}
        onChangeText={(v) => setPlaca(maskPlaca(v))}
        leftIcon="document-outline"
        autoCapitalize="characters"
        error={errors.placa}
      />

      <Button title="Salvar alterações" onPress={save} loading={loading} style={styles.save} />

      <TouchableOpacity style={styles.logout} onPress={() => router.replace('/login')}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 13, color: colors.primary, fontWeight: '700', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 4, marginBottom: 20, fontSize: 14, color: colors.textSecondary },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarHint: { marginTop: 10, fontSize: 13, color: colors.textMuted },
  save: { marginTop: 8, borderRadius: 14 },
  logout: { marginTop: 20, alignItems: 'center', paddingVertical: 12 },
  logoutText: { color: colors.error, fontWeight: '600' },
});
