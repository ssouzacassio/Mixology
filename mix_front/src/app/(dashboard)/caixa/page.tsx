"use client";

import { useEffect, useState } from "react";
import { Lock, LockOpen } from "lucide-react";

import { apiFetch } from "@/lib/api";
import type { Caixa, Mesa, Venda } from "@/lib/tipos";
import { ROTULO_STATUS_MESA } from "@/lib/mesaStatus";
import Modal from "@/components/Modal";
import ModalFecharConta from "@/components/ModalFecharConta";

const LABELS_PAGAMENTO: Record<string, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão débito",
  credito: "Cartão crédito",
  pix: "Pix",
};

const CLASSES_STATUS_MESA: Record<string, string> = {
  livre: "border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-500",
  ocupada: "border-amber-600/30 bg-amber-600/10 text-amber-700 dark:text-amber-500",
  consumacao:
    "border-marca-vermelho/30 bg-marca-vermelho/10 text-marca-vermelho hover:bg-marca-vermelho/20 cursor-pointer",
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
  const [caixaAtual, setCaixaAtual] = useState<Caixa | null>(null);
  const [carregandoCaixa, setCarregandoCaixa] = useState(true);
  const [confirmandoFechamento, setConfirmandoFechamento] = useState(false);
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState(false);
  const [resumo, setResumo] = useState<Record<string, number>>({});
  const [contasAbertas, setContasAbertas] = useState<Venda[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<Venda | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);

  useEffect(() => {
    carregarCaixaAtual();
  }, []);

  useEffect(() => {
    if (caixaAtual) {
      carregarResumo(caixaAtual.id);
      carregarContasAbertas();
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

  async function carregarContasAbertas() {
    try {
      const dados = (await apiFetch("/api/vendas")) as Venda[];
      setContasAbertas(dados.filter((v) => v.status === "aberta"));
    } catch {
      setContasAbertas([]);
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

  async function aoFecharConta() {
    setContaSelecionada(null);
    await carregarContasAbertas();
    await carregarMesas();
    if (caixaAtual) await carregarResumo(caixaAtual.id);
  }

  function aoClicarMesa(mesa: Mesa) {
    if (mesa.status !== "consumacao") return;
    const conta = contasAbertas.find((v) => v.mesa_id === mesa.id);
    if (conta) setContaSelecionada(conta);
  }

  async function aoAbrirCaixa() {
    setErro("");
    setProcessando(true);
    try {
      const dados = (await apiFetch("/api/caixas/abrir", {
        method: "POST",
        body: JSON.stringify({}),
      })) as Caixa;
      setCaixaAtual(dados);
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao abrir caixa");
    } finally {
      setProcessando(false);
    }
  }

  async function aoConfirmarFechamento() {
    if (!caixaAtual) return;
    setErro("");
    setProcessando(true);
    try {
      await apiFetch(`/api/caixas/${caixaAtual.id}/fechar`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setCaixaAtual(null);
      setResumo({});
      setContasAbertas([]);
      setMesas([]);
      setConfirmandoFechamento(false);
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao fechar caixa");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-xl font-semibold">Caixa</h1>

        {!carregandoCaixa && !caixaAtual && (
          <button
            onClick={aoAbrirCaixa}
            disabled={processando}
            className="flex items-center gap-2 rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
          >
            <LockOpen size={16} />
            {processando ? "Abrindo..." : "Abrir caixa"}
          </button>
        )}

        {!carregandoCaixa && caixaAtual && (
          <div className="flex items-center gap-3 rounded-full border border-green-600/30 bg-green-600/10 pl-4 pr-2 py-1.5">
            <span className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-500">
              <LockOpen size={14} />
              Aberto por {caixaAtual.aberto_por_nome} · {formatarHorario(caixaAtual.aberto_em)}
            </span>
            <button
              onClick={() => setConfirmandoFechamento(true)}
              className="flex items-center gap-1 rounded-full bg-marca-vermelho text-white font-medium px-3 py-1 text-xs hover:opacity-90"
            >
              <Lock size={12} />
              Encerrar
            </button>
          </div>
        )}
      </div>

      {erro && <p className="text-sm text-marca-vermelho mb-4">{erro}</p>}

      {carregandoCaixa && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

      {!carregandoCaixa && !caixaAtual && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Nenhum caixa aberto no momento. Abra o caixa pra começar a vender.
        </p>
      )}

      {!carregandoCaixa && caixaAtual && (
        <div className="flex flex-col gap-8">
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
            <p className="text-xs text-black/50 dark:text-white/50 mb-3">
              Só é possível fechar mesas em consumação — abrir e lançar pedidos é feito em Atendimento.
            </p>
            {mesas.length === 0 && (
              <p className="text-sm text-black/60 dark:text-white/60">
                Nenhuma mesa cadastrada ainda.
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-3xl">
              {mesas.map((mesa) => {
                const conta =
                  mesa.status === "consumacao"
                    ? contasAbertas.find((v) => v.mesa_id === mesa.id)
                    : undefined;
                return (
                  <button
                    key={mesa.id}
                    onClick={() => aoClicarMesa(mesa)}
                    disabled={mesa.status !== "consumacao"}
                    className={`w-full rounded-lg border p-4 text-sm font-medium transition-colors disabled:cursor-default ${
                      CLASSES_STATUS_MESA[mesa.status] ?? CLASSES_STATUS_MESA.ocupada
                    }`}
                  >
                    {mesa.nome}
                    <br />
                    <span className="text-xs font-normal">
                      {ROTULO_STATUS_MESA[mesa.status] ?? mesa.status}
                    </span>
                    {conta && (
                      <>
                        <br />
                        <span className="text-xs font-semibold">{formatarReal(conta.total)}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {confirmandoFechamento && caixaAtual && (
        <Modal titulo="Encerrar caixa" aoFechar={() => setConfirmandoFechamento(false)}>
          <p className="text-sm text-black/70 dark:text-white/70 mb-4">
            Encerrar o caixa aberto por {caixaAtual.aberto_por_nome} às{" "}
            {formatarHorario(caixaAtual.aberto_em)}?
          </p>
          <div className="flex gap-3">
            <button
              onClick={aoConfirmarFechamento}
              disabled={processando}
              className="flex items-center gap-2 rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
            >
              <Lock size={16} />
              {processando ? "Encerrando..." : "Confirmar encerramento"}
            </button>
            <button
              onClick={() => setConfirmandoFechamento(false)}
              className="text-sm text-black/60 dark:text-white/60 hover:underline"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {contaSelecionada && (
        <ModalFecharConta
          venda={contaSelecionada}
          aoFechar={() => setContaSelecionada(null)}
          aoConcluir={aoFecharConta}
        />
      )}
    </div>
  );
}
