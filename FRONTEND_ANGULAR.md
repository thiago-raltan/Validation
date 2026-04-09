# 📋 FRONTEND_ANGULAR — Documentação da API

Este documento descreve todas as rotas da API REST que o front-end Angular consome.
**URL base:** configurável em `src/environments/environment.ts` → `apiUrl`

---

## 🔐 Autenticação

Todos os endpoints protegidos exigem o header:
```
Authorization: Bearer <token>
```

| Método | Rota                    | Corpo (JSON)                              | Descrição                        |
|--------|-------------------------|-------------------------------------------|----------------------------------|
| POST   | `/auth/login`           | `{ email, senha }`                        | Login de usuário comum           |
| POST   | `/auth/registro`        | `{ nome, email, senha }`                  | Cadastro de novo usuário         |
| POST   | `/auth/logout`          | —                                         | Invalida o token                 |
| GET    | `/auth/perfil`          | —                                         | Retorna dados do usuário logado  |
| POST   | `/auth/admin/login`     | `{ usuario, senha }`                      | Login do administrador           |
| POST   | `/auth/admin/logout`    | —                                         | Logout do administrador          |

---

## 🃏 Cartas

| Método | Rota                       | Auth   | Descrição                              |
|--------|----------------------------|--------|----------------------------------------|
| GET    | `/cartas`                  | —      | Lista paginada com filtros             |
| GET    | `/cartas/:id`              | —      | Detalhe de uma carta                   |
| GET    | `/cartas/destaque`         | —      | Cartas marcadas como destaque          |
| GET    | `/cartas/tipos`            | —      | Lista de tipos disponíveis             |
| GET    | `/cartas/raridades`        | —      | Lista de raridades disponíveis         |
| POST   | `/uploads/cards`           | Admin  | Faz upload da imagem da carta          |
| POST   | `/cartas`                  | Admin  | Cadastra nova carta                    |
| PUT    | `/cartas/:id`              | Admin  | Atualiza carta                         |
| DELETE | `/cartas/:id`              | Admin  | Remove carta                           |

### Filtros disponíveis em GET `/cartas`
| Parâmetro        | Tipo    | Descrição                         |
|------------------|---------|-----------------------------------|
| `busca`          | string  | Busca por nome                    |
| `conjuntoId`     | number  | Filtrar por coleção               |
| `tipo`           | string  | Filtrar por tipo                  |
| `raridade`       | string  | Filtrar por raridade              |
| `precoMin`       | number  | Preço mínimo                      |
| `precoMax`       | number  | Preço máximo                      |
| `pagina`         | number  | Número da página (padrão: 1)      |
| `itensPorPagina` | number  | Itens por página (padrão: 20)     |

### Corpo de POST/PUT `/cartas`
```json
{
  "nome": "Charizard",
  "descricao": "Carta rara do set Base",
  "preco": 150.00,
  "raridade": "Ultra Raro",
  "tipo": "Fogo",
  "conjuntoId": 1,
  "imagemUrl": "https://...",
  "quantidadeEstoque": 10,
  "numero": "006",
  "artista": "Ken Sugimori",
  "hp": 120,
  "destaque": true
}
```

### Upload de imagem de carta

`POST /uploads/cards` deve receber `multipart/form-data` com o campo `arquivo`, salvar o arquivo em uma pasta estática do servidor como `assets/cards` e responder com a URL pública persistida.

Exemplo de resposta:

```json
{
  "url": "/assets/cards/charizard-sr-056-051.webp"
}
```

---

## 🗂️ Coleções (Conjuntos)

| Método | Rota               | Auth   | Descrição                             |
|--------|--------------------|--------|---------------------------------------|
| GET    | `/colecoes`        | —      | Lista todas as coleções               |
| GET    | `/colecoes/:id`    | —      | Detalhe de uma coleção                |
| GET    | `/colecoes/recentes?limite=4` | — | Coleções mais recentes           |
| POST   | `/colecoes`        | Admin  | Cadastra nova coleção                 |
| PUT    | `/colecoes/:id`    | Admin  | Atualiza coleção                      |
| DELETE | `/colecoes/:id`    | Admin  | Remove coleção                        |

### Corpo de POST/PUT `/colecoes`
```json
{
  "nome": "Base Set",
  "descricao": "Primeiro conjunto lançado",
  "imagemUrl": "https://...",
  "logoUrl": "https://...",
  "dataLancamento": "1999-01-09",
  "serie": "Série Base"
}
```

---

## 📦 Produtos (Pelúcia, Figuras, Box)

