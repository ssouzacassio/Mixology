"use client";

import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/api";
import type { Produto, Venda } from "@/lib/tipos";
import Modal from "./Modal";

const FORMAS_PAGAMENTO = [
  { valor: "dinheiro", label: "Dinheiro" },
  { valor: "debito", label: "Cartão débito" },
  { valor: "credito", label: "Cartão crédito" },
  { valor: "pix", label: "Pix" },
];

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ModalFecharConta({
  venda,
  aoFechar,
  aoConcluir,
}: {
  venda: Venda;
  aoFechar: () => void;
  aoConcluir: () => void;
}) {
  const [nomesProdutos, setNomesProdutos] = useState<Record<string, string>>({});
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const dados = (await apiFetch("/api/produtos")) as Produto[];
        const mapa: Record<string, string> = {};
        dados.forEach((p) => (mapa[p.id] = p.nome));
        setNomesProdutos(mapa);
      } catch {
        setNomesProdutos({});
      }
    })();
  }, []);

  async function aoConfirmar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await apiFetch(`/api/vendas/${venda.id}/fechar`, {
        method: "PUT",
        body: JSON.stringify({ forma_pagamento: formaPagamento }),
      });
      aoConcluir();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao fechar conta");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={`Fechar conta — ${venda.mesa?.nome ?? "Mesa"}${
        venda.nome_comanda ? ` (${venda.nome_comanda})` : ""
      }`}
      aoFechar={aoFechar}
    >
      <div className="flex flex-col gap-1 mb-4 max-h-48 overflow-y-auto">
        {venda.itens.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.quantidade}x {nomesProdutos[item.produto_id] ?? "Produto"}
            </span>
            <span>{formatarReal(item.quantidade * item.preco_unitario)}</span>
          </div>
        ))}
      </div>

      <p className="text-lg font-semibold mb-4">Total: {formatarReal(venda.total)}</p>

      <form onSubmit={aoConfirmar} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="forma-pagamento-fechar">
            Forma de pagamento
          </label>
          <select
            id="forma-pagamento-fechar"
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            className={CAMPO_CLASSE}
          >
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? "Fechando..." : "Confirmar pagamento"}
        </button>
      </form>
    </Modal>
  );
}
