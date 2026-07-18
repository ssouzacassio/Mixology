"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { apiFetch, obterUsuario, type Usuario } from "@/lib/api";
import BarraPesquisa from "@/components/BarraPesquisa";
import { formatarNomeUsuario } from "@/lib/nomeUsuario";

const PAPEIS = [
  { valor: "atendente", label: "Atendente" },
  { valor: "caixa", label: "Caixa" },
  { valor: "bartender", label: "Bartender" },
  { valor: "gerente", label: "Gerente" },
  { valor: "admin", label: "Admin" },
];

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

export default function PaginaUsuarios() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [busca, setBusca] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState("atendente");
  const [ativo, setAtivo] = useState(true);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const usuarioLogado = obterUsuario();
    if (usuarioLogado?.papel !== "admin") {
      router.replace("/");
      return;
    }
    setAutorizado(true);
    carregarUsuarios();
  }, [router]);

  async function carregarUsuarios() {
    setCarregandoLista(true);
    setErroLista("");
    try {
      const dados = (await apiFetch("/api/usuarios")) as Usuario[];
      setUsuarios(dados);
    } catch (erro) {
      setErroLista(erro instanceof Error ? erro.message : "Falha ao carregar");
    } finally {
      setCarregandoLista(false);
    }
  }

  function iniciarEdicao(usuario: Usuario) {
    setEditandoId(usuario.id);
    setNomeCompleto(usuario.nome_completo);
    setNomeUsuario(usuario.usuario);
    setPapel(usuario.papel);
    setAtivo(usuario.ativo);
    setSenha("");
    setErroForm("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setNomeCompleto("");
    setNomeUsuario("");
    setPapel("atendente");
    setAtivo(true);
    setSenha("");
    setErroForm("");
  }

  async function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    setErroForm("");
    setSalvando(true);
    try {
      if (editandoId) {
        await apiFetch(`/api/usuarios/${editandoId}`, {
          method: "PUT",
          body: JSON.stringify({
            nome_completo: nomeCompleto,
            usuario: nomeUsuario,
            papel,
            ativo,
          }),
        });
        if (senha) {
          await apiFetch(`/api/usuarios/${editandoId}/senha`, {
            method: "PUT",
            body: JSON.stringify({ senha_nova: senha }),
          });
        }
      } else {
        await apiFetch("/api/autenticacao/registrar", {
          method: "POST",
          body: JSON.stringify({
            nome_completo: nomeCompleto,
            usuario: nomeUsuario,
            senha,
            papel,
          }),
        });
      }
      cancelarEdicao();
      await carregarUsuarios();
    } catch (erro) {
      setErroForm(erro instanceof Error ? erro.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  if (!autorizado) {
    return null;
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const alvo = busca.trim().toLowerCase();
    if (!alvo) return true;
    return (
      u.nome_completo.toLowerCase().includes(alvo) ||
      u.usuario.toLowerCase().includes(alvo)
    );
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-xl font-semibold">Funcionários</h1>
          <BarraPesquisa
            valor={busca}
            aoMudar={setBusca}
            placeholder="Buscar funcionário..."
            className="w-full max-w-xs"
          />
        </div>

        {carregandoLista && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}
        {erroLista && <p className="text-sm text-marca-vermelho">{erroLista}</p>}

        {!carregandoLista && !erroLista && usuariosFiltrados.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">Nenhum funcionário encontrado.</p>
        )}

        {!carregandoLista && !erroLista && usuariosFiltrados.length > 0 && (
          <table className="w-full text-sm border-collapse max-w-2xl">
            <thead>
              <tr className="text-left border-b border-black/10 dark:border-white/10">
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">Usuário</th>
                <th className="py-2 pr-4">Papel</th>
                <th className="py-2 pr-4">Ativo</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-black/5 dark:border-white/5 ${
                    u.ativo ? "" : "opacity-50"
                  }`}
                >
                  <td className="py-2 pr-4">{u.nome_completo}</td>
                  <td className="py-2 pr-4">{u.usuario}</td>
                  <td className="py-2 pr-4">{u.papel}</td>
                  <td className="py-2 pr-4">{u.ativo ? "Sim" : "Não"}</td>
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => iniciarEdicao(u)}
                      className="flex items-center gap-1 text-marca-azul hover:text-marca-vermelho"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="max-w-sm">
        <h2 className="text-lg font-semibold mb-3">
          {editandoId ? "Editar funcionário" : "Cadastrar funcionário"}
        </h2>
        <form onSubmit={aoSalvar} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="novo-nome">
              Nome completo
            </label>
            <input
              id="novo-nome"
              required
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="novo-usuario">
              Usuário
            </label>
            <input
              id="novo-usuario"
              type="text"
              required
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(formatarNomeUsuario(e.target.value))}
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nova-senha">
              {editandoId ? "Nova senha (deixe em branco pra manter)" : "Senha"}
            </label>
            <input
              id="nova-senha"
              type="password"
              required={!editandoId}
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={CAMPO_CLASSE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="novo-papel">
              Papel
            </label>
            <select
              id="novo-papel"
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              className={CAMPO_CLASSE}
            >
              {PAPEIS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {editandoId && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              Ativo (desmarque pra bloquear o login)
            </label>
          )}

          {erroForm && <p className="text-sm text-marca-vermelho">{erroForm}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Criar funcionário"}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicao}
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
