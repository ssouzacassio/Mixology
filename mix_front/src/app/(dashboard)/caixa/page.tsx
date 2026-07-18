export default function PaginaCaixa() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Caixa</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Tela de venda (PDV). Em breve: abrir caixa (`POST /api/caixas/abrir`),
        registrar vendas em `POST /api/vendas` e baixar estoque
        automaticamente.
      </p>
    </div>
  );
}
