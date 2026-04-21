import { Routes } from '@angular/router';
import { adminGuard, naoAdminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

/** Rotas principais da aplicação com lazy loading para melhor performance */
export const routes: Routes = [
  // ─── Rotas públicas ──────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./paginas/inicio/inicio.component').then((m) => m.InicioComponent),
    title: 'Inicio | Tríade',
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./paginas/catalogo/catalogo.component').then((m) => m.CatalogoComponent),
    title: 'Catalogo | Tríade',
  },
  {
    path: 'colecoes',
    loadComponent: () =>
      import('./paginas/colecoes/colecoes.component').then((m) => m.ColecoesComponent),
    title: 'Colecoes | Tríade',
  },
  {
    path: 'produtos',
    loadComponent: () =>
      import('./paginas/produtos/produtos.component').then((m) => m.ProdutosComponent),
    title: 'Produtos | Tríade',
  },
  {
    path: 'carta/:id',
    loadComponent: () =>
      import('./paginas/detalhe-carta/detalhe-carta.component').then(
        (m) => m.DetalheCartaComponent
      ),
    title: 'Detalhe da Carta | Tríade',
  },
  {
    path: 'produto/:id',
    loadComponent: () =>
      import('./paginas/detalhe-produto/detalhe-produto.component').then(
        (m) => m.DetalheProdutoComponent
      ),
    title: 'Detalhe do Produto | Tríade',
  },
  {
    path: 'carrinho',
    loadComponent: () =>
      import('./paginas/carrinho/carrinho.component').then((m) => m.CarrinhoComponent),
    title: 'Carrinho | Tríade',
  },
  {
    path: 'sobre',
    loadComponent: () =>
      import('./paginas/sobre/sobre.component').then((m) => m.SobreComponent),
    title: 'Sobre | Tríade',
  },
  // ─── Login do usuário comum ──────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./paginas/login/login.component').then((m) => m.LoginComponent),
    title: 'Entrar | Tríade',
  },
  // ─── Área autenticada do usuário ─────────────────────────────────────────
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./paginas/checkout/checkout.component').then((m) => m.CheckoutComponent),
    title: 'Checkout | Tríade',
  },
  {
    path: 'meus-pedidos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./paginas/meus-pedidos/meus-pedidos.component').then((m) => m.MeusPedidosComponent),
    title: 'Meus Pedidos | Tríade',
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./paginas/perfil/perfil.component').then((m) => m.PerfilComponent),
    title: 'Meu Perfil | Tríade',
  },

  // ─── Painel administrativo (rota oculta — acessada manualmente via /painel) ─
  // Quando NÃO autenticado → exibe formulário de login
  {
    path: 'painel',
    canMatch: [naoAdminGuard],
    loadComponent: () =>
      import('./paginas/painel/login-painel/login-painel.component').then(
        (m) => m.LoginPainelComponent
      ),
    title: 'Acesso Admin | Tríade',
  },
  // Quando autenticado → exibe layout do painel com filhos
  {
    path: 'painel',
    canMatch: [adminGuard],
    loadComponent: () =>
      import('./paginas/painel/layout-painel/layout-painel.component').then(
        (m) => m.LayoutPainelComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./paginas/painel/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
        title: 'Dashboard | Painel Admin',
      },
      {
        path: 'cartas',
        loadComponent: () =>
          import('./paginas/painel/admin-cartas/admin-cartas.component').then(
            (m) => m.AdminCartasComponent
          ),
        title: 'Cartas | Painel Admin',
      },
      {
        path: 'colecoes',
        loadComponent: () =>
          import('./paginas/painel/admin-colecoes/admin-colecoes.component').then(
            (m) => m.AdminColecoesComponent
          ),
        title: 'Coleções | Painel Admin',
      },
      {
        path: 'produtos',
        loadComponent: () =>
          import('./paginas/painel/admin-produtos/admin-produtos.component').then(
            (m) => m.AdminProdutosComponent
          ),
        title: 'Produtos | Painel Admin',
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./paginas/painel/admin-pedidos/admin-pedidos.component').then(
            (m) => m.AdminPedidosComponent
          ),
        title: 'Pedidos | Painel Admin',
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./paginas/painel/admin-usuarios/admin-usuarios.component').then(
            (m) => m.AdminUsuariosComponent
          ),
        title: 'Usuários | Painel Admin',
      },
      // {
      //   path: 'sobre',
      //   loadComponent: () =>
      //     import('./paginas/painel/admin-sobre/admin-sobre.component').then(
      //       (m) => m.AdminSobreComponent
      //     ),
      //   title: 'Sobre Nós | Painel Admin',
      // },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // ─── 404 ─────────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./paginas/nao-encontrado/nao-encontrado.component').then(
        (m) => m.NaoEncontradoComponent
      ),
    title: 'Pagina nao encontrada | Tríade',
  },
];


