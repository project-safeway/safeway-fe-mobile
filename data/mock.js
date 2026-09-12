export const mockAlunos = [
  {
    id: 1,
    name: 'Enzo Gabriel Silva',
    school: 'Colégio Anchieta',
    guardian: 'Mariana Silva',
    phone: '(11) 98765-4321',
    inviteId: 'enzo-gabriel-silva',
    grade: '3º Ano Ensino Fundamental',
  },
  {
    id: 2,
    name: 'Valentina Souza',
    school: 'Escola Est. Dom Pedro II',
    guardian: 'Carlos Souza',
    phone: '(11) 97654-3210',
    inviteId: 'valentina-souza',
    grade: '2º Ano',
  },
  {
    id: 3,
    name: 'Thiago Oliveira',
    school: 'Colégio Santa Maria',
    guardian: 'Ana Oliveira',
    phone: '(11) 96543-2109',
    inviteId: 'thiago-oliveira',
    grade: '4º Ano',
  },
  {
    id: 4,
    name: 'Mariana Santos',
    school: 'Escola Maple Bear',
    guardian: 'Roberto Santos',
    phone: '(11) 95432-1098',
    inviteId: 'mariana-santos',
    grade: '1º Ano',
  },
  {
    id: 5,
    name: 'Arthur Barbosa',
    school: 'Colégio Anchieta',
    guardian: 'Fernanda Barbosa',
    phone: '(11) 94321-0987',
    inviteId: 'arthur-barbosa',
    grade: '3º Ano',
  },
  {
    id: 6,
    name: 'Beatriz Lima',
    school: 'Colégio Santa Maria',
    guardian: 'Paulo Lima',
    phone: '(11) 93210-9876',
    inviteId: 'beatriz-lima',
    grade: '5º Ano',
  },
];

export const mockEscolas = [
  {
    id: 1,
    name: 'Colégio Anchieta',
    address: 'Av. Paulista, 1200 - Bela Vista',
    students: 14,
    phone: '(11) 3244-8800',
  },
  {
    id: 2,
    name: 'Escola Est. Dom Pedro II',
    address: 'Rua Augusta, 850 - Consolação',
    students: 9,
    phone: '(11) 3122-4500',
  },
  {
    id: 3,
    name: 'Colégio Santa Maria',
    address: 'Av. Brigadeiro Faria Lima, 2200',
    students: 11,
    phone: '(11) 3030-7700',
  },
  {
    id: 4,
    name: 'Escola Maple Bear',
    address: 'Rua Oscar Freire, 340 - Jardins',
    students: 7,
    phone: '(11) 3088-1200',
  },
];

export const mockFinanceiro = {
  receitaTotal: 4850,
  despesasTotal: 1620,
  saldoMensal: 3230,
  mensalidades: [
    { id: 1, name: 'Mariana Silva (Enzo)', amount: 450, status: 'pago' },
    { id: 2, name: 'Carlos Souza (Valentina)', amount: 450, status: 'pago' },
    { id: 3, name: 'Ana Oliveira (Thiago)', amount: 480, status: 'pendente' },
    { id: 4, name: 'Roberto Santos (Mariana)', amount: 520, status: 'pago' },
  ],
  despesas: [
    { id: 1, description: 'Combustível (Van)', date: 'Pago em 22/10', amount: 680 },
    { id: 2, description: 'Manutenção preventiva', date: 'Pago em 18/10', amount: 420 },
    { id: 3, description: 'Seguro mensal', date: 'Pago em 10/10', amount: 320 },
  ],
  chartReceitaDespesas: [
    { month: 'Jul', receita: 4200, despesa: 1500 },
    { month: 'Ago', receita: 4400, despesa: 1600 },
    { month: 'Set', receita: 4100, despesa: 1450 },
    { month: 'Out', receita: 4600, despesa: 1700 },
    { month: 'Nov', receita: 4700, despesa: 1550 },
    { month: 'Dez', receita: 4850, despesa: 1620 },
  ],
  composicaoDespesas: [
    { label: 'Combustível', percent: 40, color: '#F6923E' },
    { label: 'Manutenção', percent: 25, color: '#5C4033' },
    { label: 'Seguro', percent: 20, color: '#E05D26' },
    { label: 'Outros', percent: 15, color: '#F5C6A0' },
  ],
};

export const mockItinerario = [
  { id: 1, name: 'Enzo Gabriel Silva', address: 'Rua Pamplona, 450 - Ap 32', time: '06:45' },
  { id: 2, name: 'Valentina Souza', address: 'Av. Brigadeiro Luís Antônio, 890', time: '06:55' },
  { id: 3, name: 'Thiago Oliveira', address: 'Rua da Consolação, 2100', time: '07:05' },
  { id: 4, name: 'Mariana Santos', address: 'Rua Haddock Lobo, 595', time: '07:15' },
  { id: 5, name: 'Arthur Barbosa', address: 'Alameda Santos, 1200', time: '07:25' },
  { id: 6, name: 'Beatriz Lima', address: 'Rua Bela Cintra, 780', time: '07:35' },
];

