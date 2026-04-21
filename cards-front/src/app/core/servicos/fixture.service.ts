import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { carregarColecaoFixture, clonarDados, salvarColecaoFixture } from './admin-fixture.store';
import { FIXTURES_CARTAS, FIXTURES_COLECOES, FIXTURES_PEDIDOS, FIXTURES_PRODUTOS, FIXTURES_USUARIOS } from './dev-fixtures';
import { Carta } from '../modelos/carta.model';
import { Colecao } from '../modelos/colecao.model';
import { ItemCarrinho } from '../modelos/carrinho.model';
import { Pedido } from '../modelos/pedido.model';
import { CategoriaProduto, Produto } from '../modelos/produto.model';
import { EnderecoUsuario, LoginAdmin, LoginUsuario, RespostaAuth, Usuario, UsuarioAdmin } from '../modelos/usuario.model';

type CredencialAdminTeste = RespostaAuth['usuario'] & { senha: string; aliases: string[] };

const TEXTOS_FIXTURE_LEGADOS: Readonly<Record<string, string>> = {
  'Carta promocional temporaria para manter a home e o catalogo preenchidos em desenvolvimento.':
    'Carta promocional com arte cosmica para destaque na home e no catalogo.',
  'Carta de agua com arte generica para o ambiente local.':
    'Carta de agua com arte oceanica e presenca marcante em campo.',
  'Carta de planta usada como fixture para filtros por tipo e raridade.':
    'Carta de planta voltada para estrategias de suporte e controle.',
  'Carta eletrica para reforcar o volume do catalogo durante a integracao.':
    'Carta eletrica de ritmo rapido para compor linhas ofensivas.',
  'Carta sombria para preencher buscas por preco intermediario.':
    'Carta sombria com presenca tatica e faixa de preco intermediaria.',
  'Carta defensiva com preco de entrada para simular estoque diverso.':
    'Carta defensiva com preco de entrada e boa resistencia em campo.',
  'Carta de suporte para manter o conjunto de floresta com mais de uma opcao.':
    'Carta de suporte com foco em consistencia e vantagem de recursos.',
  'Colecao temporaria com criaturas cosmicas e cartas de alto impacto visual.':
    'Colecao com criaturas cosmicas e cartas de alto impacto visual.',
  'Colecao de ritmo mais leve usada para destacar cartas de agua e suporte.':
    'Colecao de ritmo leve com foco em cartas de agua e suporte.',
  'Colecao local focada em tipos naturais e cartas de suporte.':
    'Colecao focada em tipos naturais e cartas de suporte.',
  'Colecao sintetica para preencher a pagina inicial com linha futurista.':
    'Colecao de linha futurista com criaturas mecanizadas e energia intensa.',
  'Action figure temporaria para preencher a secao de produtos.':
    'Action figure premium inspirada em Dragon Nova GX.',
  'Pelucia mockada para a pagina de produtos em desenvolvimento.':
    'Pelucia inspirada em Aqua Sentinel para a vitrine de colecionaveis.',
  'Box promocional usado como fixture para destacar compra por conjunto.':
    'Box promocional com itens da colecao Nebula Ascendente.',
  'Acessorio temporario para a vitrine enquanto a API de acessorios nao chega.':
    'Acessorio com acabamento texturizado para proteger o deck.',
  'Figure secundaria para simular mix de produtos premium.':
    'Figure de acabamento metalico voltada a colecionadores premium.',
};

const IDENTIDADES_FIXTURE_LEGADAS: Readonly<Record<string, string>> = {
  'Usuario Teste': 'Ana Martins',
  'teste@teste.com': 'ana.martins@triade.com.br',
  'Thiago Dev': 'Thiago Almeida',
  'dev@triade.local': 'thiago.almeida@triade.com.br',
  'admin@triade.local': 'marina.costa@triade.com.br',
  'mantenedor@triade.local': 'pedro.conteudo@triade.com.br',
};

