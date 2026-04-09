import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { AdminProdutoService } from '../../../core/servicos/admin-produto.service';
import { Produto, CATEGORIAS_PRODUTO, CategoriaProduto } from '../../../core/modelos/produto.model';

/** Gerenciamento de produtos (pelúcia, figura, box, acessório) no painel admin */
@Component({
  selector: 'app-admin-produtos',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './admin-produtos.component.html',
  styleUrls: ['./admin-produtos.component.scss'],
})
export class AdminProdutosComponent implements OnInit {
  private produtoService = inject(AdminProdutoService);
  private fb = inject(FormBuilder);

  produtos = signal<Produto[]>([]);
  carregando = signal(true);
  modalAberto = signal(false);
  editando = signal<Produto | null>(null);
  salvando = signal(false);
  buscaTexto = signal('');
  filtroCategoria = signal<CategoriaProduto | ''>('');

  readonly categorias = Object.entries(CATEGORIAS_PRODUTO) as [CategoriaProduto, string][];

  formulario: FormGroup = this.fb.group({
    nome: ['', Validators.required],
    descricao: ['', Validators.required],
    preco: [0, [Validators.required, Validators.min(0)]],
    categoria: ['', Validators.required],
    imagemUrl: ['', Validators.required],
    quantidadeEstoque: [0, [Validators.required, Validators.min(0)]],
    destaque: [false],
  });

  ngOnInit(): void {
    this.carregarDados();
  }

  private carregarDados(): void {
    this.carregando.set(true);
    const filtros = {
      categoria: this.filtroCategoria() || undefined,
      itensPorPagina: 100,
    };
    this.produtoService.listar(filtros).subscribe({
      next: (res) => { this.produtos.set(res.dados); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  produtosFiltrados(): Produto[] {
    const busca = this.buscaTexto().toLowerCase();
    return this.produtos().filter((p) => !busca || p.nome.toLowerCase().includes(busca));
  }

  nomeCategorias(cat: CategoriaProduto): string {
    return CATEGORIAS_PRODUTO[cat] ?? cat;
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.formulario.reset({ preco: 0, quantidadeEstoque: 0, destaque: false });
    this.modalAberto.set(true);
  }

  abrirEditar(produto: Produto): void {
    this.editando.set(produto);
    this.formulario.patchValue(produto);
    this.modalAberto.set(true);
  }

  fecharModal(): void { this.modalAberto.set(false); }

  salvar(): void {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    this.salvando.set(true);
    const dados = this.formulario.value;
    const prod = this.editando();
    const obs = prod ? this.produtoService.atualizar(prod.id, dados) : this.produtoService.criar(dados);
    obs.subscribe({
      next: () => { this.fecharModal(); this.carregarDados(); this.salvando.set(false); },
      error: () => this.salvando.set(false),
    });
  }

  remover(produto: Produto): void {
    if (!confirm(`Remover "${produto.nome}"?`)) return;
    this.produtoService.remover(produto.id, produto.categoria).subscribe({ next: () => this.carregarDados() });
  }

  atualizarBusca(event: Event): void {
    this.buscaTexto.set((event.target as HTMLInputElement).value);
  }

  atualizarFiltroCategoria(event: Event): void {
    this.filtroCategoria.set((event.target as HTMLSelectElement).value as CategoriaProduto | '');
    this.carregarDados();
  }
}
