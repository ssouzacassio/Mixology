"use client";

import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/api";
import type { Mesa, Produto, Venda } from "@/lib/tipos";
import Modal from "./Modal";

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ModalVenda({
  mesa,
  aoFechar,
  aoConcluir,
}: {
  mesa: Mesa;
  aoFechar: () => void;
  aoConcluir: () => void;
}) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [nomeComanda, setNomeComanda] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const dadosProdutos = (await apiFetch("/api/produtos")) as Produto[];
        setProdutos(dadosProdutos.filter((p) => p.ativo));

        const dadosVendas = (await apiFetch("/api/vendas")) as Venda[];
        const comandaAtual = dadosVendas.find(
          (v) => v.status === "aberta" && v.mesa_id === mesa.id
        );
        if (comandaAtual?.nome_comanda) {
          setNomeComanda(comandaAtual.nome_comanda);
        }
      } catch (erroCapturado) {
        setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao carregar produtos");
      } finally {
        setCarregando(false);
      }
    })();
  }, [mesa.id]);

  function definirQuantidade(produtoId: string, quantidade: number) {
    setQuantidades((atual) => ({ ...atual, [produtoId]: Math.max(0, quantidade) }));
  }

  const itensSelecionados = produtos
    .map((p) => ({ produto: p, quantidade: quantidades[p.id] || 0 }))
    .filter((item) => item.quantidade > 0);

  const total = itensSelecionados.reduce(
    (soma, item) => soma + item.produto.preco * item.quantidade,
    0
  );

  async function aoConfirmar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    if (itensSelecionados.length === 0) {
      setErro("Escolha pelo menos um item.");
      return;
    }
    setEnviando(true);
    try {
      await apiFetch("/api/vendas", {
        method: "POST",
        body: JSON.stringify({
          mesa_id: mesa.id,
          nome_comanda: nomeComanda.trim(),
          itens: itensSelecionados.map((item) => ({
            produto_id: item.produto.id,
            quantidade: item.quantidade,
          })),
        }),
      });
      aoConcluir();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao lançar pedido");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Lançar pedido — ${mesa.nome}`} aoFechar={aoFechar}>
      {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando produtos...</p>}

      {!carregando && produtos.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Nenhum produto cadastrado ainda. Cadastre drinks na tela de Produtos antes de vender.
        </p>
      )}

      {!carregando && produtos.length > 0 && (
        <form onSubmit={aoConfirmar} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nome-comanda">
              Nome da comanda (opcional)
            </label>
            <input
              id="nome-comanda"
              value={nomeComanda}
              onChange={(e) => setNomeComanda(e.target.value)}
              placeholder="Ex: nome do cliente"
              className="w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className="flex items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-2"
              >
                <div>
                  <p className="text-sm font-medium">{produto.nome}</p>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    {formatarReal(produto.preco)}
                  </p>
                </div>
                <input
                  type="number"
                  min="0"
                  value={quantidades[produto.id] || ""}
                  onChange={(e) => definirQuantidade(produto.id, Number(e.target.value))}
                  className="w-20 rounded border border-black/15 dark:border-white/15 px-2 py-1 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul"
                />
              </div>
            ))}
          </div>

          <p className="text-lg font-semibold">Total deste pedido: {formatarReal(total)}</p>

          {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
          >
            {enviando ? "Lançando..." : "Lançar pedido"}
          </button>
        </form>
      )}
    </Modal>
  );
}
