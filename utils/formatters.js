/**
 * Formata valor como moeda brasileira
 * @param {number|string} value
 */
export function formatCurrency(value) {
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  } catch {
    return 'R$ 0,00';
  }
}

export function maskPhone(value) {
  if (!value) return '';
  let clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length > 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length > 6) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  if (clean.length > 2) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length > 0) return `(${clean}`;
  return clean;
}

export function formatPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export function maskPlaca(value) {
  if (!value) return '';
  let clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
  if (clean.length > 3) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return clean;
}

export function maskCEP(value) {
  if (!value) return '';
  let clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length > 5) return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  return clean;
}

export function maskCPF(value) {
  if (!value) return '';
  let clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length > 9) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  if (clean.length > 6) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  if (clean.length > 3) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  return clean;
}

export function maskDate(value) {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  const parts = [];
  if (numbers.length > 0) parts.push(numbers.slice(0, 2));
  if (numbers.length > 2) parts.push(numbers.slice(2, 4));
  if (numbers.length > 4) parts.push(numbers.slice(4, 8));
  return parts.join('/');
}

/** Formata enquanto digita: "68050" -> "680,50". */
export function maskMoney(value) {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
  if (!digits) return '';
  const cents = digits.padStart(3, '0');
  const inteiro = cents.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${inteiro},${cents.slice(-2)}`;
}

/** "1.234,56" -> 1234.56 */
export function parseMoney(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? Number(digits) / 100 : NaN;
}

/** "2026-10-22" -> "22/10/2026" */
export function isoToBR(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

/** "22/10/2026" -> "2026-10-22" (null se a data for inválida) */
export function brToISO(valor) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor || '');
  if (!match) return null;
  const [, d, m, a] = match;
  const data = new Date(Number(a), Number(m) - 1, Number(d));
  if (data.getDate() !== Number(d) || data.getMonth() !== Number(m) - 1) return null;
  return `${a}-${m}-${d}`;
}

export function formatDate(date) {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Data inválida';
    return new Intl.DateTimeFormat('pt-BR').format(dateObj);
  } catch {
    return 'Data inválida';
  }
}
