import { useLocalSearchParams, router } from 'expo-router';
import { ChatThread } from '../../../../components/ChatThread';
import { mockConversasMotorista, mockMensagensPorConversa } from '../../../../data/mock';

export default function MotoristaChatScreen() {
  const { id } = useLocalSearchParams();
  const conversa = mockConversasMotorista.find((item) => item.id === id) || mockConversasMotorista[0];
  const messages = mockMensagensPorConversa[conversa.id] || [];

  return (
    <ChatThread
      title={conversa.nome}
      subtitle={`• Responsável • ${conversa.aluno}`}
      online={conversa.online}
      messages={messages}
      selfRole="motorista"
      onBack={() => router.back()}
    />
  );
}