@Injectable({ providedIn: 'root' })
export class FixtureService {
  private readonly CHAVE_CARTAS = 'admin_fixture_cartas';
  private readonly CHAVE_COLECOES = 'admin_fixture_colecoes';
  private readonly CHAVE_PRODUTOS = 'admin_fixture_produtos';
  private readonly CHAVE_PEDIDOS = 'admin_fixture_pedidos';
  private readonly CHAVE_PEDIDOS_LOCAIS = 'pedidos_fixtures_locais';
  private readonly CHAVE_USUARIOS = 'admin_fixture_usuarios';
  private readonly CHAVE_CARRINHO = 'carrinho';
  private readonly USUARIO_TESTE = 'ana.martins@triade.com.br';
  private readonly USUARIOS_TESTE_LEGADOS = ['teste@teste.com'];
  private readonly SENHA_TESTE = '123456';
  private readonly credenciaisAdminTeste: CredencialAdminTeste[] = [
    {
      id: 1,
      nome: 'Thiago Almeida',
      email: 'thiago.almeida@triade.com.br',
      usuario: 'dev',
      perfil: 'desenvolvedor',
      senha: '123',
      aliases: ['dev', 'developer', 'desenvolvedor', 'thiago'],
    },
    {
      id: 2,
      nome: 'Marina Admin',
      email: 'marina.costa@triade.com.br',
      usuario: 'admin',
      perfil: 'administrador',
      senha: '123',
      aliases: ['admin', 'administrador', 'marina'],
    },
    {
      id: 3,
      nome: 'Pedro Conteudo',
      email: 'pedro.conteudo@triade.com.br',
      usuario: 'mantenedor',
      perfil: 'mantenedor',
      senha: '123',
      aliases: ['mantenedor', 'cadastro', 'pedro'],
    },
  ];

  estaAtivo(): boolean {
    return environment.teste === true;
  }

  obterCartas(): Carta[] {
    const cartas = carregarColecaoFixture<Carta>(this.CHAVE_CARTAS, FIXTURES_CARTAS);
    return this.normalizarListaPersistida(
      cartas,
      this.CHAVE_CARTAS,
      (carta) => ({
        ...carta,
        descricao: this.normalizarTextoLegado(carta.descricao),
      })
    );
  }

  salvarCartas(cartas: Carta[]): void {
    salvarColecaoFixture(this.CHAVE_CARTAS, cartas);
  }

  obterCartaPorId(id: number): Carta | undefined {
    return this.obterCartas().find((carta) => carta.id === id);
  }

  obterCartasDestaque(): Carta[] {
    return this.obterCartas().filter((carta) => carta.destaque);
  }

  obterColecoes(): Colecao[] {
    const colecoes = carregarColecaoFixture<Colecao>(this.CHAVE_COLECOES, FIXTURES_COLECOES);
    return this.normalizarListaPersistida(
      colecoes,
      this.CHAVE_COLECOES,
      (colecao) => ({
        ...colecao,
        descricao: this.normalizarTextoLegado(colecao.descricao),
      })
    );
  }

  salvarColecoes(colecoes: Colecao[]): void {
    salvarColecaoFixture(this.CHAVE_COLECOES, colecoes);
  }

  obterColecaoPorId(id: number): Colecao | undefined {
    return this.obterColecoes().find((colecao) => colecao.id === id);
  }

  obterProdutos(categoria?: CategoriaProduto): Produto[] {
    const produtos = this.normalizarListaPersistida(
      carregarColecaoFixture<Produto>(this.CHAVE_PRODUTOS, FIXTURES_PRODUTOS),
      this.CHAVE_PRODUTOS,
      (produto) => ({
        ...produto,
        descricao: this.normalizarTextoLegado(produto.descricao),
      })
    );
    return categoria ? produtos.filter((produto) => produto.categoria === categoria) : produtos;
  }

  salvarProdutos(produtos: Produto[]): void {
    salvarColecaoFixture(this.CHAVE_PRODUTOS, produtos);
  }

  obterProdutoPorId(id: number): Produto | undefined {
    return this.obterProdutos().find((produto) => produto.id === id);
  }

  obterUsuariosAdmin(): UsuarioAdmin[] {
    const usuarios = carregarColecaoFixture<UsuarioAdmin>(this.CHAVE_USUARIOS, FIXTURES_USUARIOS);
    return this.normalizarListaPersistida(
      usuarios,
      this.CHAVE_USUARIOS,
      (usuario) => ({
        ...usuario,
        nome: this.normalizarTextoLegado(usuario.nome),
        email: this.normalizarTextoLegado(usuario.email),
      })
    );
  }

  salvarUsuariosAdmin(usuarios: UsuarioAdmin[]): void {
    salvarColecaoFixture(this.CHAVE_USUARIOS, usuarios);
  }

  obterPedidosBase(): Pedido[] {
    const pedidos = carregarColecaoFixture<Pedido>(this.CHAVE_PEDIDOS, FIXTURES_PEDIDOS);
    return this.normalizarListaPersistida(
      pedidos,
      this.CHAVE_PEDIDOS,
      (pedido) => ({
        ...pedido,
        nomeCliente: this.normalizarTextoLegado(pedido.nomeCliente),
        emailCliente: this.normalizarTextoLegado(pedido.emailCliente),
      })
    );
  }

  salvarPedidosBase(pedidos: Pedido[]): void {
    salvarColecaoFixture(this.CHAVE_PEDIDOS, pedidos);
  }

