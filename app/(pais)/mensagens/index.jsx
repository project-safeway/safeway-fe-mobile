import { ChatThread } from '../../../components/ChatThread';
import { mockMotorista, mockMensagensPorConversa } from '../../../data/mock';

export default function PaisMensagensScreen() {
  return (
    <ChatThread
      title={mockMotorista.nome}
      subtitle="• Motorista • Online"
      online
      messages={mockMensagensPorConversa.mariana}
      selfRole="responsavel"
      showCall
      showBack={false}
      edges={['top']}
      bottomOffset={64}
    />
  );
}
