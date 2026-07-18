# Mixology — Backend (Go)

API REST em Go (Gin + GORM) para o sistema de caixa e estoque da Mixology
Drinkeria. Cuida de autenticação, cadastro de produtos/insumos, receitas,
abertura/fechamento de caixa e registro de vendas — abatendo o estoque
automaticamente conforme a receita de cada drink vendido.

## Pré-requisitos

- Go (já instalado nesta máquina)
- Um banco Postgres. Duas opções:
  - **Railway** (recomendado para produção): crie uma conta em
    railway.app, "New Project" → "Provision PostgreSQL". Copie a URL de
    conexão que ele gera.
  - **Local**: já está instalado nesta máquina (usado no desenvolvimento).

## Configuração

1. Copie o arquivo de exemplo de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Preencha `URL_BANCO_DADOS` com a connection string do seu Postgres e
   `SEGREDO_JWT` com qualquer texto longo e aleatório.

## Rodando

```bash
go run main.go
```

Na primeira execução, o Go cria automaticamente todas as tabelas no banco
(não precisa rodar nenhum SQL manualmente — isso é o `AutoMigrate` do GORM).

A API sobe em `http://localhost:8080`. Teste com:
```bash
curl http://localhost:8080/saude
```

## Principais rotas

Todas as rotas abaixo (exceto `/autenticacao/*`) exigem o cabeçalho
`Authorization: Bearer <token>`, obtido no login/registro.

- `POST /api/autenticacao/registrar` — cria usuário (funcionário) e retorna token
- `POST /api/autenticacao/entrar` — retorna token
- `GET/POST /api/produtos`, `PUT/DELETE /api/produtos/:id`
- `GET/PUT /api/produtos/:id/receita` — ficha técnica do drink
- `GET/POST /api/insumos`, `PUT/DELETE /api/insumos/:id`
- `GET/POST /api/movimentos-estoque` — entradas/saídas manuais de estoque
- `POST /api/caixas/abrir`, `GET /api/caixas/atual`,
  `POST /api/caixas/:id/fechar`
- `GET/POST /api/vendas` — registrar venda (baixa o estoque automaticamente)

## Estrutura

```
main.go                        - monta rotas e sobe o servidor
internal/configuracao           - variáveis de ambiente
internal/banco                  - conexão + migração automática do banco
internal/modelos                 - tabelas (Usuario, Produto, Insumo, Venda...)
internal/autenticacao             - geração/validação de token (JWT)
internal/protecao                  - proteção de rotas por token/papel
internal/manipuladores              - lógica de cada endpoint
```
