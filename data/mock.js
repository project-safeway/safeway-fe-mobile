/** Mocks alinhados ao formato esperado pelo front-end web. */

export const mockMotorista = {
  id: 1,
  nome: 'Carlos Mendes',
  email: 'carlos.mendes@safeway.com',
  telefone: '(11) 98888-7777',
  veiculo: 'Sprinter 415',
  placa: 'ABC1D23',
  fotoUri: null,
};

export const mockEscolasComAlunos = [
  {
    escola: {
      id: 1,
      nome: 'Colégio Anchieta',
      nivelEnsino: 'ENSINO_FUNDAMENTAL',
      endereco: {
        logradouro: 'Av. Paulista',
        numero: '1200',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01310100',
        latitude: -23.668179,
        longitude: -46.491718,
      },
    },
    alunos: [
      { id: 1, nome: 'Enzo Gabriel Silva', serie: 3, sala: 'A', professor: 'Ana Paula' },
      { id: 5, nome: 'Arthur Barbosa', serie: 3, sala: 'B', professor: 'Ana Paula' },
    ],
  },
  {
    escola: {
      id: 2,
      nome: 'Escola Est. Dom Pedro II',
      nivelEnsino: 'ENSINO_FUNDAMENTAL',
      endereco: {
        logradouro: 'Rua Augusta',
        numero: '850',
        bairro: 'Consolação',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01305000',
        latitude: -23.667022,
        longitude:  -46.488248,
      },
    },
    alunos: [
      { id: 2, nome: 'Valentina Souza', serie: 2, sala: 'C', professor: 'Marcos Lima' },
    ],
  },
  {
    escola: {
      id: 3,
      nome: 'Colégio Santa Maria',
      nivelEnsino: 'ENSINO_FUNDAMENTAL',
      endereco: {
        logradouro: 'Av. Brigadeiro Faria Lima',
        numero: '2200',
        bairro: 'Itaim Bibi',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01452000',
        latitude: -23.669764,
        longitude: -46.487815,
      },
    },
    alunos: [
      { id: 3, nome: 'Thiago Oliveira', serie: 4, sala: 'A', professor: 'Carla Mendes' },
      { id: 6, nome: 'Beatriz Lima', serie: 5, sala: 'B', professor: 'Carla Mendes' },
    ],
  },
  {
    escola: {
      id: 4,
      nome: 'Escola Maple Bear',
      nivelEnsino: 'PRE_ESCOLA',
      endereco: {
        logradouro: 'Rua Oscar Freire',
        numero: '340',
        bairro: 'Jardins',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01426000',
        latitude: -23.5643,
        longitude: -46.6688,
      },
    },
    alunos: [
      { id: 4, nome: 'Mariana Santos', serie: 1, sala: 'A', professor: 'Juliana Rocha' },
    ],
  },
];

