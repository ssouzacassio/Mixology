"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Lock, LockOpen, Plus, Trash2 } from "lucide-react";

import { apiFetch, obterUsuario } from "@/lib/api";
import type { Caixa, Mesa } from "@/lib/tipos";
import ModalVenda from "@/components/ModalVenda";

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

const LABELS_PAGAMENTO: Record<string, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão débito",
  credito: "Cartão crédito",
  pix: "Pix",
};

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarHorario(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaginaCaixa() {
  const usuarioLogado = obterUsuario();
  const ehAdmin = usuarioLogado?.papel === "admin";

  const [caixaAtual, setCaixaAtual] = useState<Caixa | null>(null);
  const [carregandoCaixa, setCarregandoCaixa] = useState(true);
  const [valorAbertura, setValorAbertura] = useState("");
  const [valorFechamento, setValorFechamento] = useState("");
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState(false);

  const [resumo, setResumo] = useState<Record<string, number>>({});
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [novaMesa, setNovaMesa] = useState("");
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);

  useEffect(() => {
    carregarCaixaAtual();
  }, []);

  useEffect(() => {
    if (caixaAtual) {
      carregarResumo(caixaAtual.id);
      carregarMesas();
    }
  }, [caixaAtual?.id]);

  async function carregarCaixaAtual() {
    setCarregandoCaixa(true);
    try {
      const dados = (await apiFetch("/api/caixas/atual")) as Caixa;
      setCaixaAtual(dados);
    } catch {
      setCaixaAtual(null);
      try {
        const ultimo = (await apiFetch("/api/caixas/ultimo-fechado")) as Caixa;
        if (ultimo.valor_fechamento !== undefined) {
          setValorAbertura(String(ultimo.valor_fechamento));
        }
      } catch {
        // nenhum caixa fechado anteriormente, sem sugestão
      }
    } finally {
      setCarregandoCaixa(false);
    }
  }

  async function carregarResumo(caixaId: string) {
    try {
      const dados = (await apiFetch(`/api/caixas/${caixaId}/resumo`)) as {
        forma_pagamento: string;
        total: number;
      }[];
      const mapa: Record<string, number> = {};
      dados.forEach((item) => (mapa[item.forma_pagamento] = item.total));
      setResumo(mapa);
    } catch {
      setResumo({});
    }
  }

  async function carregarMesas() {
    try {
      const dados = (await apiFetch("/api/mesas")) as Mesa[];
      setMesas(dados);
    } catch {
      setMesas([]);
    }
  }

  async function aoAbrirCaixa(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setProcessando(true);
    try {
      const dados = (await apiFetch("/api/caixas/abrir", {
        method: "POST",
        body: JSON.stringify({ valor_abertura: Number(valorAbertura) || 0 }),
      })) as Caixa;
      setCaixaAtual(dados);
      setValorAbertura("");
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao abrir caixa");
    } finally {
      setProcessando(false);
    }
  }

  async function aoFecharCaixa(evento: FormEvent) {
    evento.preventDefault();
    if (!caixaAtual) return;
    setErro("");
    setProcessando(true);
    try {
      await apiFetch(`/api/caixas/${caixaAtual.id}/fechar`, {
        method: "POST",
        body: JSON.stringify({ valor_fechamento: Number(valorFechamento) || 0 }),
      });
      setCaixaAtual(null);
      setValorFechamento("");
      setMesas([]);
      setResumo({});
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao fechar caixa");
    } finally {
      setProcessando(false);
    }
  }

  async function aoClicarMesa(mesa: Mesa) {
    if (mesa.status === "livre") {
      try {
        await apiFetch(`/api/mesas/${mesa.id}/ocupar`, { method: "PUT" });
        carregarMesas();
      } catch (erroCapturado) {
        setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao ocupar mesa");
      }
      return;
    }
    setMesaSelecionada(mesa);
  }

  async function aoVendaConcluida() {
    setMesaSelecionada(null);
    await carregarMesas();
    if (caixaAtual) await carregarResumo(caixaAtual.id);
  }

  async function aoCriarMesa(evento: FormEvent) {
    evento.preventDefault();
    if (!novaMesa.trim()) return;
    try {
      await apiFetch("/api/mesas", {
        method: "POST",
        body: JSON.stringify({ nome: novaMesa.trim() }),
      });
      setNovaMesa("");
      carregarMesas();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao criar mesa");
    }
  }

  async function aoExcluirMesa(mesa: Mesa) {
    try {
      await apiFetch(`/api/mesas/${mesa.id}`, { method: "DELETE" });
      carregarMesas();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao remover mesa");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Caixa</h1>

      {carregandoCaixa && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

      {!carregandoCaixa && !caixaAtual && (
        <div className="max-w-sm flex flex-col gap-4">
          <div className="rounded-lg border border-marca-azul/20 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-black/60 dark:text-white/60">
              <Lock size={16} />
              Nenhum caixa aberto no momento
            </p>
          </div>

          <form onSubmit={aoAbrirCaixa} className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="valor-abertura">
                Valor de abertura
              </label>
              <input
                id="valor-abertura"
                type="number"
                step="0.01"
                min="0"
                required
                value={valorAbertura}
                onChange={(e) => setValorAbertura(e.target.value)}
                className={CAMPO_CLASSE}
              />
              {valorAbertura && (
                <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                  Sugerido a partir do fechamento anterior — pode ajustar se precisar.
                </p>
              )}
            </div>

            {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}

            <button
              type="submit"
              disabled={processando}
              className="self-start flex items-center gap-2 rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
            >
              <LockOpen size={16} />
              {processando ? "Abrindo..." : "Abrir caixa"}
            </button>
          </form>
        </div>
      )}

      {!carregandoCaixa && caixaAtual && (
        <div className="flex flex-col gap-8">
          <div className="max-w-sm flex flex-col gap-4">
            <div className="rounded-lg border border-marca-azul/20 p-4 flex flex-col gap-1">
              <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-500">
                <LockOpen size={16} />
                Caixa aberto
                {caixaAtual.aberto_por === usuarioLogado?.id ? " por você" : ""}
              </p>
              <p className="text-sm text-black/60 dark:text-white/60">
                Aberto às {formatarHorario(caixaAtual.aberto_em)} com{" "}
                {formatarReal(caixaAtual.valor_abertura)}
              </p>
            </div>

            <form onSubmit={aoFecharCaixa} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="valor-fechamento">
                  Valor no fechamento
                </label>
                <input
                  id="valor-fechamento"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={valorFechamento}
                  onChange={(e) => setValorFechamento(e.target.value)}
                  className={CAMPO_CLASSE}
                />
              </div>

              {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}

              <button
                type="submit"
                disabled={processando}
                className="self-start flex items-center gap-2 rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
              >
                <Lock size={16} />
                {processando ? "Fechando..." : "Fechar caixa"}
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Vendas por forma de pagamento</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
              {Object.entries(LABELS_PAGAMENTO).map(([chave, label]) => (
                <div key={chave} className="rounded-lg border border-marca-azul/20 p-4">
                  <p className="text-xs text-black/60 dark:text-white/60">{label}</p>
                  <p className="text-lg font-semibold">{formatarReal(resumo[chave] || 0)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Mesas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-3xl mb-4">
              {mesas.map((mesa) => (
                <div key={mesa.id} className="relative">
                  <button
                    onClick={() => aoClicarMesa(mesa)}
                    className={`w-full rounded-lg border p-4 text-sm font-medium transition-colors ${
                      mesa.status === "livre"
                        ? "border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-500 hover:bg-green-600/20"
                        : "border-marca-vermelho/30 bg-marca-vermelho/10 text-marca-vermelho hover:bg-marca-vermelho/20"
                    }`}
                  >
                    {mesa.nome}
                    <br />
                    <span className="text-xs font-normal">
                      {mesa.status === "livre" ? "Livre" : "Ocupada"}
                    </span>
                  </button>
                  {ehAdmin && (
                    <button
                      onClick={() => aoExcluirMesa(mesa)}
                      className="absolute -top-2 -right-2 rounded-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 p-1 text-black/40 hover:text-marca-vermelho"
                      title="Remover mesa"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {mesas.length === 0 && (
              <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                Nenhuma mesa cadastrada ainda.
              </p>
            )}

            {ehAdmin && (
              <form onSubmit={aoCriarMesa} className="flex items-end gap-2 max-w-sm">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" htmlFor="nova-mesa">
                    Nova mesa
                  </label>
                  <input
                    id="nova-mesa"
                    value={novaMesa}
                    onChange={(e) => setNovaMesa(e.target.value)}
                    placeholder="Ex: Mesa 5"
                    className={CAMPO_CLASSE}
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded bg-marca-vermelho text-white font-medium px-3 py-2 text-sm hover:opacity-90"
                >
                  <Plus size={16} />
                  Criar
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {mesaSelecionada && (
        <ModalVenda
          mesa={mesaSelecionada}
          aoFechar={() => setMesaSelecionada(null)}
          aoConcluir={aoVendaConcluida}
        />
      )}
    </div>
  );
}
