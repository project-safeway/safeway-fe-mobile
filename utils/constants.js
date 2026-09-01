export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  INVALID_EMAIL: 'E-mail inválido',
  INVALID_CPF: 'CPF inválido',
  INVALID_PHONE: 'Telefone inválido. Informe DDD + número (10 ou 11 dígitos)',
  PASSWORD_TOO_SHORT: 'Senha muito curta',
  PASSWORD_MISSING_NUMBER: 'Senha deve conter pelo menos um número',
  PASSWORD_MISSING_SPECIAL: 'Senha deve conter pelo menos um caractere especial',
  INVALID_PLACA: 'Placa inválida. Use AAA-0000 ou AAA-0A00',
  TERMS_REQUIRED: 'Você precisa concordar com os Termos de Uso',
  INVALID_CAPACITY: 'Capacidade deve ser um número entre 1 e 100',
};

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  PHONE: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  NUMBERS_ONLY: /^\d+$/,
};
