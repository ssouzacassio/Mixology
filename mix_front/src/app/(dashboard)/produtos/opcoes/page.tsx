"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { apiFetch, obterUsuario } from "@/lib/api";
import type { GrupoOpcao, Insumo } from "@/lib/tipos";

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

export default function PaginaGruposOpcao() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [grupos, setGrupos] = useState<GrupoOpcao[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [nomeGrupo, setNomeGrupo] = useState("");
  const [salvandoGrupo, setSalvandoGrupo] = useState(false);

  const [formOpcao, setFormOpcao] = useState<Record<string, { nome: string; insumoId: string; quantidade: string }>>(
    {}
  );

  useEffect(() => {
    const usuarioLogado = obterUsuario();
    if (usuarioLogado?.papel !== "admin" && usuarioLogado?.papel !== "gerente") {
      router.replace("/");
      return;
    }
    setAutorizado(true);
    carregarTudo();
  }, [router]);

  async function carregarTudo() {
    setCarregando(true);
    setErro("");
    try {
      const [dadosGrupos, dadosInsumos] = await Promise.all([
        apiFetch("/api/grupos-opcao") as Promise<GrupoOpcao[]>,
        apiFetch("/api/insumos") as Promise<Insumo[]>,
      ]);
      setGrupos(dadosGrupos);
      setInsumos(dadosInsumos);
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao carregar");
    } finally {
      setCarregando(false);
    }
  }

  async function aoCriarGrupo(evento: FormEvent) {
    evento.preventDefault();
    if (!nomeGrupo.trim()) return;
    setSalvandoGrupo(true);
    setErro("");
    try {
      await apiFetch("/api/grupos-opcao", {
        method: "POST",
        body: JSON.stringify({ nome: nomeGrupo.trim() }),
      });
      setNomeGrupo("");
      await carregarTudo();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao criar grupo");
    } finally {
      setSalvandoGrupo(false);
    }
  }

  async function aoExcluirGrupo(grupo: GrupoOpcao) {
    try {
      await apiFetch(`/api/grupos-opcao/${grupo.id}`, { method: "DELETE" });
      await carregarTudo();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao remover grupo");
    }
  }

  function campoOpcao(grupoId: string) {
    return formOpcao[grupoId] || { nome: "", insumoId: "", quantidade: "" };
  }

  function atualizarCampoOpcao(grupoId: string, campo: "nome" | "insumoId" | "quantidade", valor: string) {
    setFormOpcao((atual) => ({
      ...atual,
      [grupoId]: { ...campoOpcao(grupoId), [campo]: valor },
    }));
  }

  async function aoCriarOpcao(grupoId: string, evento: FormEvent) {
    evento.preventDefault();
    const campos = campoOpcao(grupoId);
    if (!campos.nome.trim()) return;
    setErro("");
    try {
      await apiFetch(`/api/grupos-opcao/${grupoId}/opcoes`, {
        method: "POST",
        body: JSON.stringify({
          nome: campos.nome.trim(),
          insumo_id: campos.insumoId || null,
          quantidade: Number(campos.quantidade) || 0,
        }),
      });
      setFormOpcao((atual) => ({ ...atual, [grupoId]: { nome: "", insumoId: "", quantidade: "" } }));
      await carregarTudo();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao criar opção");
    }
  }

  async function aoExcluirOpcao(opcaoId: string) {
    try {
      await apiFetch(`/api/opcoes/${opcaoId}`, { method: "DELETE" });
      await carregarTudo();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao remover opção");
    }
  }

  if (!autorizado) {
    return null;
  }

  return (
    <div>
      <Link
        href="/produtos"
        className="inline-flex items-center gap-1 text-sm text-marca-azul hover:text-marca-vermelho mb-4"
      >
        <ArrowLeft size={14} />
        Voltar para Produtos
      </Link>

      <h1 className="text-xl font-semibold mb-1">Grupos de opção</h1>
      <p className="text-sm text-black/60 dark:text-white/60 mb-6">
        Ex: um grupo &quot;Base alcoólica&quot; com as opções Vodka, Cachaça e Saquê; um grupo
        &quot;Fruta&quot; com Limão, Morango, Maracujá... Depois, vincule os grupos a um produto
        (ex: Caipirinha) na tela de Produtos.
      </p>

      {erro && <p className="text-sm text-marca-vermelho mb-3">{erro}</p>}
      {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

      {!carregando && (
        <div className="flex flex-col gap-6 max-w-2xl">
          <form onSubmit={aoCriarGrupo} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" htmlFor="novo-grupo">
                Novo grupo de opção
              </label>
              <input
                id="novo-grupo"
                value={nomeGrupo}
                onChange={(e) => setNomeGrupo(e.target.value)}
                placeholder="Ex: Base alcoólica"
                className={CAMPO_CLASSE}
              />
            </div>
            <button
              type="submit"
              disabled={salvandoGrupo}
              className="flex items-center gap-1 rounded bg-marca-vermelho text-white font-medium px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={16} />
              Criar
            </button>
          </form>

          {grupos.length === 0 && (
            <p className="text-sm text-black/60 dark:text-white/60">Nenhum grupo de opção cadastrado ainda.</p>
          )}

          {grupos.map((grupo) => {
            const campos = campoOpcao(grupo.id);
            return (
              <div key={grupo.id} className="rounded-lg border border-marca-azul/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold">{grupo.nome}</h2>
                  <button
                    onClick={() => aoExcluirGrupo(grupo)}
                    className="text-black/40 dark:text-white/40 hover:text-marca-vermelho"
                    title="Remover grupo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {grupo.opcoes.length > 0 && (
                  <table className="w-full text-sm border-collapse mb-3">
                    <thead>
                      <tr className="text-left border-b border-black/10 dark:border-white/10">
                        <th className="py-1.5 pr-4">Opção</th>
                        <th className="py-1.5 pr-4">Insumo</th>
                        <th className="py-1.5 pr-4">Qtd/unidade</th>
                        <th className="py-1.5 pr-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.opcoes.map((opcao) => (
                        <tr key={opcao.id} className="border-b border-black/5 dark:border-white/5">
                          <td className="py-1.5 pr-4">{opcao.nome}</td>
                          <td className="py-1.5 pr-4">
                            {opcao.insumo ? `${opcao.insumo.nome} (${opcao.insumo.unidade})` : "—"}
                          </td>
                          <td className="py-1.5 pr-4">{opcao.quantidade || "—"}</td>
                          <td className="py-1.5 pr-4">
                            <button
                              onClick={() => aoExcluirOpcao(opcao.id)}
                              className="text-black/40 dark:text-white/40 hover:text-marca-vermelho"
                              title="Remover opção"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <form
                  onSubmit={(e) => aoCriarOpcao(grupo.id, e)}
                  className="flex flex-wrap items-end gap-2 text-sm"
                >
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-medium mb-1">Nome da opção</label>
                    <input
                      value={campos.nome}
                      onChange={(e) => atualizarCampoOpcao(grupo.id, "nome", e.target.value)}
                      placeholder="Ex: Vodka"
                      className={CAMPO_CLASSE}
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-medium mb-1">Insumo (estoque)</label>
                    <select
                      value={campos.insumoId}
                      onChange={(e) => atualizarCampoOpcao(grupo.id, "insumoId", e.target.value)}
                      className={CAMPO_CLASSE}
                    >
                      <option value="">Nenhum</option>
                      {insumos.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nome} ({i.unidade})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-medium mb-1">Qtd/unidade</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={campos.quantidade}
                      onChange={(e) => atualizarCampoOpcao(grupo.id, "quantidade", e.target.value)}
                      className={CAMPO_CLASSE}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded bg-marca-azul text-white font-medium px-3 py-2 hover:opacity-90"
                  >
                    <Plus size={14} />
                    Adicionar
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
