"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { apiFetch } from "@/lib/api";
import type { Mesa, Venda } from "@/lib/tipos";
import Modal from "./Modal";

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ModalComandasMesa({
  mesa,
  aoFechar,
  aoEscolher,
}: {
  mesa: Mesa;
  aoFechar: () => void;
  aoEscolher: (vendaId: string | null) => void;
}) {
  const [comandas, setComandas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const dados = (await apiFetch("/api/vendas")) as Venda[];
        setComandas(dados.filter((v) => v.status === "aberta" && v.mesa_id === mesa.id));
      } catch (erroCapturado) {
        setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao carregar comandas");
      } finally {
        setCarregando(false);
      }
    })();
  }, [mesa.id]);

  return (
    <Modal titulo={`Comandas — ${mesa.nome}`} aoFechar={aoFechar}>
      {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

      {erro && <p className="text-sm text-marca-vermelho mb-3">{erro}</p>}

      {!carregando && (
        <div className="flex flex-col gap-2">
          {comandas.map((comanda) => (
            <button
              key={comanda.id}
              onClick={() => aoEscolher(comanda.id)}
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

          {comandas.length === 0 && (
            <p className="text-sm text-black/60 dark:text-white/60">
              Nenhuma comanda aberta nessa mesa ainda.
            </p>
          )}

          <button
            onClick={() => aoEscolher(null)}
            className="flex items-center justify-center gap-1 rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 mt-2"
          >
            <Plus size={16} />
            Nova comanda
          </button>
        </div>
      )}
    </Modal>
  );
}
