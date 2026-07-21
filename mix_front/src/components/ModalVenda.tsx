"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";

import { apiFetch } from "@/lib/api";
import type { Mesa, Produto, Venda } from "@/lib/tipos";
import Modal from "./Modal";

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type ItemCarrinho = {
  chave: string;
  produtoId: string;
  produtoNome: string;
  precoUnitario: number;
  quantidade: number;
  opcoesIds: string[];
  opcoesLabel: string;
};

export default function ModalVenda({
  mesa,
  vendaId,
  aoFechar,
  aoConcluir,
}: {
  mesa: Mesa;
  vendaId: string | null;
  aoFechar: () => void;
  aoConcluir: () => void;
}) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [produtoConfigurando, setProdutoConfigurando] = useState<string | null>(null);
  const [escolhas, setEscolhas] = useState<Record<string, string>>({});
  const [nomeComanda, setNomeComanda] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const dadosProdutos = (await apiFetch("/api/produtos")) as Produto[];
        setProdutos(dadosProdutos.filter((p) => p.ativo));

        if (vendaId) {
          const dadosVendas = (await apiFetch("/api/vendas")) as Venda[];
          const comandaAtual = dadosVendas.find((v) => v.id === vendaId);
          if (comandaAtual?.nome_comanda) {
            setNomeComanda(comandaAtual.nome_comanda);
          }
        }
      } catch (erroCapturado) {
        setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao carregar produtos");
      } finally {
        setCarregando(false);
      }
    })();
  }, [mesa.id, vendaId]);

  function definirQuantidade(produtoId: string, quantidade: number) {
    setQuantidades((atual) => ({ ...atual, [produtoId]: Math.max(0, quantidade) }));
  }

  const produtosSimples = produtos.filter((p) => !(p.grupos_opcao && p.grupos_opcao.length > 0));
  const produtosComOpcoes = produtos.filter((p) => p.grupos_opcao && p.grupos_opcao.length > 0);

  const itensSelecionados = produtosSimples
    .map((p) => ({ produto: p, quantidade: quantidades[p.id] || 0 }))
    .filter((item) => item.quantidade > 0);

  function abrirConfiguracao(produto: Produto) {
    setProdutoConfigurando(produto.id);
    setEscolhas({});
  }

  function escolherOpcao(grupoId: string, opcaoId: string) {
    setEscolhas((atual) => ({ ...atual, [grupoId]: opcaoId }));
  }

  function adicionarAoCarrinho(produto: Produto) {
    const grupos = produto.grupos_opcao || [];
    const faltando = grupos.some((v) => !escolhas[v.grupo_opcao_id]);
    if (faltando) {
      setErro("Escolha uma opção em cada grupo antes de adicionar.");
      return;
    }
    setErro("");

    const opcoesIds: string[] = [];
    const labelPartes: string[] = [];
    for (const vinculo of grupos) {
      const grupoOpcao = vinculo.grupo_opcao;
      const opcaoId = escolhas[vinculo.grupo_opcao_id];
      const opcao = grupoOpcao?.opcoes.find((o) => o.id === opcaoId);
      if (opcaoId) opcoesIds.push(opcaoId);
      if (opcao) labelPartes.push(opcao.nome);
    }

    setCarrinho((atual) => [
      ...atual,
      {
        chave: `${produto.id}-${Date.now()}`,
        produtoId: produto.id,
        produtoNome: produto.nome,
        precoUnitario: produto.preco,
        quantidade: 1,
        opcoesIds,
        opcoesLabel: labelPartes.join(", "),
      },
    ]);
    setProdutoConfigurando(null);
    setEscolhas({});
  }

  function removerDoCarrinho(chave: string) {
    setCarrinho((atual) => atual.filter((item) => item.chave !== chave));
  }

  function alterarQuantidadeCarrinho(chave: string, quantidade: number) {
    setCarrinho((atual) =>
      atual.map((item) => (item.chave === chave ? { ...item, quantidade: Math.max(1, quantidade) } : item))
    );
  }

  const totalSimples = itensSelecionados.reduce(
    (soma, item) => soma + item.produto.preco * item.quantidade,
    0
  );
  const totalCarrinho = carrinho.reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0);
  const total = totalSimples + totalCarrinho;

  async function aoConfirmar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    if (itensSelecionados.length === 0 && carrinho.length === 0) {
      setErro("Escolha pelo menos um item.");
      return;
    }
    setEnviando(true);
    try {
      await apiFetch("/api/vendas", {
        method: "POST",
        body: JSON.stringify({
          mesa_id: mesa.id,
          venda_id: vendaId ?? undefined,
          nome_comanda: nomeComanda.trim(),
          itens: [
            ...itensSelecionados.map((item) => ({
              produto_id: item.produto.id,
              quantidade: item.quantidade,
            })),
            ...carrinho.map((item) => ({
              produto_id: item.produtoId,
              quantidade: item.quantidade,
              opcoes_ids: item.opcoesIds,
            })),
          ],
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
    <Modal
      titulo={`${vendaId ? "Lançar pedido" : "Nova comanda"} — ${mesa.nome}`}
      aoFechar={aoFechar}
    >
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

          {produtosSimples.length > 0 && (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {produtosSimples.map((produto) => (
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
          )}

          {produtosComOpcoes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-black/60 dark:text-white/60 uppercase tracking-wide">
                Com opções
              </p>
              {produtosComOpcoes.map((produto) => (
                <div key={produto.id} className="border border-black/10 dark:border-white/10 rounded p-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{produto.nome}</p>
                      <p className="text-xs text-black/60 dark:text-white/60">
                        {formatarReal(produto.preco)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => abrirConfiguracao(produto)}
                      className="flex items-center gap-1 rounded bg-marca-azul text-white text-xs font-medium px-2 py-1 hover:opacity-90"
                    >
                      <Plus size={12} />
                      Adicionar
                    </button>
                  </div>

                  {produtoConfigurando === produto.id && (
                    <div className="mt-2 flex flex-col gap-2 bg-black/[0.02] dark:bg-white/[0.03] rounded p-2">
                      {(produto.grupos_opcao || []).map((vinculo) => (
                        <div key={vinculo.grupo_opcao_id}>
                          <p className="text-xs font-medium mb-1">{vinculo.grupo_opcao?.nome}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(vinculo.grupo_opcao?.opcoes || []).map((opcao) => (
                              <button
                                type="button"
                                key={opcao.id}
                                onClick={() => escolherOpcao(vinculo.grupo_opcao_id, opcao.id)}
                                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                  escolhas[vinculo.grupo_opcao_id] === opcao.id
                                    ? "bg-marca-vermelho text-white border-marca-vermelho"
                                    : "border-black/15 dark:border-white/15 text-black/70 dark:text-white/70 hover:border-marca-vermelho/50"
                                }`}
                              >
                                {opcao.nome}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => adicionarAoCarrinho(produto)}
                        className="self-start rounded bg-marca-vermelho text-white text-xs font-medium px-3 py-1.5 hover:opacity-90"
                      >
                        Adicionar ao pedido
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {carrinho.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-black/60 dark:text-white/60 uppercase tracking-wide">
                Itens deste pedido
              </p>
              {carrinho.map((item) => (
                <div
                  key={item.chave}
                  className="flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-1.5"
                >
                  <div className="text-sm">
                    <span className="font-medium">{item.produtoNome}</span>
                    {item.opcoesLabel && (
                      <span className="text-black/60 dark:text-white/60"> ({item.opcoesLabel})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => alterarQuantidadeCarrinho(item.chave, Number(e.target.value))}
                      className="w-14 rounded border border-black/15 dark:border-white/15 px-1.5 py-0.5 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul"
                    />
                    <button
                      type="button"
                      onClick={() => removerDoCarrinho(item.chave)}
                      className="text-black/40 dark:text-white/40 hover:text-marca-vermelho"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

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