export const mockRotas = {
  distancia: '14.8 km',
  tempoEstimado: '45 mins',
  pontos: '6 paradas',
  gpsConectado: true,
  paradas: [
    { id: 1, name: 'Enzo Gabriel', status: 'embarcado', time: '06:45 - Ok', type: 'done' },
    { id: 2, name: 'Valentina Souza', status: 'ausente', time: '06:55', type: 'absent' },
    { id: 3, name: 'Thiago Oliveira', status: 'próximo', time: '07:05', type: 'next' },
    { id: 4, name: 'Mariana Santos', status: null, time: '07:15', type: 'pending' },
  ],
};

export const mockChamadaHistorico = [
  { id: 1, label: 'Ontem, 23/10', percent: 100 },
  { id: 2, label: 'Quarta, 22/10', percent: 83 },
  { id: 3, label: 'Terça, 21/10', percent: 100 },
];

export const mockMotorista = {
  id: 1,
  nome: 'Carlos Oliveira',
  email: 'carlos.motorista@safeway.com',
  telefone: '(11) 99823-1122',
  veiculo: 'Van Escolar',
  placa: 'ABC-1D23',
};

export const mockResponsavel = {
  id: 1,
  nome: 'Mariana Silva',
  email: 'responsavel@exemplo.com.br',
  telefone: '(11) 98765-4321',
  filho: {
    id: 1,
    nome: 'Enzo Gabriel Silva',
    school: 'Colégio Anchieta',
    grade: '3º Ano Ensino Fundamental',
    inviteId: 'enzo-gabriel-silva',
  },
};

export const mockConvites = {
  'enzo-gabriel-silva': {
    id: 'enzo-gabriel-silva',
    motorista: mockMotorista,
    aluno: {
      nome: 'Enzo Gabriel Silva',
      school: 'Colégio Anchieta',
      grade: '3º Ano',
    },
  },
};

export const mockProximaViagem = {
  horario: '06:45',
  dataLabel: 'Amanhã, Quinta 25/10',
  status: 'aguardando',
  rota: 'Rota Escolar da Manhã (Ida)',
};

export const mockMensalidadePais = {
  atual: {
    titulo: 'Mensalidade de Outubro',
    vencimento: 'Vencimento 10/11',
    valor: 450,
    status: 'em_dia',
  },
  resumo: {
    totalPago: 3150,
    parcelasPagas: 7,
    totalPendente: 900,
    parcelasAbertas: 2,
  },
  historico: [
    { id: 1, mes: 'Outubro 2024', vencimento: '10/11', valor: 450, status: 'aguardando' },
    { id: 2, mes: 'Setembro 2024', vencimento: '10/10', valor: 450, status: 'aguardando' },
    { id: 3, mes: 'Agosto 2024', vencimento: '10/09', valor: 450, status: 'pago' },
    { id: 4, mes: 'Julho 2024', vencimento: '10/08', valor: 450, status: 'pago' },
    { id: 5, mes: 'Junho 2024', vencimento: '10/07', valor: 450, status: 'pago' },
    { id: 6, mes: 'Maio 2024', vencimento: '10/06', valor: 450, status: 'pago' },
    { id: 7, mes: 'Abril 2024', vencimento: '10/05', valor: 450, status: 'pago' },
  ],
};

export const mockAcompanharRota = {
  status: 'Em andamento',
  eta: '8 min',
  distancia: '1.2 km',
  motorista: mockMotorista,
  aluno: mockResponsavel.filho,
  paradas: [
    { id: 1, label: 'Saída da garagem', time: '06:30', done: true },
    { id: 2, label: 'Próximo à sua casa', time: '06:45', done: false, current: true },
    { id: 3, label: 'Colégio Anchieta', time: '07:20', done: false },
  ],
};

export const mockConversasMotorista = [
  {
    id: 'mariana',
    nome: 'Mariana Silva',
    aluno: 'Enzo Gabriel',
    lastMessage: 'Perfeito, ele já está descendo.',
    time: '07:39',
    unread: 2,
    online: true,
  },
  {
    id: 'ana',
    nome: 'Ana Oliveira',
    aluno: 'Thiago',
    lastMessage: 'Thiago não vai hoje, obrigada!',
    time: 'Ontem',
    unread: 0,
    online: false,
  },
  {
    id: 'fernanda',
    nome: 'Fernanda Barbosa',
    aluno: 'Arthur',
    lastMessage: 'Pode buscar 5 minutos mais cedo?',
    time: 'Seg',
    unread: 1,
    online: true,
  },
];

export const mockMensagensPorConversa = {
  mariana: [
    { id: 1, from: 'motorista', text: 'Bom dia! Estou saindo agora, chego em 10 minutos.', time: '07:30' },
    { id: 2, from: 'responsavel', text: 'Obrigada Carlos! O Enzo já está pronto.', time: '07:31' },
    { id: 3, from: 'motorista', text: 'Ótimo! Estou chegando na sua rua.', time: '07:38' },
    { id: 4, from: 'responsavel', text: 'Perfeito, ele já está descendo.', time: '07:39' },
  ],
  ana: [
    { id: 1, from: 'responsavel', text: 'Thiago não vai hoje, obrigada!', time: '18:20' },
    { id: 2, from: 'motorista', text: 'Combinado, Ana. Bom descanso!', time: '18:22' },
  ],
  fernanda: [
    { id: 1, from: 'responsavel', text: 'Pode buscar 5 minutos mais cedo?', time: '20:10' },
  ],
};