  obterPedidosLocais(): Pedido[] {
    try {
      const pedidos = localStorage.getItem(this.CHAVE_PEDIDOS_LOCAIS);
      const lista = pedidos ? (JSON.parse(pedidos) as Pedido[]) : [];
      return this.normalizarListaPersistida(lista, this.CHAVE_PEDIDOS_LOCAIS, (pedido) => ({
        ...pedido,
        nomeCliente: this.normalizarTextoLegado(pedido.nomeCliente),
        emailCliente: this.normalizarTextoLegado(pedido.emailCliente),
      }));
    } catch {
      return [];
    }
  }

  salvarPedidosLocais(pedidos: Pedido[]): void {
    localStorage.setItem(this.CHAVE_PEDIDOS_LOCAIS, JSON.stringify(pedidos));
  }

  obterPedidosUsuario(usuarioId?: number | null): Pedido[] {
    const filtrar = (pedido: Pedido) => usuarioId == null || pedido.usuarioId === usuarioId;
    const base = this.obterPedidosBase().filter(filtrar);
    const locais = this.obterPedidosLocais().filter(filtrar);
    const mapa = new Map<number, Pedido>();

    for (const pedido of [...base, ...locais]) {
      mapa.set(pedido.id, clonarDados(pedido));
    }

    return Array.from(mapa.values()).sort((a, b) => b.id - a.id);
  }

  carregarCarrinho(): ItemCarrinho[] {
    try {
      const carrinho = localStorage.getItem(this.CHAVE_CARRINHO);
      return carrinho ? (JSON.parse(carrinho) as ItemCarrinho[]) : [];
    } catch {
      return [];
    }
  }

  ehLoginUsuarioTeste(dados: LoginUsuario): boolean {
    const emailInformado = dados.email.trim().toLowerCase();
    return (emailInformado === this.USUARIO_TESTE || this.USUARIOS_TESTE_LEGADOS.includes(emailInformado)) && dados.senha === this.SENHA_TESTE;
  }

  criarRespostaLoginUsuarioTeste(): RespostaAuth {
    return {
      token: 'usuario-token-teste-local',
      usuario: {
        id: 999,
        nome: 'Ana Martins',
        email: this.USUARIO_TESTE,
        perfil: 'usuario',
      },
    };
  }

  criarPerfilUsuarioTeste(): Usuario {
    return {
      id: 999,
      nome: 'Ana Martins',
      email: this.USUARIO_TESTE,
      ativo: true,
      dataCadastro: '2025-11-02T10:00:00.000Z',
      totalPedidos: 2,
      enderecos: this.criarEnderecosTeste(),
    };
  }

  criarEnderecosTeste(): EnderecoUsuario[] {
    return [
      {
        id: 1,
        titulo: 'Casa',
        cep: '01001-000',
        logradouro: 'Rua das Colecoes',
        numero: '15',
        complemento: 'Casa 2',
        bairro: 'Centro',
        cidade: 'Sao Paulo',
        uf: 'SP',
        principal: true,
      },
      {
        id: 2,
        titulo: 'Trabalho',
        cep: '30140-071',
        logradouro: 'Avenida Aurora',
        numero: '240',
        complemento: 'Sala 12',
        bairro: 'Funcionarios',
        cidade: 'Belo Horizonte',
        uf: 'MG',
      },
      {
        id: 3,
        titulo: 'Familia',
        cep: '80010-120',
        logradouro: 'Rua do Deck',
        numero: '88',
        bairro: 'Centro Civico',
        cidade: 'Curitiba',
        uf: 'PR',
      },
    ];
  }

  autenticarAdminTeste(dados: LoginAdmin): RespostaAuth | null {
    const usuarioInformado = dados.usuario.trim().toLowerCase();
    const credencial = this.credenciaisAdminTeste.find(
      (item) => item.aliases.includes(usuarioInformado) && item.senha === dados.senha
    );

    if (!credencial) {
      return null;
    }

    const { senha: _senha, aliases: _aliases, ...usuario } = credencial;
    return {
      token: `admin-token-${usuario.perfil}-local`,
      usuario,
    };
  }

  private normalizarTextoLegado(valor: string): string {
    return TEXTOS_FIXTURE_LEGADOS[valor] ?? IDENTIDADES_FIXTURE_LEGADAS[valor] ?? valor;
  }

  private normalizarListaPersistida<T>(dados: T[], chave: string, normalizar: (item: T) => T): T[] {
    const normalizados = dados.map((item) => normalizar(item));
    if (JSON.stringify(normalizados) !== JSON.stringify(dados)) {
      salvarColecaoFixture(chave, normalizados);
    }

    return normalizados;
  }
}