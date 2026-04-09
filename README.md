# 🃏 Cartas Vegeta — Front-end Angular

Front-end em **Angular 17** para a loja de cartas colecionáveis **Cartas Vegeta**.
Inspirado no layout do [pokemontcgjapan.com](https://pokemontcgjapan.com), com toda a interface em **português**.

---

## 🚀 Como rodar o projeto

```bash
# Entrar na pasta do projeto Angular
cd cards-front

# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm start
# Acesse: http://localhost:4200

# Gerar build de produção
npm run build
```

---

## 📂 Estrutura do Projeto

```
cards-front/src/app/
├── core/
│   ├── modelos/          # Interfaces TypeScript (Carta, Coleção, Carrinho)
│   └── servicos/         # Serviços que consomem a API (CartaService, ColecaoService, CarrinhoService)
├── compartilhado/
│   └── componentes/
│       ├── cabecalho/    # Header com navegação e badge do carrinho
│       ├── rodape/       # Footer com links e informações
│       └── card-carta/   # Componente reutilizável de exibição de carta
└── paginas/
    ├── inicio/           # Página inicial com banner e destaques
    ├── catalogo/         # Catálogo de cartas com filtros e paginação
    ├── detalhe-carta/    # Página de detalhe de uma carta
    ├── carrinho/         # Carrinho de compras (persistido no localStorage)
    ├── sobre/            # Página "Sobre nós"
    └── nao-encontrado/   # Página 404
```

---

## ⚙️ Configuração da API

Edite o arquivo `src/environments/environment.ts` para apontar para a sua API:

```typescript
export const environment = {
  producao: false,
  apiUrl: 'http://localhost:3000/api', // URL da sua API aqui
};
```

### Rotas esperadas da API

| Método | Rota                         | Descrição                        |
|--------|------------------------------|----------------------------------|
| GET    | `/api/cartas`                | Lista paginada com filtros       |
| GET    | `/api/cartas/:id`            | Detalhe de uma carta             |
| GET    | `/api/cartas/destaque`       | Cartas em destaque               |
| GET    | `/api/cartas/tipos`          | Lista de tipos disponíveis       |
| GET    | `/api/cartas/raridades`      | Lista de raridades               |
| GET    | `/api/colecoes`              | Lista de coleções                |
| GET    | `/api/colecoes/:id`          | Detalhe de uma coleção           |
| GET    | `/api/colecoes/recentes`     | Coleções mais recentes           |

---

## 🎨 Tecnologias

- **Angular 17** (Standalone Components, Signals, Lazy Loading)
- **TypeScript** com tipagem rigorosa
- **SCSS** com BEM methodology
- **Angular Router** com View Transitions
- **HttpClient** para consumo da API REST
- **Reactive Forms** nos filtros do catálogo
- **localStorage** para persistência do carrinho
