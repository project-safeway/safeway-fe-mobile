import { VALIDATION_MESSAGES } from './constants';

/**
 * Valida formato de email
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Valida senha com critérios de segurança
 * @param {string} password
 * @param {Object} options
 * @returns {{ isValid: boolean, errors: string[], message: string }}
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 6,
    requireSpecialChars = true,
    requireUppercase = true,
    requireLowercase = true,
  } = options;

  const result = {
    isValid: true,
    errors: [],
  };

  if (!password || typeof password !== 'string') {
    result.isValid = false;
    result.errors.push('Senha é obrigatória');
    result.message = result.errors[0];
    return result;
  }

  if (password.length < minLength) {
    result.isValid = false;
    result.errors.push(`Mínimo ${minLength} caracteres`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Uma letra maiúscula');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Uma letra minúscula');
  }

  if (requireSpecialChars && !/[#@$%&*!?^]/.test(password)) {
    result.isValid = false;
    result.errors.push('Pelo menos um caractere especial (#@$%&*!?^)');
  }

  result.message = result.isValid
    ? 'Senha válida'
    : `Faltando: ${result.errors.join(', ')}`;

  return result;
}

/**
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  return validatePassword(password).isValid;
}

/**
 * Valida telefone brasileiro (10 ou 11 dígitos)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * @param {any} value
 * @returns {boolean}
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * @param {number|string} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function isInRange(value, min, max) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Valida placa brasileira (antiga ou Mercosul)
 * @param {string} placa
 * @returns {{ isValid: boolean, type: string|null, message: string }}
 */
export function validatePlaca(placa) {
  if (!placa || typeof placa !== 'string') {
    return { isValid: false, type: null, message: 'Placa é obrigatória' };
  }

  const cleanPlaca = placa.replace(/[-\s]/g, '').toUpperCase();
  const padraoAntigo = /^[A-Z]{3}[0-9]{4}$/;
  const padraoMercosul = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;

  if (padraoAntigo.test(cleanPlaca)) {
    return { isValid: true, type: 'antiga', message: 'Placa válida (padrão antigo)' };
  }

  if (padraoMercosul.test(cleanPlaca)) {
    return { isValid: true, type: 'mercosul', message: 'Placa válida (padrão Mercosul)' };
  }

  return {
    isValid: false,
    type: null,
    message: VALIDATION_MESSAGES.INVALID_PLACA,
  };
}

/**
 * @param {string} placa
 * @returns {boolean}
 */
export function isValidPlaca(placa) {
  return validatePlaca(placa).isValid;
}

/**
 * Valida formulário de login
 * @param {{ email: string, senha: string }} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateLoginForm(data) {
  const errors = {};

  if (!isRequired(data.email)) {
    errors.email = VALIDATION_MESSAGES.REQUIRED;
  } else if (!isValidEmail(data.email)) {
    errors.email = VALIDATION_MESSAGES.INVALID_EMAIL;
  }

  if (!isRequired(data.senha)) {
    errors.senha = VALIDATION_MESSAGES.REQUIRED;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida formulário de cadastro completo
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateRegisterForm(data) {
  const errors = {};

  if (!isRequired(data.nome)) {
    errors.nome = VALIDATION_MESSAGES.REQUIRED;
  }

  if (!isRequired(data.email)) {
    errors.email = VALIDATION_MESSAGES.REQUIRED;
  } else if (!isValidEmail(data.email)) {
    errors.email = VALIDATION_MESSAGES.INVALID_EMAIL;
  }

  const senhaResult = validatePassword(data.senha, {
    minLength: 6,
    requireSpecialChars: true,
    requireUppercase: true,
    requireLowercase: true,
  });
  if (!senhaResult.isValid) {
    errors.senha = senhaResult.message;
  }

  if (!isRequired(data.telefone)) {
    errors.telefone = VALIDATION_MESSAGES.REQUIRED;
  } else if (!isValidPhone(data.telefone)) {
    errors.telefone = VALIDATION_MESSAGES.INVALID_PHONE;
  }

  const placaResult = validatePlaca(data.placa);
  if (!placaResult.isValid) {
    errors.placa = placaResult.message;
  }

  if (!isRequired(data.modelo)) {
    errors.modelo = VALIDATION_MESSAGES.REQUIRED;
  }

  if (!isRequired(data.capacidade)) {
    errors.capacidade = VALIDATION_MESSAGES.REQUIRED;
  } else if (!isInRange(data.capacidade, 1, 100)) {
    errors.capacidade = VALIDATION_MESSAGES.INVALID_CAPACITY;
  }

  if (!data.aceiteTermos) {
    errors.aceiteTermos = VALIDATION_MESSAGES.TERMS_REQUIRED;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
