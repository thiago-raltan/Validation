import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CarrinhoService } from '../../core/servicos/carrinho.service';
import { PedidoService } from '../../core/servicos/pedido.service';
import { CriarPedido } from '../../core/modelos/pedido.model';
import { AuthService } from '../../core/servicos/auth.service';
import { EnderecoUsuario } from '../../core/modelos/usuario.model';

/**
 * Página de checkout — coleta endereço e forma de pagamento para criar o pedido.
 */
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  private carrinhoService = inject(CarrinhoService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  readonly itens = this.carrinhoService.itens;
  readonly total = this.carrinhoService.total;
  readonly subtotal = this.carrinhoService.subtotal;
  readonly quantidadeTotal = this.carrinhoService.quantidadeTotal;

  enderecosSalvos: EnderecoUsuario[] = [];
  enderecoSelecionadoId: number | null = null;
  perfilCarregando = true;
  trocandoEndereco = false;

  enviando = false;
  erro = '';
  sucesso = false;
  pedidoId: number | null = null;

  formulario: FormGroup = this.fb.group({
    cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
    logradouro: ['', Validators.required],
    numero: ['', Validators.required],
    complemento: [''],
    bairro: ['', Validators.required],
    cidade: ['', Validators.required],
    uf: ['', [Validators.required, Validators.maxLength(2)]],
    formaPagamento: ['pix', Validators.required],
  });

  ngOnInit(): void {
    this.carregarPerfil();
  }

  get carrinhoVazio(): boolean {
    return this.itens().length === 0;
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
  }

  nomeItem(item: ReturnType<typeof this.itens>[0]): string {
    return item.carta?.nome ?? item.produto?.nome ?? '';
  }

  precoItem(item: ReturnType<typeof this.itens>[0]): number {
    return this.carrinhoService.obterPrecoItem(item);
  }

  finalizar(): void {
    if (this.enderecosSalvos.length > 0 && !this.enderecoSelecionado) {
      this.erro = 'Selecione um endereco de entrega para continuar.';
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.carrinhoVazio) return;

    this.enviando = true;
    this.erro = '';

    const v = this.formulario.getRawValue();
    const dados: CriarPedido = {
      itens: this.itens().map((item) => ({
        cartaId: item.carta?.id,
        produtoId: item.produto?.id,
        quantidade: item.quantidade,
      })),
      enderecoEntrega: {
        cep: v.cep,
        logradouro: v.logradouro,
        numero: v.numero,
        complemento: v.complemento || undefined,
        bairro: v.bairro,
        cidade: v.cidade,
        uf: v.uf.toUpperCase(),
      },
      formaPagamento: v.formaPagamento,
    };

    this.pedidoService.criarPedido(dados).subscribe({
      next: (pedido) => {
        this.carrinhoService.limparCarrinho();
        this.pedidoId = pedido.id;
        this.sucesso = true;
        this.enviando = false;
      },
      error: () => {
        this.erro = 'Erro ao finalizar o pedido. Tente novamente.';
        this.enviando = false;
      },
    });
  }

  campoInvalido(campo: string): boolean {
    const c = this.formulario.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  selecionarEndereco(endereco: EnderecoUsuario): void {
    this.enderecoSelecionadoId = endereco.id;
    this.trocandoEndereco = false;
    this.formulario.patchValue({
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento ?? '',
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf,
    });
    this.definirCamposEnderecoBloqueados(true);
  }

  trocarEndereco(): void {
    this.trocandoEndereco = true;
  }

  get enderecoSelecionado(): EnderecoUsuario | null {
    return this.enderecosSalvos.find((endereco) => endereco.id === this.enderecoSelecionadoId) ?? null;
  }

  get exibirListaEnderecos(): boolean {
    return this.enderecosSalvos.length > 0 && (this.trocandoEndereco || !this.enderecoSelecionado);
  }

  private carregarPerfil(): void {
    this.perfilCarregando = true;
    this.authService.obterPerfil().subscribe({
      next: (perfil) => {
        this.enderecosSalvos = (perfil.enderecos ?? []).slice(0, 3);
        const enderecoInicial = this.enderecosSalvos.find((endereco) => endereco.principal) ?? this.enderecosSalvos[0];

        if (enderecoInicial) {
          this.selecionarEndereco(enderecoInicial);
        } else {
          this.definirCamposEnderecoBloqueados(false);
        }

        this.perfilCarregando = false;
      },
      error: () => {
        this.enderecosSalvos = [];
        this.definirCamposEnderecoBloqueados(false);
        this.perfilCarregando = false;
      },
    });
  }

  private definirCamposEnderecoBloqueados(bloqueados: boolean): void {
    const campos = ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'];

    for (const campo of campos) {
      const controle = this.formulario.get(campo);
      if (!controle) {
        continue;
      }

      if (bloqueados) {
        controle.disable({ emitEvent: false });
      } else {
        controle.enable({ emitEvent: false });
      }
    }
  }
}
