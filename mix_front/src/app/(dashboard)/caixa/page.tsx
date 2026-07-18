"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Lock, LockOpen } from "lucide-react";

import { apiFetch, obterUsuario } from "@/lib/api";

type Caixa = {
  id: string;
  aberto_por: string;
  valor_abertura: number;
  status: string;
  aberto_em: string;
};

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

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
  const [carregando, setCarregando] = useState(true);
  const [valorAbertura, setValorAbertura] = useState("");
  const [valorFechamento, setValorFechamento] = useState("");
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregarCaixaAtual();
  }, []);

  async function carregarCaixaAtual() {
    setCarregando(true);
    try {
      const dados = (await apiFetch("/api/caixas/atual")) as Caixa;
      setCaixaAtual(dados);
    } catch {
      setCaixaAtual(null);
    } finally {
      setCarregando(false);
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
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao fechar caixa");
    } finally {
      setProcessando(false);
    }
  }

  const usuarioLogado = obterUsuario();

  return (
    <div className="max-w-sm">
      <h1 className="text-xl font-semibold mb-4">Caixa</h1>

      {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

      {!carregando && caixaAtual && (
        <div className="flex flex-col gap-4">
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
      )}

      {!carregando && !caixaAtual && (
        <div className="flex flex-col gap-4">
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
    </div>
  );
}
