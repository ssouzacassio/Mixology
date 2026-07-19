"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { apiFetch, obterUsuario } from "@/lib/api";
import type { Boleto } from "@/lib/tipos";

const CATEGORIAS = ["Aluguel", "Fornecedor", "Salário", "Imposto", "Serviço", "Outro"];

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function paraCampoData(iso: string) {
  return iso.slice(0, 10);
}

export default function PaginaBoletos() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const usuarioLogado = obterUsuario();
    if (usuarioLogado?.papel !== "admin" && usuarioLogado?.papel !== "gerente") {
      router.replace("/");
      return;
    }
    setAutorizado(true);
    carregarBoletos();
  }, [router]);

  async function carregarBoletos() {
    setCarregando(true);
    setErro("");
    try {
      const dados = (await apiFetch("/api/boletos")) as Boleto[];
      setBoletos(dados);
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao carregar boletos");
    } finally {
      setCarregando(false);
    }
  }

  function limparFormulario() {
    setEditandoId(null);
    setDescricao("");
    setCategoria(CATEGORIAS[0]);
    setValor("");
    setVencimento("");
  }

  function iniciarEdicao(boleto: Boleto) {
    setEditandoId(boleto.id);
    setDescricao(boleto.descricao);
    setCategoria(boleto.categoria || CATEGORIAS[0]);
    setValor(String(boleto.valor));
    setVencimento(paraCampoData(boleto.vencimento));
  }

  async function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const corpo = JSON.stringify({
        descricao,
        categoria,
        valor: Number(valor),
        vencimento: new Date(`${vencimento}T00:00:00Z`).toISOString(),
      });
      if (editandoId) {
        await apiFetch(`/api/boletos/${editandoId}`, { method: "PUT", body: corpo });
      } else {
        await apiFetch("/api/boletos", { method: "POST", body: corpo });
      }
      limparFormulario();
      await carregarBoletos();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao salvar boleto");
    } finally {
      setSalvando(false);
    }
  }

  async function aoMarcarPago(boleto: Boleto) {
    try {
      await apiFetch(`/api/boletos/${boleto.id}/pagar`, { method: "PUT" });
      await carregarBoletos();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao marcar como pago");
    }
  }

  async function aoReabrir(boleto: Boleto) {
    try {
      await apiFetch(`/api/boletos/${boleto.id}/reabrir`, { method: "PUT" });
      await carregarBoletos();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao reabrir boleto");
    }
  }

  async function aoExcluir(boleto: Boleto) {
    try {
      await apiFetch(`/api/boletos/${boleto.id}`, { method: "DELETE" });
      if (editandoId === boleto.id) limparFormulario();
      await carregarBoletos();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao remover boleto");
    }
  }

  if (!autorizado) {
    return null;
  }

  const pendentes = boletos.filter((b) => b.status !== "pago");
  const pagos = boletos.filter((b) => b.status === "pago");
  const totalPendente = pendentes.reduce((soma, b) => soma + b.valor, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold mb-1">Boletos a pagar</h1>
        <p className="text-sm text-black/60 dark:text-white/60 mb-4">
          Total pendente: <span className="font-semibold">{formatarReal(totalPendente)}</span>
        </p>

        {erro && <p className="text-sm text-marca-vermelho mb-3">{erro}</p>}
        {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

        {!carregando && boletos.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">Nenhum boleto cadastrado ainda.</p>
        )}

        {!carregando && pendentes.length > 0 && (
          <div className="overflow-x-auto max-w-3xl mb-6">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="text-left border-b border-black/10 dark:border-white/10">
                  <th className="py-2 pr-4">Descrição</th>
                  <th className="py-2 pr-4">Categoria</th>
                  <th className="py-2 pr-4">Vencimento</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Valor</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {pendentes.map((b) => (
                  <tr
                    key={b.id}
                    className={`border-b border-black/5 dark:border-white/5 ${
                      b.status === "vencido" ? "bg-marca-vermelho/5" : ""
                    }`}
                  >
                    <td className="py-2 pr-4">{b.descricao}</td>
                    <td className="py-2 pr-4">{b.categoria || "—"}</td>
                    <td className="py-2 pr-4">{formatarData(b.vencimento)}</td>
                    <td className="py-2 pr-4">
                      {b.status === "vencido" ? (
                        <span className="font-semibold text-marca-vermelho">Vencido</span>
                      ) : (
                        <span className="text-black/60 dark:text-white/60">A vencer</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{formatarReal(b.valor)}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => aoMarcarPago(b)}
                          className="flex items-center gap-1 text-green-700 dark:text-green-500 hover:opacity-80"
                          title="Marcar como pago"
                        >
                          <Check size={14} />
                          Pago
                        </button>
                        <button
                          onClick={() => iniciarEdicao(b)}
                          className="text-marca-azul hover:text-marca-vermelho"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => aoExcluir(b)}
                          className="text-black/40 dark:text-white/40 hover:text-marca-vermelho"
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && pagos.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-black/60 dark:text-white/60 mb-2">Pagos</h2>
            <div className="overflow-x-auto max-w-3xl">
              <table className="w-full text-sm border-collapse min-w-[560px]">
                <tbody>
                  {pagos.map((b) => (
                    <tr key={b.id} className="border-b border-black/5 dark:border-white/5 opacity-60">
                      <td className="py-2 pr-4">{b.descricao}</td>
                      <td className="py-2 pr-4">{b.categoria || "—"}</td>
                      <td className="py-2 pr-4">{formatarReal(b.valor)}</td>
                      <td className="py-2 pr-4">
                        Pago {b.pago_em ? formatarData(b.pago_em) : ""}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => aoReabrir(b)}
                            className="flex items-center gap-1 text-marca-azul hover:text-marca-vermelho"
                            title="Reabrir (marcar como pendente)"
                          >
                            <RotateCcw size={14} />
                            Reabrir
                          </button>
                          <button
                            onClick={() => aoExcluir(b)}
                            className="text-black/40 dark:text-white/40 hover:text-marca-vermelho"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-sm">
        <h2 className="text-lg font-semibold mb-3">
          {editandoId ? "Editar boleto" : "Novo boleto"}
        </h2>
        <form onSubmit={aoSalvar} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="boleto-descricao">
              Descrição
            </label>
            <input
              id="boleto-descricao"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Aluguel julho"
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="boleto-categoria">
              Categoria
            </label>
            <select
              id="boleto-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={CAMPO_CLASSE}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="boleto-valor">
              Valor
            </label>
            <input
              id="boleto-valor"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="boleto-vencimento">
              Vencimento
            </label>
            <input
              id="boleto-vencimento"
              type="date"
              required
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className={CAMPO_CLASSE}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar boleto"}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={limparFormulario}
                className="text-sm text-black/60 dark:text-white/60 hover:underline"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
