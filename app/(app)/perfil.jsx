import { useEffect, useRef, useState } from 'react';
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
import { EstadoCarregamento } from '../../components/EstadoCarregamento';
import { colors } from '../../constants/colors';
import {
  isValidEmail,
  isValidPhone,
  isRequired,
  isValidPlaca,
} from '../../utils/validators';
import { maskPhone, maskPlaca } from '../../utils/formatters';
import {
  atualizarUsuario,
  buscarUsuario,
  atualizarFotoUsuario,
  removerFotoUsuario,
  carregarFotoUsuario,
  descartarFotoTemporaria,
} from '../../services/usuario';
import { sair } from '../../services/auth';

export default function PerfilScreen() {
  const [usuario, setUsuario] = useState(null);
  const [erroCarregamento, setErroCarregamento] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [placa, setPlaca] = useState('');
  const [fotoRemota, setFotoRemota] = useState(null);
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [fotoAlterada, setFotoAlterada] = useState(false);
  const [erroFoto, setErroFoto] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fotoArquivoRef = useRef(null);
  const fotoCarregamentoRef = useRef(0);
  const montadoRef = useRef(true);
  const fonteFoto = fotoAlterada
    ? (fotoSelecionada ? { uri: fotoSelecionada.uri } : null)
    : fotoRemota;

  const preencher = (dados) => {
    setUsuario(dados);
    setNome(dados.name ?? '');
    setEmail(dados.email ?? '');
    setTelefone(maskPhone(dados.primaryPhoneNumber ?? ''));
    setVeiculo(dados.transport?.model ?? '');
    setPlaca(maskPlaca(dados.transport?.licensePlate ?? ''));
    setFotoSelecionada(null);
    setFotoAlterada(false);
    setErroFoto(false);
  };

  const carregarFoto = async (temFoto) => {
    const carregamento = ++fotoCarregamentoRef.current;
    descartarFotoTemporaria(fotoArquivoRef.current);
    fotoArquivoRef.current = null;
    setFotoRemota(null);
    if (!temFoto) return;
    const arquivo = await carregarFotoUsuario();
    if (!montadoRef.current || carregamento !== fotoCarregamentoRef.current) {
      descartarFotoTemporaria(arquivo);
      return;
    }
    fotoArquivoRef.current = arquivo;
    setFotoRemota({ uri: arquivo.uri });
  };

  const carregar = () => {
    setErroCarregamento(null);
    buscarUsuario().then((dados) => {
      if (!montadoRef.current) return;
      preencher(dados);
      carregarFoto(dados.hasProfilePhoto).catch((erro) => {
        if (!montadoRef.current) return;
        setErroFoto(true);
        Alert.alert('Não foi possível carregar a foto', erro.message);
      });
    }).catch(setErroCarregamento);
  };

  useEffect(() => {
    montadoRef.current = true;
    carregar();
    return () => {
      montadoRef.current = false;
      fotoCarregamentoRef.current++;
      descartarFotoTemporaria(fotoArquivoRef.current);
    };
  }, []);

  const selecionarFoto = (asset) => {
    if (asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Foto muito grande', 'Escolha uma imagem de até 5 MB.');
      return;
    }
    setFotoSelecionada(asset);
    setFotoAlterada(true);
    setErroFoto(false);
  };

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
      selecionarFoto(result.assets[0]);
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
      selecionarFoto(result.assets[0]);
    }
  };

  const changePhoto = () => {
    if (loading) return;
    Alert.alert('Foto de perfil', 'Escolha uma opção', [
      { text: 'Tirar foto', onPress: takePhoto },
      { text: 'Escolher da galeria', onPress: pickFromLibrary },
      ...(fonteFoto || (usuario?.hasProfilePhoto && !fotoAlterada)
        ? [{
          text: 'Remover foto',
          style: 'destructive',
          onPress: () => {
            setFotoSelecionada(null);
            setFotoAlterada(true);
            setErroFoto(false);
          },
        }]
        : []),
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const save = async () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Nome obrigatório';
    if (!isValidEmail(email)) next.email = 'E-mail inválido';
    if (!isValidPhone(telefone)) next.telefone = 'Telefone inválido';
    if (!isRequired(veiculo)) next.veiculo = 'Modelo obrigatório';
    if (!isValidPlaca(placa)) next.placa = 'Placa inválida';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    let dadosSalvos = false;
    try {
      const atualizado = await atualizarUsuario({
        name: nome.trim(),
        email: email.trim(),
        primaryPhoneNumber: telefone.replace(/\D/g, ''),
        secondaryPhoneNumber: usuario.secondaryPhoneNumber,
        transport: {
          licensePlate: placa.replace(/[^A-Za-z0-9]/g, ''),
          model: veiculo.trim(),
          capacity: usuario.transport?.capacity,
        },
      });
      dadosSalvos = true;
      if (fotoAlterada) {
        if (fotoSelecionada) {
          await atualizarFotoUsuario(fotoSelecionada);
        } else {
          await removerFotoUsuario();
        }
      }
      const hasProfilePhoto = fotoAlterada ? !!fotoSelecionada : atualizado.hasProfilePhoto;
      preencher({
        ...atualizado,
        hasProfilePhoto,
      });
      await carregarFoto(hasProfilePhoto);
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos.');
    } catch (erro) {
      Alert.alert(
        dadosSalvos ? 'Dados salvos, mas houve um erro com a foto' : 'Não foi possível salvar',
        erro.message
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sair();
    router.replace('/login');
  };

  if (!usuario) {
    return (
      <KeyboardScreen edges={['top']}>
        <Text style={styles.eyebrow}>Conta</Text>
        <Text style={styles.title}>Meu Perfil</Text>
        <EstadoCarregamento erro={erroCarregamento} onTentarNovamente={carregar} />
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen edges={['top']}>
      <Text style={styles.eyebrow}>Conta</Text>
      <Text style={styles.title}>Meu Perfil</Text>
      <Text style={styles.subtitle}>Edite seus dados e a foto de perfil</Text>

      <View style={styles.avatarWrap}>
        <TouchableOpacity
          onPress={changePhoto}
          disabled={loading}
          accessibilityLabel="Alterar foto de perfil"
          activeOpacity={0.85}
        >
          {fonteFoto && !erroFoto ? (
            <Image
              source={fonteFoto}
              style={styles.avatarImg}
              onError={(evento) => {
                console.warn('[perfil] Falha ao carregar foto:', evento.nativeEvent.error);
                setErroFoto(true);
                Alert.alert('Não foi possível carregar a foto', 'Tente carregar a foto novamente.', [
                  { text: 'Tentar novamente', onPress: carregar },
                  { text: 'Fechar', style: 'cancel' },
                ]);
              }}
            />
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
        {erroFoto && !fotoAlterada && (
          <TouchableOpacity onPress={carregar} disabled={loading}>
            <Text style={styles.avatarHint}>Tentar carregar a foto novamente</Text>
          </TouchableOpacity>
        )}
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

      <TouchableOpacity style={styles.logout} onPress={logout}>
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
