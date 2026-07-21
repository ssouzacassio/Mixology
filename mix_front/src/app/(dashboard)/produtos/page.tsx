"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListChecks, Pencil, Power, Trash2 } from "lucide-react";

import { apiFetch, obterUsuario } from "@/lib/api";
import type { GrupoOpcao, Produto } from "@/lib/tipos";

const CATEGORIAS = ["Drinks", "Cervejas", "Bebidas não alcoólicas", "Petiscos", "Outro"];

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PaginaProdutos() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [grupos, setGrupos] = useState<GrupoOpcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [preco, setPreco] = useState("");
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const usuarioLogado = obterUsuario();
    if (usuarioLogado?.papel !== "admin" && usuarioLogado?.papel !== "gerente") {
      router.replace("/");
      return;
    }
    setAutorizado(true);
    carregarProdutos();
  }, [router]);

  async function carregarProdutos() {
    setCarregando(true);
    setErro("");
    try {
      const [dadosProdutos, dadosGrupos] = await Promise.all([
        apiFetch("/api/produtos") as Promise<Produto[]>,
        apiFetch("/api/grupos-opcao") as Promise<GrupoOpcao[]>,
      ]);
      setProdutos(dadosProdutos);
      setGrupos(dadosGrupos);
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao carregar produtos");
    } finally {
      setCarregando(false);
    }
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setDescricao("");
    setCategoria(CATEGORIAS[0]);
    setPreco("");
    setGruposSelecionados([]);
  }

  function iniciarEdicao(produto: Produto) {
    setEditandoId(produto.id);
    setNome(produto.nome);
    setDescricao(produto.descricao);
    setCategoria(produto.categoria || CATEGORIAS[0]);
    setPreco(String(produto.preco));
    setGruposSelecionados((produto.grupos_opcao || []).map((v) => v.grupo_opcao_id));
  }

  function aoAlternarGrupo(grupoId: string) {
    setGruposSelecionados((atual) =>
      atual.includes(grupoId) ? atual.filter((id) => id !== grupoId) : [...atual, grupoId]
    );
  }

  async function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const corpo = JSON.stringify({
        nome,
        descricao,
        categoria,
        preco: Number(preco),
      });
      let produtoId = editandoId;
      if (editandoId) {
        await apiFetch(`/api/produtos/${editandoId}`, { method: "PUT", body: corpo });
      } else {
        const criado = (await apiFetch("/api/produtos", { method: "POST", body: corpo })) as Produto;
        produtoId = criado.id;
      }
      if (produtoId) {
        await apiFetch(`/api/produtos/${produtoId}/grupos-opcao`, {
          method: "PUT",
          body: JSON.stringify({ grupo_opcao_ids: gruposSelecionados }),
        });
      }
      limparFormulario();
      await carregarProdutos();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao salvar produto");
    } finally {
      setSalvando(false);
    }
  }

  async function aoAlternarAtivo(produto: Produto) {
    try {
      await apiFetch(`/api/produtos/${produto.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: produto.nome,
          descricao: produto.descricao,
          categoria: produto.categoria,
          preco: produto.preco,
          ativo: !produto.ativo,
        }),
      });
      await carregarProdutos();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao atualizar produto");
    }
  }

  async function aoExcluir(produto: Produto) {
    try {
      await apiFetch(`/api/produtos/${produto.id}`, { method: "DELETE" });
      if (editandoId === produto.id) limparFormulario();
      await carregarProdutos();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao remover produto");
    }
  }

  if (!autorizado) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Produtos</h1>
          <Link
            href="/produtos/opcoes"
            className="flex items-center gap-1 text-sm text-marca-azul hover:text-marca-vermelho"
          >
            <ListChecks size={14} />
            Grupos de opção
          </Link>
        </div>

        {erro && <p className="text-sm text-marca-vermelho mb-3">{erro}</p>}
        {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

        {!carregando && produtos.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">Nenhum produto cadastrado ainda.</p>
        )}

        {!carregando && produtos.length > 0 && (
          <div className="overflow-x-auto max-w-3xl">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="text-left border-b border-black/10 dark:border-white/10">
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Categoria</th>
                  <th className="py-2 pr-4">Preço</th>
                  <th className="py-2 pr-4">Opções</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-black/5 dark:border-white/5 ${!p.ativo ? "opacity-50" : ""}`}
                  >
                    <td className="py-2 pr-4">{p.nome}</td>
                    <td className="py-2 pr-4">{p.categoria || "—"}</td>
                    <td className="py-2 pr-4">{formatarReal(p.preco)}</td>
                    <td className="py-2 pr-4 text-xs text-black/60 dark:text-white/60">
                      {(p.grupos_opcao || []).map((v) => v.grupo_opcao?.nome).filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {p.ativo ? (
                        <span className="text-green-700 dark:text-green-500">Ativo</span>
                      ) : (
                        <span className="text-red/60 dark:text-red/60">Inativo</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => iniciarEdicao(p)}
                          className="text-marca-azul hover:text-marca-vermelho"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => aoAlternarAtivo(p)}
                          className="text-black/40 dark:text-white/40 hover:text-marca-vermelho"
                          title={p.ativo ? "Inativar (some do cardápio de atendimento)" : "Reativar"}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() => aoExcluir(p)}
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
          {editandoId ? "Editar produto" : "Novo produto"}
        </h2>
        <form onSubmit={aoSalvar} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="produto-nome">
              Nome
            </label>
            <input
              id="produto-nome"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Caipirinha"
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="produto-descricao">
              Descrição
            </label>
            <input
              id="produto-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Opcional"
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="produto-categoria">
              Categoria
            </label>
            <select
              id="produto-categoria"
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
            <label className="block text-sm font-medium mb-1" htmlFor="produto-preco">
              Preço
            </label>
            <input
              id="produto-preco"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className={CAMPO_CLASSE}
            />
          </div>

          {grupos.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Grupos de opção</label>
              <div className="flex flex-col gap-1.5 rounded border border-black/15 dark:border-white/15 p-2">
                {grupos.map((grupo) => (
                  <label key={grupo.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={gruposSelecionados.includes(grupo.id)}
                      onChange={() => aoAlternarGrupo(grupo.id)}
                    />
                    {grupo.nome}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar produto"}
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
