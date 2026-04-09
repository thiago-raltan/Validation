import { Observable } from 'rxjs';

export function carregarColecaoFixture<T>(chave: string, seed: T[]): T[] {
  try {
    const salvo = localStorage.getItem(chave);
    if (salvo) {
      return JSON.parse(salvo) as T[];
    }
  } catch {
    // ignora leitura invalida e recarrega seed
  }

  const dados = clonarDados(seed);
  salvarColecaoFixture(chave, dados);
  return dados;
}

export function salvarColecaoFixture<T>(chave: string, dados: T[]): void {
  localStorage.setItem(chave, JSON.stringify(dados));
}

export function clonarDados<T>(dados: T): T {
  return JSON.parse(JSON.stringify(dados)) as T;
}

export function gerarProximoId<T extends { id: number }>(dados: T[], minimo = 1): number {
  return dados.reduce((maior, item) => Math.max(maior, item.id), minimo - 1) + 1;
}

export function lerArquivoComoDataUrl(arquivo: File): Observable<string> {
  return new Observable<string>((subscriber) => {
    const reader = new FileReader();

    reader.onload = () => {
      subscriber.next(String(reader.result ?? ''));
      subscriber.complete();
    };

    reader.onerror = () => {
      subscriber.error(new Error('Nao foi possivel ler o arquivo localmente.'));
    };

    reader.readAsDataURL(arquivo);

    return () => reader.abort();
  });
}