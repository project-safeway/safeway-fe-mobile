import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors } from '../constants/colors';

const DOCUMENTOS = {
  termos: {
    titulo: 'Termos de Uso',
    atualizacao: 'Última atualização: Novembro de 2026',
    secoes: [
      {
        titulo: '1. Sobre o SafeWay',
        texto:
          'O SafeWay é uma plataforma de apoio à gestão diária de transporte escolar, destinada a motoristas para o controle de alunos, escolas, itinerários, chamadas de presença e fluxo financeiro.',
      },
      {
        titulo: '2. Conta e responsabilidade',
        texto:
          'Ao criar sua conta, você declara fornecer dados verdadeiros de identificação e do veículo utilizado no transporte. A guarda da senha e o uso correto das informações cadastradas são de responsabilidade exclusiva do motorista.',
      },
      {
        titulo: '3. Rotas, mapa e assistente por voz',
        texto:
          'As sugestões de ordem de rota, estimativas de distância/tempo e respostas do assistente por voz são ferramentas auxiliares e não substituem a atenção do motorista nem as leis de trânsito. Mensagens preparadas para responsáveis são apenas rascunhos: o envio final depende sempre da sua confirmação no WhatsApp.',
      },
      {
        titulo: '4. Uso adequado',
        texto:
          'É proibido utilizar o aplicativo para finalidades ilícitas, compartilhar credenciais de acesso ou inserir dados sem autorização dos responsáveis pelos alunos transportados.',
      },
    ],
  },
  privacidade: {
    titulo: 'Política de Privacidade',
    atualizacao: 'Em conformidade com a LGPD (Lei nº 13.709/2018)',
    secoes: [
      {
        titulo: '1. Dados tratados',
        texto:
          'O aplicativo trata dados cadastrais do motorista e do veículo, foto de perfil opcional, dados de escolas, alunos, responsáveis, endereços, registros de presença e lançamentos financeiros (mensalidades e despesas).',
      },
      {
        titulo: '2. Isolamento e dados de menores',
        texto:
          'Todos os registros de alunos, rotas e chamadas ficam restritos ao transporte do motorista autenticado, evitando acesso cruzado entre contas diferentes.',
      },
      {
        titulo: '3. Localização, câmera e microfone',
        texto:
          'A localização é usada somente enquanto o app está em uso para exibir o trajeto no mapa, calcular rotas e auxiliar o assistente em avisos de atraso ou busca de postos. Câmera/galeria são usadas apenas quando você escolhe alterar sua foto de perfil, e o microfone apenas quando você aciona o assistente.',
      },
      {
        titulo: '4. Sessão e segurança',
        texto:
          'A autenticação utiliza token JWT mantido apenas na memória do aparelho durante o uso: ao encerrar o aplicativo, é necessário entrar novamente. Você pode atualizar seus dados ou remover sua foto de perfil a qualquer momento na aba Perfil.',
      },
    ],
  },
};

/**
 * Modal de leitura dos Termos de Uso ou Política de Privacidade.
 * @param {Object} props
 * @param {'termos' | 'privacidade' | null} props.documento
 * @param {() => void} props.onClose
 */
export function DocumentoLegalModal({ documento, onClose }) {
  const insets = useSafeAreaInsets();
  const conteudo = documento ? DOCUMENTOS[documento] : null;

  return (
    <Modal visible={Boolean(conteudo)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          {conteudo ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>{conteudo.titulo}</Text>
                  <Text style={styles.subtitle}>{conteudo.atualizacao}</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityLabel="Fechar">
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {conteudo.secoes.map((secao) => (
                  <View key={secao.titulo} style={styles.secao}>
                    <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
                    <Text style={styles.secaoTexto}>{secao.texto}</Text>
                  </View>
                ))}
              </ScrollView>

              <Button title="Entendi" onPress={onClose} style={styles.btn} />
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerText: { flex: 1 },
  title: { fontSize: 19, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  body: { marginVertical: 14 },
  secao: { marginBottom: 14 },
  secaoTitulo: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  secaoTexto: { fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  btn: { borderRadius: 14 },
});
