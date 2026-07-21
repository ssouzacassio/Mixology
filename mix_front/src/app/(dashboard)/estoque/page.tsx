"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { apiFetch, obterUsuario } from "@/lib/api";
import type { Insumo } from "@/lib/tipos";

const UNIDADES = ["ml", "g", "un"];

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PaginaEstoque() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState(UNIDADES[0]);
  const [quantidadeMinima, setQuantidadeMinima] = useState("");
  const [custoPorUnidade, setCustoPorUnidade] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const usuarioLogado = obterUsuario();
    if (usuarioLogado?.papel !== "admin" && usuarioLogado?.papel !== "gerente") {
      router.replace("/");
      return;
    }
    setAutorizado(true);
    carregarInsumos();
  }, [router]);

  async function carregarInsumos() {
    setCarregando(true);
    setErro("");
    try {
      const dados = (await apiFetch("/api/insumos")) as Insumo[];
      setInsumos(dados);
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao carregar insumos");
    } finally {
      setCarregando(false);
    }
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setUnidade(UNIDADES[0]);
    setQuantidadeMinima("");
    setCustoPorUnidade("");
  }

  function iniciarEdicao(insumo: Insumo) {
    setEditandoId(insumo.id);
    setNome(insumo.nome);
    setUnidade(insumo.unidade);
    setQuantidadeMinima(String(insumo.quantidade_minima));
    setCustoPorUnidade(String(insumo.custo_por_unidade));
  }

  async function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const corpo = JSON.stringify({
        nome,
        unidade,
        quantidade_minima: Number(quantidadeMinima) || 0,
        custo_por_unidade: Number(custoPorUnidade) || 0,
      });
      if (editandoId) {
        await apiFetch(`/api/insumos/${editandoId}`, { method: "PUT", body: corpo });
      } else {
        await apiFetch("/api/insumos", { method: "POST", body: corpo });
      }
      limparFormulario();
      await carregarInsumos();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao salvar insumo");
    } finally {
      setSalvando(false);
    }
  }

  async function aoExcluir(insumo: Insumo) {
    try {
      await apiFetch(`/api/insumos/${insumo.id}`, { method: "DELETE" });
      if (editandoId === insumo.id) limparFormulario();
      await carregarInsumos();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao remover insumo");
    }
  }

  if (!autorizado) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold mb-4">Estoque</h1>

        {erro && <p className="text-sm text-marca-vermelho mb-3">{erro}</p>}
        {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

        {!carregando && insumos.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">Nenhum insumo cadastrado ainda.</p>
        )}

        {!carregando && insumos.length > 0 && (
          <div className="overflow-x-auto max-w-3xl">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="text-left border-b border-black/10 dark:border-white/10">
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Unidade</th>
                  <th className="py-2 pr-4">Em estoque</th>
                  <th className="py-2 pr-4">Mínimo</th>
                  <th className="py-2 pr-4">Custo/unidade</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => (
                  <tr
                    key={i.id}
                    className={`border-b border-black/5 dark:border-white/5 ${
                      i.quantidade_estoque <= i.quantidade_minima ? "bg-marca-vermelho/5" : ""
                    }`}
                  >
                    <td className="py-2 pr-4">{i.nome}</td>
                    <td className="py-2 pr-4">{i.unidade}</td>
                    <td className="py-2 pr-4">
                      {i.quantidade_estoque <= i.quantidade_minima ? (
                        <span className="font-semibold text-marca-vermelho">{i.quantidade_estoque}</span>
                      ) : (
                        i.quantidade_estoque
                      )}
                    </td>
                    <td className="py-2 pr-4">{i.quantidade_minima}</td>
                    <td className="py-2 pr-4">{formatarReal(i.custo_por_unidade)}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => iniciarEdicao(i)}
                          className="text-marca-azul hover:text-marca-vermelho"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => aoExcluir(i)}
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
      </div>

      <div className="max-w-sm">
        <h2 className="text-lg font-semibold mb-3">
          {editandoId ? "Editar insumo" : "Novo insumo"}
        </h2>
        <p className="text-xs text-black/60 dark:text-white/60 mb-3">
          A quantidade em estoque é ajustada em Movimentos de estoque, não aqui.
        </p>
        <form onSubmit={aoSalvar} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="insumo-nome">
              Nome
            </label>
            <input
              id="insumo-nome"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vodka"
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="insumo-unidade">
              Unidade
            </label>
            <select
              id="insumo-unidade"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className={CAMPO_CLASSE}
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="insumo-minima">
              Quantidade mínima (alerta)
            </label>
            <input
              id="insumo-minima"
              type="number"
              step="0.01"
              min="0"
              value={quantidadeMinima}
              onChange={(e) => setQuantidadeMinima(e.target.value)}
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="insumo-custo">
              Custo por unidade
            </label>
            <input
              id="insumo-custo"
              type="number"
              step="0.01"
              min="0"
              value={custoPorUnidade}
              onChange={(e) => setCustoPorUnidade(e.target.value)}
              className={CAMPO_CLASSE}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar insumo"}
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
