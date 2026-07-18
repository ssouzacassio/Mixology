"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { apiFetch, obterUsuario, type Usuario } from "@/lib/api";
import BarraPesquisa from "@/components/BarraPesquisa";

const PAPEIS = [
  { valor: "atendente", label: "Atendente" },
  { valor: "estoquista", label: "Estoquista" },
  { valor: "admin", label: "Admin" },
];

export default function PaginaUsuarios() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [busca, setBusca] = useState("");

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState("atendente");
  const [erroCriar, setErroCriar] = useState("");
  const [criando, setCriando] = useState(false);

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

  async function aoCriarUsuario(evento: FormEvent) {
    evento.preventDefault();
    setErroCriar("");
    setCriando(true);
    try {
      await apiFetch("/api/autenticacao/registrar", {
        method: "POST",
        body: JSON.stringify({
          nome_completo: nomeCompleto,
          usuario: nomeUsuario,
          senha,
          papel,
        }),
      });
      setNomeCompleto("");
      setNomeUsuario("");
      setSenha("");
      setPapel("atendente");
      await carregarUsuarios();
    } catch (erro) {
      setErroCriar(erro instanceof Error ? erro.message : "Falha ao criar");
    } finally {
      setCriando(false);
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
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-4">{u.nome_completo}</td>
                  <td className="py-2 pr-4">{u.usuario}</td>
                  <td className="py-2 pr-4">{u.papel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="max-w-sm">
        <h2 className="text-lg font-semibold mb-3">Cadastrar funcionário</h2>
        <form onSubmit={aoCriarUsuario} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="novo-nome">
              Nome completo
            </label>
            <input
              id="novo-nome"
              required
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className="w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul"
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
              onChange={(e) => setNomeUsuario(e.target.value)}
              className="w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nova-senha">
              Senha
            </label>
            <input
              id="nova-senha"
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul"
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
              className="w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul"
            >
              {PAPEIS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {erroCriar && <p className="text-sm text-marca-vermelho">{erroCriar}</p>}

          <button
            type="submit"
            disabled={criando}
            className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
          >
            {criando ? "Criando..." : "Criar funcionário"}
          </button>
        </form>
      </div>
    </div>
  );
}
