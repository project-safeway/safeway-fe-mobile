/**
 * Telefone brasileiro → só dígitos com DDI 55 (formato do contrato da IA), ou null se inválido.
 * Aceita "(11) 98765-4321", "011987654321", "+55 11 98765-4321", "5511987654321".
 */
export function normalizarTelefone(telefone) {
  let digitos = String(telefone ?? '').replace(/\D/g, '');
  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2);
  } else if (digitos.startsWith('0') && (digitos.length === 11 || digitos.length === 12)) {
    digitos = digitos.slice(1);
  }
  if (digitos.length !== 10 && digitos.length !== 11) return null;
  if (digitos[0] === '0' || digitos[1] === '0' || digitos[2] === '0') return null;
  if (digitos.length === 11 && digitos[2] !== '9') return null;
  return `55${digitos}`;
}

/** https://wa.me/<telefone>?text=<mensagem> — o motorista confirma o envio dentro do WhatsApp. */
export function montarLinkWhatsApp(telefone, mensagem) {
  const numero = normalizarTelefone(telefone);
  if (!numero) return null;
  const texto = String(mensagem ?? '').trim();
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

/** Busca do posto no Google Maps pelo endereço (abre o app de mapas se instalado). */
export function montarLinkMapa({ revenda, endereco, bairro, municipio } = {}) {
  const busca = [revenda, endereco, bairro, municipio].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busca)}`;
}

/** Link de localização usado nas mensagens de atraso (mesmo formato do contrato). */
export const linkLocalizacao = ({ latitude, longitude }) =>
  `https://www.google.com/maps?q=${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`;

const normalizar = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Palavras que podem acompanhar a confirmação sem mudar o sentido ("ok, pode mandar aí").
const NEUTRAS = new Set(
  (
    'sim ok okay beleza blz certo isso entao pode podes ai la ja agora a o as os essa esse esta este ela elas ' +
    'mensagem mensagens msg pra para por favor pf vai bora logo tudo todas todos whatsapp zap no proxima ' +
    'uma de do da'
  ).split(' ')
);
const ENVIAR = new Set(
  'manda mandar mande mandou envia enviar envie confirma confirmar confirmo confirmado dispara disparar segue'.split(' ')
);
const DESCARTAR = new Set(
  'cancela cancelar cancele descarta descartar descarte apaga apagar esquece esquecer deixa'.split(' ')
);
const NEGACAO = new Set(['nao', 'nem', 'negativo']);

/**
 * Detecta fala curta de confirmação depois de um rascunho de mensagem.
 * "pode mandar" → 'ENVIAR'; "cancela" / "não manda" → 'DESCARTAR'; qualquer outra coisa → null (vai para a IA).
 * @returns {'ENVIAR'|'DESCARTAR'|null}
 */
export function interpretarConfirmacao(texto) {
  const palavras = normalizar(texto).split(' ').filter(Boolean);
  if (!palavras.length || palavras.length > 6) return null;
  if (/^deixa (pra|para) la$/.test(palavras.join(' '))) return 'DESCARTAR';

  let negado = false;
  let acao = null;
  for (const palavra of palavras) {
    if (NEGACAO.has(palavra)) negado = true;
    else if (DESCARTAR.has(palavra)) acao = acao === 'ENVIAR' ? 'CONFLITO' : 'DESCARTAR';
    else if (ENVIAR.has(palavra)) acao = acao === 'DESCARTAR' ? 'CONFLITO' : 'ENVIAR';
    else if (!NEUTRAS.has(palavra)) return null;
  }
  if (acao === 'CONFLITO') return null;
  if (negado) return acao ? 'DESCARTAR' : palavras.length === 1 ? 'DESCARTAR' : null;
  if (!acao && palavras.length <= 3 && (palavras.includes('pode') || palavras.includes('sim'))) return 'ENVIAR';
  return acao;
}
