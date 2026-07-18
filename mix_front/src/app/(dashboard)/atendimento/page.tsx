"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { apiFetch, obterUsuario } from "@/lib/api";
import type { Caixa, Mesa } from "@/lib/tipos";
import ModalVenda from "@/components/ModalVenda";

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

export default function PaginaAtendimento() {
  const usuarioLogado = obterUsuario();
  const ehAdmin = usuarioLogado?.papel === "admin";

  const [caixaAtual, setCaixaAtual] = useState<Caixa | null>(null);
  const [carregandoCaixa, setCarregandoCaixa] = useState(true);

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [novaMesa, setNovaMesa] = useState("");
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const dados = (await apiFetch("/api/caixas/atual")) as Caixa;
        setCaixaAtual(dados);
      } catch {
        setCaixaAtual(null);
      } finally {
        setCarregandoCaixa(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (caixaAtual) {
      carregarMesas();
    }
  }, [caixaAtual?.id]);

  async function carregarMesas() {
    try {
      const dados = (await apiFetch("/api/mesas")) as Mesa[];
      setMesas(dados);
    } catch {
      setMesas([]);
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
  }

  async function aoCriarMesa(evento: React.FormEvent) {
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
      <h1 className="text-xl font-semibold mb-4">Atendimento</h1>

      {carregandoCaixa && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

      {!carregandoCaixa && !caixaAtual && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Nenhum caixa aberto no momento.{" "}
          <Link href="/caixa" className="text-marca-vermelho hover:underline">
            Abra o caixa
          </Link>{" "}
          pra começar a atender.
        </p>
      )}

      {!carregandoCaixa && caixaAtual && (
        <div>
          {erro && <p className="text-sm text-marca-vermelho mb-4">{erro}</p>}

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