export const mockAlunosDetalhe = {
  1: {
    id: 1,
    nome: 'Enzo Gabriel Silva',
    dtNascimento: '2016-03-12',
    serie: 3,
    sala: 'A',
    professor: 'Ana Paula',
    valorPadraoMensalidade: 450,
    diaVencimento: 10,
    escola: mockEscolasComAlunos[0].escola,
    responsaveis: [
      {
        id: 1,
        nome: 'Mariana Silva',
        cpf: '123.456.789-00',
        tel1: '(11) 98765-4321',
        tel2: null,
        email: 'mariana.silva@email.com',
        endereco: {
          logradouro: 'Rua Pamplona',
          numero: '450',
          complemento: 'Ap 32',
          bairro: 'Jardim Paulista',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01405000',
          latitude: -23.668023,
          longitude: -46.494976,
        },
      },
    ],
  },
  2: {
    id: 2,
    nome: 'Valentina Souza',
    dtNascimento: '2017-08-21',
    serie: 2,
    sala: 'C',
    professor: 'Marcos Lima',
    valorPadraoMensalidade: 450,
    diaVencimento: 5,
    escola: mockEscolasComAlunos[1].escola,
    responsaveis: [
      {
        id: 2,
        nome: 'Carlos Souza',
        cpf: '987.654.321-00',
        tel1: '(11) 97654-3210',
        email: 'carlos.souza@email.com',
        endereco: {
          logradouro: 'Av. Brigadeiro Luís Antônio',
          numero: '890',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01317000',
          latitude: -23.668393,
          longitude: -46.493069,
        },
      },
    ],
  },
  3: {
    id: 3,
    nome: 'Thiago Oliveira',
    dtNascimento: '2015-01-09',
    serie: 4,
    sala: 'A',
    professor: 'Carla Mendes',
    valorPadraoMensalidade: 480,
    diaVencimento: 10,
    escola: mockEscolasComAlunos[2].escola,
    responsaveis: [
      {
        id: 3,
        nome: 'Ana Oliveira',
        tel1: '(11) 96543-2109',
        email: 'ana.oliveira@email.com',
        endereco: {
          logradouro: 'Rua da Consolação',
          numero: '2100',
          bairro: 'Consolação',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01302000',
          latitude: -23.667395,
          longitude: -46.491047,
        },
      },
    ],
  },
  4: {
    id: 4,
    nome: 'Mariana Santos',
    dtNascimento: '2018-11-02',
    serie: 1,
    sala: 'A',
    professor: 'Juliana Rocha',
    valorPadraoMensalidade: 520,
    diaVencimento: 15,
    escola: mockEscolasComAlunos[3].escola,
    responsaveis: [
      {
        id: 4,
        nome: 'Roberto Santos',
        tel1: '(11) 95432-1098',
        email: 'roberto.santos@email.com',
        endereco: {
          logradouro: 'Rua Haddock Lobo',
          numero: '595',
          bairro: 'Cerqueira César',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01414000',
          latitude: -23.5603,
          longitude: -46.6639,
        },
      },
    ],
  },
  5: {
    id: 5,
    nome: 'Arthur Barbosa',
    dtNascimento: '2016-06-30',
    serie: 3,
    sala: 'B',
    professor: 'Ana Paula',
    valorPadraoMensalidade: 450,
    diaVencimento: 10,
    escola: mockEscolasComAlunos[0].escola,
    responsaveis: [
      {
        id: 5,
        nome: 'Fernanda Barbosa',
        tel1: '(11) 94321-0987',
        email: 'fernanda.barbosa@email.com',
        endereco: {
          logradouro: 'Alameda Santos',
          numero: '1200',
          bairro: 'Jardim Paulista',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01418000',
          latitude: -23.666097, 
          longitude: -46.490639,
        },
      },
    ],
  },
  6: {
    id: 6,
    nome: 'Beatriz Lima',
    dtNascimento: '2014-09-18',
    serie: 5,
    sala: 'B',
    professor: 'Carla Mendes',
    valorPadraoMensalidade: 480,
    diaVencimento: 10,
    escola: mockEscolasComAlunos[2].escola,
    responsaveis: [
      {
        id: 6,
        nome: 'Paulo Lima',
        tel1: '(11) 93210-9876',
        email: 'paulo.lima@email.com',
        endereco: {
          logradouro: 'Rua Bela Cintra',
          numero: '780',
          bairro: 'Consolação',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01415000',
          latitude: -23.5571,
          longitude: -46.6601,
        },
      },
    ],
  },
};

export const mockItinerarios = [
  {
    id: 1,
    nome: 'Rota Escolar da Manhã',
    horarioInicio: '06:30',
    horarioFim: '07:45',
    tipoViagem: 'SO_IDA',
    ativo: true,
    alunos: [
      {
        alunoId: 1,
        nomeAluno: 'Enzo Gabriel Silva',
        nomeResponsavel: 'Mariana Silva',
        nomeEscola: 'Colégio Anchieta',
        sala: 'A',
        ordemEmbarque: 1,
        ordemGlobal: 1,
      },
      {
        alunoId: 2,
        nomeAluno: 'Valentina Souza',
        nomeResponsavel: 'Carlos Souza',
        nomeEscola: 'Escola Est. Dom Pedro II',
        sala: 'C',
        ordemEmbarque: 2,
        ordemGlobal: 2,
      },
      {
        alunoId: 3,
        nomeAluno: 'Thiago Oliveira',
        nomeResponsavel: 'Ana Oliveira',
        nomeEscola: 'Colégio Santa Maria',
        sala: 'A',
        ordemEmbarque: 3,
        ordemGlobal: 4,
      },
      {
        alunoId: 5,
        nomeAluno: 'Arthur Barbosa',
        nomeResponsavel: 'Fernanda Barbosa',
        nomeEscola: 'Colégio Anchieta',
        sala: 'B',
        ordemEmbarque: 4,
        ordemGlobal: 5,
      },
    ],
    escolas: [
      {
        escolaId: 1,
        nome: 'Colégio Anchieta',
        cidade: 'São Paulo',
        ordemVisita: 1,
        ordemGlobal: 3,
      },
      {
        escolaId: 2,
        nome: 'Escola Est. Dom Pedro II',
        cidade: 'São Paulo',
        ordemVisita: 2,
        ordemGlobal: 6,
      },
      {
        escolaId: 3,
        nome: 'Colégio Santa Maria',
        cidade: 'São Paulo',
        ordemVisita: 3,
        ordemGlobal: 7,
      },
    ],
  },
  {
    id: 2,
    nome: 'Rota Escolar da Tarde',
    horarioInicio: '16:30',
    horarioFim: '18:00',
    tipoViagem: 'SO_VOLTA',
    ativo: true,
    alunos: [
      {
        alunoId: 4,
        nomeAluno: 'Mariana Santos',
        nomeResponsavel: 'Roberto Santos',
        nomeEscola: 'Escola Maple Bear',
        sala: 'A',
        ordemEmbarque: 1,
        ordemGlobal: 1,
      },
      {
        alunoId: 6,
        nomeAluno: 'Beatriz Lima',
        nomeResponsavel: 'Paulo Lima',
        nomeEscola: 'Colégio Santa Maria',
        sala: 'B',
        ordemEmbarque: 2,
        ordemGlobal: 2,
      },
    ],
    escolas: [
      {
        escolaId: 4,
        nome: 'Escola Maple Bear',
        cidade: 'São Paulo',
        ordemVisita: 1,
        ordemGlobal: 3,
      },
      {
        escolaId: 3,
        nome: 'Colégio Santa Maria',
        cidade: 'São Paulo',
        ordemVisita: 2,
        ordemGlobal: 4,
      },
    ],
  },
];

