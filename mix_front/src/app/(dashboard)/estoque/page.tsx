export default function PaginaEstoque() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Estoque</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Insumos e níveis de estoque. Em breve: listar `GET /api/insumos`,
        registrar entradas/saídas em `POST /api/movimentos-estoque`.
      </p>
    </div>
  );
}
