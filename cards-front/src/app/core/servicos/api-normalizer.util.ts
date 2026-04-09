import { RespostaPaginada } from '../modelos/carta.model';

type ObjetoGenerico = Record<string, unknown>;

function paraNumero(valor: unknown, fallback: number): number {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor === 'string') {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : fallback;
  }
  return fallback;
}

export function normalizarRespostaPaginada<T>(resposta: unknown): RespostaPaginada<T> {
  const bruto = (resposta ?? {}) as ObjetoGenerico;
  const dadosBrutos = Array.isArray(bruto['dados'])
    ? bruto['dados']
    : Array.isArray(bruto['itens'])
      ? bruto['itens']
      : [];

  const itensPorPagina = paraNumero(bruto['itensPorPagina'], paraNumero(bruto['tamanhoPagina'], 20));
  const total = paraNumero(bruto['total'], paraNumero(bruto['totalItens'], dadosBrutos.length));
  const pagina = paraNumero(bruto['pagina'], 1);
  const totalPaginas = paraNumero(
    bruto['totalPaginas'],
    itensPorPagina > 0 ? Math.ceil(total / itensPorPagina) : 0
  );

  return {
    dados: dadosBrutos as T[],
    total,
    pagina,
    itensPorPagina,
    totalPaginas,
  };
}