const alunoChamada = (id, nome, sala, escola) => ({ id, nome, sala, escola: { nome: escola } });

/** Formato de `content` retornado por GET /chamada/historico/{itinerarioId}. */
export const mockHistoricoChamadas = {
  1: [
    {
      id: 103,
      status: 'EM_ANDAMENTO',
      alunos: [
        { aluno: alunoChamada(1, 'Enzo Gabriel Silva', 'A', 'Colégio Anchieta'), presenca: 'PRESENTE', dataHora: '2024-10-24T06:41:00' },
        { aluno: alunoChamada(2, 'Valentina Souza', 'C', 'Escola Est. Dom Pedro II'), presenca: 'PRESENTE', dataHora: '2024-10-24T06:48:00' },
      ],
    },
    {
      id: 102,
      status: 'FINALIZADA',
      alunos: [
        { aluno: alunoChamada(1, 'Enzo Gabriel Silva', 'A', 'Colégio Anchieta'), presenca: 'PRESENTE', dataHora: '2024-10-23T06:40:00' },
        { aluno: alunoChamada(2, 'Valentina Souza', 'C', 'Escola Est. Dom Pedro II'), presenca: 'PRESENTE', dataHora: '2024-10-23T06:47:00' },
        { aluno: alunoChamada(3, 'Thiago Oliveira', 'A', 'Colégio Santa Maria'), presenca: 'AUSENTE', dataHora: '2024-10-23T07:02:00' },
        { aluno: alunoChamada(5, 'Arthur Barbosa', 'B', 'Colégio Anchieta'), presenca: 'PRESENTE', dataHora: '2024-10-23T07:10:00' },
      ],
    },
    {
      id: 101,
      status: 'CANCELADA',
      alunos: [
        { aluno: alunoChamada(1, 'Enzo Gabriel Silva', 'A', 'Colégio Anchieta'), presenca: 'AUSENTE', dataHora: '2024-10-22T06:39:00' },
      ],
    },
    {
      id: 100,
      status: 'FINALIZADA',
      alunos: [
        { aluno: alunoChamada(1, 'Enzo Gabriel Silva', 'A', 'Colégio Anchieta'), presenca: 'PRESENTE', dataHora: '2024-10-21T06:42:00' },
        { aluno: alunoChamada(2, 'Valentina Souza', 'C', 'Escola Est. Dom Pedro II'), presenca: 'PRESENTE', dataHora: '2024-10-21T06:50:00' },
        { aluno: alunoChamada(3, 'Thiago Oliveira', 'A', 'Colégio Santa Maria'), presenca: 'PRESENTE', dataHora: '2024-10-21T07:01:00' },
        { aluno: alunoChamada(5, 'Arthur Barbosa', 'B', 'Colégio Anchieta'), presenca: 'AUSENTE', dataHora: '2024-10-21T07:09:00' },
      ],
    },
  ],
  2: [
    {
      id: 201,
      status: 'FINALIZADA',
      alunos: [
        { aluno: alunoChamada(4, 'Mariana Santos', 'A', 'Escola Maple Bear'), presenca: 'PRESENTE', dataHora: '2024-10-23T16:40:00' },
        { aluno: alunoChamada(6, 'Beatriz Lima', 'B', 'Colégio Santa Maria'), presenca: 'PRESENTE', dataHora: '2024-10-23T16:52:00' },
      ],
    },
  ],
};

/** Resumo retornado por POST /rotas/otimizar (distância em metros, tempo em segundos). */
export const mockRotas = {
  1: { distanciaTotal: 9400, tempoTotal: 2280 },
  2: { distanciaTotal: 6100, tempoTotal: 1560 },
};

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
};