| Método | Rota                          | Auth   | Descrição                          |
|--------|-------------------------------|--------|------------------------------------|
| GET    | `/produtos`                   | —      | Lista produtos com filtros         |
| GET    | `/produtos/:id`               | —      | Detalhe de um produto              |
| GET    | `/produtos/categorias`        | —      | Lista de categorias disponíveis    |
| POST   | `/produtos`                   | Admin  | Cadastra novo produto              |
| PUT    | `/produtos/:id`               | Admin  | Atualiza produto                   |
| DELETE | `/produtos/:id`               | Admin  | Remove produto                     |

### Categorias de produto
- `pelucia` — Pelúcias / Plush
- `figura` — Figuras de ação / Action Figures
- `box` — Boxes / Booster Boxes / Colecionáveis
- `acessorio` — Acessórios (sleeves, deck box, etc.)

### Corpo de POST/PUT `/produtos`
```json
{
  "nome": "Pikachu Pelúcia Grande",
  "descricao": "Pelúcia oficial de 40cm",
  "preco": 89.90,
  "categoria": "pelucia",
  "imagemUrl": "https://...",
  "quantidadeEstoque": 25,
  "destaque": false
}
```

### Filtros disponíveis em GET `/produtos`
| Parâmetro        | Tipo    | Descrição                         |
|------------------|---------|-----------------------------------|
| `busca`          | string  | Busca por nome                    |
| `categoria`      | string  | Filtrar por categoria             |
| `precoMin`       | number  | Preço mínimo                      |
| `precoMax`       | number  | Preço máximo                      |
| `pagina`         | number  | Número da página                  |
| `itensPorPagina` | number  | Itens por página                  |

---

## 🛒 Pedidos

| Método | Rota                       | Auth       | Descrição                            |
|--------|----------------------------|------------|--------------------------------------|
| GET    | `/pedidos`                 | Admin      | Lista todos os pedidos               |
| GET    | `/pedidos/:id`             | Admin/User | Detalhe de um pedido                 |
| GET    | `/pedidos/meus-pedidos`    | User       | Pedidos do usuário logado            |
| POST   | `/pedidos`                 | User       | Cria novo pedido (checkout)          |
| PUT    | `/pedidos/:id/status`      | Admin      | Atualiza status do pedido            |

### Status possíveis de pedido
- `pendente` — Aguardando pagamento
- `pago` — Pagamento confirmado
- `em_separacao` — Em separação no estoque
- `enviado` — Enviado para transportadora
- `entregue` — Entregue ao cliente
- `cancelado` — Pedido cancelado

### Corpo de POST `/pedidos`
```json
{
  "itens": [
    { "cartaId": 1, "quantidade": 2 },
    { "produtoId": 5, "quantidade": 1 }
  ],
  "enderecoEntrega": {
    "cep": "01310-100",
    "logradouro": "Av. Paulista",
    "numero": "1000",
    "complemento": "Apto 12",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "uf": "SP"
  },
  "formaPagamento": "pix"
}
```

---

## 👥 Usuários

| Método | Rota               | Auth   | Descrição                         |
|--------|--------------------|--------|-----------------------------------|
| GET    | `/usuarios`        | Admin  | Lista todos os usuários           |
| GET    | `/usuarios/:id`    | Admin  | Detalhe de um usuário             |
| PUT    | `/usuarios/:id`    | Admin  | Atualiza dados de usuário         |
| DELETE | `/usuarios/:id`    | Admin  | Remove usuário                    |
| GET    | `/usuarios/perfil` | User   | Perfil do usuário logado          |
| PUT    | `/usuarios/perfil` | User   | Atualiza perfil do usuário logado |

---

## 📊 Dashboard Admin

| Método | Rota               | Auth  | Descrição                              |
|--------|--------------------|-------|----------------------------------------|
| GET    | `/admin/resumo`    | Admin | Totais: cartas, produtos, pedidos, etc |

### Resposta de GET `/admin/resumo`
```json
{
  "totalCartas": 350,
  "totalProdutos": 80,
  "totalPedidos": 1240,
  "pedidosPendentes": 12,
  "totalUsuarios": 520,
  "faturamentoMes": 15800.00
}
```

---

## ♻️ Respostas padrão

### Sucesso com paginação
```json
{
  "dados": [...],
  "total": 100,
  "pagina": 1,
  "itensPorPagina": 20,
  "totalPaginas": 5
}
```

### Erro
```json
{
  "erro": "Mensagem de erro descritiva",
  "codigo": 404
}
```
