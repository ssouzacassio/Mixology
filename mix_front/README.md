# Mixology — Front-end

Front-end (Next.js + TypeScript + Tailwind) do sistema de caixa e estoque
da Mixology Drinkeria. Conversa com a API em Go que está em `../mix_back`.

## Rodando localmente

1. Copie o arquivo de exemplo de variáveis de ambiente:
   ```bash
   cp .env.local.example .env.local
   ```
   Por padrão ele já aponta para `http://localhost:8080`, que é onde a API
   em Go roda localmente. Só precisa mudar se você hospedar a API em outro
   endereço.

2. Instale as dependências e suba o servidor de desenvolvimento:
   ```bash
   npm install
   npm run dev
   ```

3. Abra [http://localhost:3000](http://localhost:3000). Certifique-se de
   que a API (`mix_back`) também está rodando — veja `../mix_back/README.md`.

## Estrutura

- `src/app/(dashboard)/` — telas do sistema: `caixa`, `produtos`, `estoque`
- `public/brand/` — logo da Mixology usada na interface
