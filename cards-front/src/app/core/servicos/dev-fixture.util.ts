import { RespostaPaginada } from '../modelos/carta.model';

export function mesclarListasPorId<T extends { id: number }>(
  backend: T[],
  fixtures: T[],
  combinar?: (backendItem: T, fixtureItem: T) => T
): T[] {
  const mapa = new Map<number, T>();

  for (const item of backend) {
    mapa.set(item.id, item);
  }

  for (const item of fixtures) {
    const existente = mapa.get(item.id);
    if (existente) {
      mapa.set(item.id, combinar ? combinar(existente, item) : existente);
      continue;
    }

    mapa.set(item.id, item);
  }

  return Array.from(mapa.values());
}

export function paginarLista<T>(itens: T[], pagina: number, itensPorPagina: number): RespostaPaginada<T> {
  const paginaAtual = Math.max(1, pagina || 1);
  const tamanhoPagina = Math.max(1, itensPorPagina || 20);
  const inicio = (paginaAtual - 1) * tamanhoPagina;
  const dados = itens.slice(inicio, inicio + tamanhoPagina);
  const total = itens.length;

  return {
    dados,
    total,
    pagina: paginaAtual,
    itensPorPagina: tamanhoPagina,
    totalPaginas: Math.max(1, Math.ceil(total / tamanhoPagina)),
  };
}