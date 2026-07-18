# Mixology — Back-end (Go)

API REST em Go (Gin + GORM) para o sistema de caixa e estoque da Mixology
Drinkeria. Cuida de autenticação, cadastro de produtos/insumos, receitas,
abertura/fechamento de caixa e registro de vendas — abatendo o estoque
automaticamente conforme a receita de cada drink vendido.

## Pré-requisitos

- Go (já instalado nesta máquina)
- Um banco Postgres. Duas opções:
  - **Railway** (recomendado): crie uma conta em railway.app, "New Project"
    → "Provision PostgreSQL". Copie a `DATABASE_URL` que ele gera.
  - **Local**: instale o Postgres na sua máquina e crie um banco vazio.

## Configuração

1. Copie o arquivo de exemplo de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Preencha `DATABASE_URL` com a connection string do seu Postgres e
   `JWT_SECRET` com qualquer texto longo e aleatório.

## Rodando

```bash
go run main.go
```

Na primeira execução, o Go cria automaticamente todas as tabelas no banco
(não precisa rodar nenhum SQL manualmente — isso é o `AutoMigrate` do GORM).

A API sobe em `http://localhost:8080`. Teste com:
```bash
curl http://localhost:8080/health
```

## Principais rotas

Todas as rotas abaixo (exceto `/auth/*`) exigem o header
`Authorization: Bearer <token>`, obtido no login/registro.

- `POST /api/auth/register` — cria usuário (funcionário) e retorna token
- `POST /api/auth/login` — retorna token
- `GET/POST /api/products`, `PUT/DELETE /api/products/:id`
- `GET/PUT /api/products/:id/recipe` — ficha técnica do drink
- `GET/POST /api/ingredients`, `PUT/DELETE /api/ingredients/:id`
- `GET/POST /api/stock-movements` — entradas/saídas manuais de estoque
- `POST /api/cash-registers/open`, `GET /api/cash-registers/current`,
  `POST /api/cash-registers/:id/close`
- `GET/POST /api/sales` — registrar venda (baixa o estoque automaticamente)

## Estrutura

```
main.go                    - monta rotas e sobe o servidor
internal/config             - variáveis de ambiente
internal/database           - conexão + migração automática do banco
internal/models              - tabelas (User, Product, Ingredient, Sale...)
internal/auth                - geração/validação de JWT
internal/middleware           - proteção de rotas por token/papel
internal/handlers             - lógica de cada endpoint
```
