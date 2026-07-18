"use client";

import type { Mesa, Venda } from "@/lib/tipos";
import Modal from "./Modal";

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ModalComandasCaixa({
  mesa,
  comandas,
  aoFechar,
  aoEscolher,
}: {
  mesa: Mesa;
  comandas: Venda[];
  aoFechar: () => void;
  aoEscolher: (venda: Venda) => void;
}) {
  return (
    <Modal titulo={`Comandas abertas — ${mesa.nome}`} aoFechar={aoFechar}>
      <div className="flex flex-col gap-2">
        {comandas.map((comanda) => (
          <button
            key={comanda.id}
            onClick={() => aoEscolher(comanda)}
            className="w-full flex items-center justify-between gap-3 rounded border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:border-marca-vermelho/40 hover:shadow-sm transition-all"
          >
            <span className="font-medium">
              {comanda.nome_comanda || "Comanda sem nome"}
            </span>
            <span className="text-black/60 dark:text-white/60">
              {formatarReal(comanda.total)}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
