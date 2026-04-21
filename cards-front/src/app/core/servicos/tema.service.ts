import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type TemaAplicacao = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);
  private readonly chaveArmazenamento = 'triade_tema';
  private readonly temaAtualSignal = signal<TemaAplicacao>('dark');

  readonly temaAtual = this.temaAtualSignal.asReadonly();
  readonly temaEhDark = computed(() => this.temaAtualSignal() === 'dark');
  readonly rotuloTema = computed(() => this.temaEhDark() ? 'Ativar modo claro' : 'Ativar modo escuro');
  readonly iconeTema = computed(() => this.temaEhDark() ? '☀️' : '🌙');
  readonly logoAtual = computed(() => this.temaEhDark() ? 'assets/logo_triade_dark.jpeg' : 'assets/logo_triade_light.jpeg');

  constructor() {
    this.definirTema(this.obterTemaInicial());
  }

  alternarTema(): void {
    this.definirTema(this.temaEhDark() ? 'light' : 'dark');
  }

  definirTema(tema: TemaAplicacao): void {
    this.temaAtualSignal.set(tema);
    this.documento.body?.setAttribute('data-theme', tema);
    this.documento.documentElement?.setAttribute('data-theme', tema);
    localStorage.setItem(this.chaveArmazenamento, tema);
  }

  private obterTemaInicial(): TemaAplicacao {
    const salvo = localStorage.getItem(this.chaveArmazenamento);

    if (salvo === 'dark' || salvo === 'light') {
      return salvo;
    }

    return 'dark';
  }
}